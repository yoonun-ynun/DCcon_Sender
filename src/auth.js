import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn } = NextAuth({
    session: {
        strategy: 'jwt',
    },

    trustHost: true,

    cookies: {
        csrfToken: {
            name: '__Host-next-auth.csrf-token',
            options: {
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                secure: true,
            },
        },

        sessionToken: {
            name: '__Secure-next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                secure: true,
            },
        },
    },

    providers: [
        Discord({
            authorization: {
                params: {
                    scope: 'identify email guilds',
                },
            },
        }),

        /*
         * 기존 Discord Activity Embedded OAuth 인증
         */
        Credentials({
            id: 'discord-embedded',

            credentials: {
                code: {
                    label: 'OAuth Code',
                    type: 'text',
                },
                instanceId: {
                    label: 'Instance ID',
                    type: 'text',
                },
                guildId: {
                    label: 'Guild ID',
                    type: 'text',
                },
            },

            async authorize(credentials) {
                const code = String(credentials?.code ?? '').trim();

                const instanceId = String(credentials?.instanceId ?? '').trim();

                const guildId = String(credentials?.guildId ?? '').trim();

                if (!code || !instanceId || !guildId) {
                    return null;
                }

                const verified = await verifyEmbeddedProof({
                    code,
                    instanceId,
                    guildId,
                });

                if (!verified) {
                    return null;
                }

                return {
                    id: verified.user_id,
                    name: verified.username,
                    username: verified.username,
                    image: verified.image,

                    providerTag: 'discord-embedded',

                    accessToken: verified.access_token,
                    refreshToken: verified.refresh_token,
                    expiresAt: verified.expires_at,
                };
            },
        }),

        /*
         * Discord 클라이언트 DOM에서 전달받은
         * userId + channelId + messageId 기반 인증
         */
        Credentials({
            id: 'discord-channel-proof',

            credentials: {
                userId: {
                    label: 'Discord User ID',
                    type: 'text',
                },
                channelId: {
                    label: 'Discord Channel ID',
                    type: 'text',
                },
                messageId: {
                    label: 'Discord Message ID',
                    type: 'text',
                },
            },

            async authorize(credentials) {
                const userId = String(credentials?.userId ?? '').trim();

                const channelId = String(credentials?.channelId ?? '').trim();

                const messageId = String(credentials?.messageId ?? '').trim();

                if (
                    !isDiscordSnowflake(userId) ||
                    !isDiscordSnowflake(channelId) ||
                    !isDiscordSnowflake(messageId)
                ) {
                    return null;
                }

                const verified = await verifyChannelProof({
                    userId,
                    channelId,
                    messageId,
                });

                if (!verified) {
                    return null;
                }

                return {
                    id: verified.user_id,
                    name: verified.username,
                    username: verified.username,
                    image: verified.image,

                    providerTag: 'discord-channel-proof',
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, account, user }) {
            /*
             * 일반 Discord OAuth Provider
             */
            if (account?.provider === 'discord' && account.providerAccountId) {
                token.discordId = account.providerAccountId;

                token.authType = 'discord-oauth';

                delete token.discordEmbedded;

                return token;
            }

            /*
             * Discord Embedded 로그인
             */
            if (
                account?.provider === 'discord-embedded' ||
                user?.providerTag === 'discord-embedded'
            ) {
                if (typeof user?.expiresAt !== 'number') {
                    return token;
                }

                token.discordId = String(user.id);

                token.name = user.name ?? user.username ?? null;

                token.image = user.image ?? null;

                token.authType = 'discord-embedded';

                token.discordEmbedded = {
                    username: user.name ?? user.username ?? null,

                    accessToken: user.accessToken,

                    refreshToken: user.refreshToken,

                    expiresAt: user.expiresAt,
                };

                return token;
            }

            /*
             * userId + channelId + messageId 로그인
             */
            if (
                account?.provider === 'discord-channel-proof' ||
                user?.providerTag === 'discord-channel-proof'
            ) {
                token.discordId = String(user.id);

                token.name = user.name ?? user.username ?? null;

                token.image = user.image ?? null;

                token.authType = 'discord-channel-proof';

                /*
                 * 이전 embedded 로그인 정보가 JWT에
                 * 남아 있지 않도록 제거
                 */
                delete token.discordEmbedded;

                return token;
            }

            /*
             * Embedded 방식으로 로그인한 세션만
             * Discord OAuth 토큰 갱신 처리
             */
            if (token.authType !== 'discord-embedded') {
                return token;
            }

            const de = token.discordEmbedded;

            if (!de?.accessToken || !de?.refreshToken || !de?.expiresAt) {
                return token;
            }

            if (Date.now() < de.expiresAt - 30_000) {
                return token;
            }

            const refreshed = await refreshDiscordToken(de.refreshToken);

            if (!refreshed) {
                token.discordEmbedded = {
                    ...de,
                    error: 'reauth_required',
                };

                return token;
            }

            token.discordEmbedded = {
                ...de,

                accessToken: refreshed.access_token,

                refreshToken: refreshed.refresh_token,

                expiresAt: refreshed.expires_at,

                error: undefined,
            };

            return token;
        },

        async session({ session, token }) {
            session.user = {
                ...(session.user ?? {}),

                ...(token?.discordId
                    ? {
                          discordId: String(token.discordId),
                      }
                    : {}),

                ...(token?.name
                    ? {
                          name: String(token.name),
                      }
                    : {}),

                ...(token?.image
                    ? {
                          image: String(token.image),
                      }
                    : {}),

                ...(token?.authType
                    ? {
                          authType: String(token.authType),
                      }
                    : {}),

                ...(token?.discordEmbedded?.error === 'reauth_required'
                    ? {
                          refreshExpire: true,
                      }
                    : {}),
            };

            return session;
        },
    },
});

/*
 * Discord ID 형식 검사
 */
function isDiscordSnowflake(value) {
    return /^\d{17,20}$/.test(value);
}

/*
 * Bot Token을 이용한 Discord REST API 요청
 */
async function discordBotFetch(path) {
    return fetch(`https://discord.com/api/v10${path}`, {
        method: 'GET',

        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,

            'User-Agent': `DCcon_Sender (${process.env.AUTH_URL}, 1.0)`,
        },

        cache: 'no-store',
    });
}

/*
 * userId + channelId + messageId 검증
 *
 * 1. channelId가 실제 길드 채널인지 확인
 * 2. messageId가 해당 채널에 실제 존재하는지 확인
 * 3. userId가 해당 길드의 멤버인지 확인
 * 4. 길드 닉네임과 길드 아바타 조회
 */
export async function verifyChannelProof({ userId, channelId, messageId }) {
    const channelResponse = await discordBotFetch(`/channels/${channelId}`);

    if (!channelResponse.ok) {
        console.log('channel info http req error:', channelResponse.status);

        return null;
    }

    const channel = await channelResponse.json();

    const guildId = channel?.guild_id;

    if (!guildId) {
        console.log('길드 채널이 아님');

        return null;
    }

    const [messageResponse, memberResponse] = await Promise.all([
        discordBotFetch(`/channels/${channelId}/messages/${messageId}`),

        discordBotFetch(`/guilds/${guildId}/members/${userId}`),
    ]);

    if (!messageResponse.ok) {
        console.log('message info http req error:', messageResponse.status);

        return null;
    }

    if (!memberResponse.ok) {
        console.log('guild member http req error:', memberResponse.status);

        return null;
    }

    const message = await messageResponse.json();

    const member = await memberResponse.json();

    if (String(message?.id) !== messageId || String(message?.channel_id) !== channelId) {
        console.log('메시지 정보 불일치');

        return null;
    }

    if (String(member?.user?.id) !== userId) {
        console.log('길드 멤버 정보 불일치');

        return null;
    }

    const username = member.nick ?? member.user.global_name ?? member.user.username;

    if (!username) {
        console.log('username 없음');

        return null;
    }

    const image = getGuildMemberAvatarUrl({
        guildId,
        member,
    });

    return {
        user_id: userId,
        guild_id: guildId,
        channel_id: channelId,
        username,
        image,
    };
}

/*
 * 길드 전용 아바타 우선
 * 없으면 일반 Discord 아바타 사용
 */
function getGuildMemberAvatarUrl({ guildId, member }) {
    const user = member.user;

    if (member.avatar) {
        const extension = member.avatar.startsWith('a_') ? 'gif' : 'png';

        return (
            `https://cdn.discordapp.com/guilds/` +
            `${guildId}/users/${user.id}/avatars/` +
            `${member.avatar}.${extension}?size=128`
        );
    }

    if (user.avatar) {
        const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';

        return (
            `https://cdn.discordapp.com/avatars/` +
            `${user.id}/${user.avatar}.` +
            `${extension}?size=128`
        );
    }

    const defaultAvatarIndex = getDefaultAvatarIndex(user);

    return `https://cdn.discordapp.com/embed/avatars/` + `${defaultAvatarIndex}.png`;
}

function getDefaultAvatarIndex(user) {
    /*
     * 기존 discriminator 사용 계정
     */
    if (user.discriminator && user.discriminator !== '0') {
        return Number(user.discriminator) % 5;
    }

    /*
     * 새로운 username 시스템 계정
     */
    try {
        return Number((BigInt(user.id) >> 22n) % 6n);
    } catch {
        return 0;
    }
}

/*
 * Discord Embedded OAuth 토큰 갱신
 */
export async function refreshDiscordToken(refreshToken) {
    const refreshResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',

        body: new URLSearchParams({
            client_id: process.env.AUTH_DISCORD_ID,

            client_secret: process.env.AUTH_DISCORD_SECRET,

            grant_type: 'refresh_token',

            refresh_token: refreshToken,
        }),

        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!refreshResponse.ok) {
        console.log('refresh token http req error:', refreshResponse.status);

        return null;
    }

    const refreshJson = await refreshResponse.json();

    const accessToken = refreshJson?.access_token;

    const expiresIn = refreshJson?.expires_in;

    const newRefreshToken = refreshJson?.refresh_token;

    if (!accessToken || typeof expiresIn !== 'number') {
        return null;
    }

    return {
        access_token: accessToken,

        refresh_token: newRefreshToken ?? refreshToken,

        expires_at: Date.now() + expiresIn * 1000,
    };
}

/*
 * 기존 Discord Activity Embedded OAuth 검증
 */
export async function verifyEmbeddedProof({ code, instanceId, guildId }) {
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',

        body: new URLSearchParams({
            client_id: process.env.AUTH_DISCORD_ID,

            client_secret: process.env.AUTH_DISCORD_SECRET,

            grant_type: 'authorization_code',

            code,

            redirect_uri: process.env.AUTH_URL + '/api/auth/callback/discord',
        }),

        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!tokenResponse.ok) {
        console.log(tokenResponse.status);

        console.log('token http req error');

        const error = await tokenResponse.json().catch(() => null);

        console.log(error);

        return null;
    }

    const tokenJson = await tokenResponse.json();

    const accessToken = tokenJson?.access_token;

    const refreshToken = tokenJson?.refresh_token;

    const expiresIn = tokenJson?.expires_in;

    if (!accessToken || !refreshToken || typeof expiresIn !== 'number') {
        console.log('access token 발급 오류');

        return null;
    }

    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        method: 'GET',

        headers: {
            Authorization: `Bearer ${accessToken}`,
        },

        cache: 'no-store',
    });

    if (!userResponse.ok) {
        console.log('user http req error');

        return null;
    }

    const user = await userResponse.json();

    const userId = user?.id;

    let username = user?.username;

    if (!username) {
        console.log('username 없음');

        return null;
    }

    if (!userId) {
        console.log('userid 없음');

        return null;
    }

    let avatarUrl = getGuildMemberAvatarUrl({
        guildId,
        member: {
            avatar: null,
            user,
        },
    });

    const memberResponse = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
        {
            method: 'GET',

            headers: {
                Authorization: `Bearer ${accessToken}`,
            },

            cache: 'no-store',
        },
    );

    if (!memberResponse.ok) {
        console.log('guild member http req error:', memberResponse.status);

        return null;
    }

    const member = await memberResponse.json();

    const serverName = member.nick ?? user.global_name ?? user.username;

    if (serverName) {
        username = serverName;
    }

    avatarUrl = getGuildMemberAvatarUrl({
        guildId,
        member: {
            ...member,
            user,
        },
    });

    const instanceResponse = await fetch(
        `https://discord.com/api/v10/applications/` +
            `${process.env.APPLICATION_ID}/` +
            `activity-instances/${instanceId}`,
        {
            method: 'GET',

            headers: {
                Authorization: `Bot ${process.env.DISCORD_TOKEN}`,

                'User-Agent': `DCcon_Sender (${process.env.AUTH_URL}, 1.0)`,
            },

            cache: 'no-store',
        },
    );

    if (!instanceResponse.ok) {
        console.log('instance info http req error');

        return null;
    }

    const instance = await instanceResponse.json();

    const users = instance.users ?? [];

    if (!users.includes(userId)) {
        console.log('유저가 포함 안되어있음');

        return null;
    }

    return {
        user_id: userId,
        username,
        image: avatarUrl,

        access_token: accessToken,
        refresh_token: refreshToken,

        expires_at: Date.now() + expiresIn * 1000,
    };
}
