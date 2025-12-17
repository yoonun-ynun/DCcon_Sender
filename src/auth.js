import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn } = NextAuth({
    session: { strategy: 'jwt' },
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
            authorization: { params: { scope: 'identify email guilds' } },
        }),
        Credentials({
            id: 'discord-embedded',
            credentials: {
                code: { label: 'OAuth Code', type: 'text' },
                instanceId: { label: 'Instance ID', type: 'text' },
            },
            authorize: async function (credentials) {
                const code = credentials?.code;
                const instanceId = credentials?.instanceId;
                if (!code || !instanceId) return null;
                const verified = await verifyEmbeddedProof({ code, instanceId });
                if (!verified) return null;

                return {
                    id: verified.user_id,
                    username: verified.username,
                    providerTag: 'discord-embedded',
                    accessToken: verified.access_token,
                    refreshToken: verified.refresh_token,
                    expiresAt: verified.expires_at,
                    image: verified.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            //Discord provider
            if (account?.provider === 'discord' && account.providerAccountId) {
                token.discordId = account.providerAccountId; // 디스코드 고유 ID
            }

            //Discord-embedded token rotation
            if (user?.providerTag === 'discord-embedded') {
                if (typeof user?.expiresAt !== 'number') return token;
                token.discordId = user?.id;
                token.name = user?.username;
                token.image = user?.image;
                token.discordEmbedded = {
                    username: user?.username,
                    accessToken: user?.accessToken,
                    refreshToken: user?.refreshToken,
                    expiresAt: user?.expiresAt,
                };
                return token;
            }
            const de = token?.discordEmbedded;
            if (!de?.accessToken || !de?.refreshToken || !de?.expiresAt) return token;

            if (Date.now() < de.expiresAt - 30_000) return token;
            const refreshed = await refreshDiscordToken(de.refreshToken); //추후구현

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
            };
            return token;
        },
        async session({ session, token }) {
            // noinspection JSValidateTypes
            session.user = {
                ...(session.user ?? {}),
                ...(token?.discordId ? { discordId: String(token.discordId) } : {}),
                ...(token?.name ? { name: String(token?.name) } : {}),
                ...(token?.image ? { image: String(token?.image) } : {}),
                ...(token?.discordEmbedded?.error === 'reauth_required'
                    ? { refreshExpire: true }
                    : {}),
            };
            return session;
        },
    },
});

export async function refreshDiscordToken(refreshToken) {
    const refresh_res = await fetch('https://discord.com/api/v10/oauth2/token', {
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
    if (!refresh_res.ok) return null;
    const refresh_json = await refresh_res.json();
    const access_token = refresh_json?.access_token;
    const expires_in = refresh_json?.expires_in;
    const refresh_token = refresh_json?.refresh_token;

    if (!access_token || typeof expires_in !== 'number') return null;

    return {
        access_token: access_token,
        refresh_token: refresh_token ?? refreshToken,
        expires_at: Date.now() + expires_in * 1000,
    };
}

export async function verifyEmbeddedProof({ code, instanceId }) {
    const conv_code = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: process.env['AUTH_DISCORD_ID'],
            client_secret: process.env['AUTH_DISCORD_SECRET'],
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env['AUTH_URL'] + '/api/auth/callback/discord',
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    if (!conv_code.ok) {
        console.log(conv_code.status);
        console.log('token http req error');
        const error = await conv_code.json();
        console.log(error);
        return null;
    }
    const conv_json = await conv_code.json();
    const access_token = conv_json?.access_token;
    const refresh_token = conv_json?.refresh_token;
    const expires_in = conv_json?.expires_in;
    if (!access_token || !refresh_token || typeof expires_in != 'number') {
        console.log('access token 발급 오류');
        return null;
    }

    const token_res = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` },
        method: 'GET',
    });
    if (!token_res.ok) {
        console.log('user http req error');
        return null;
    }
    const token_json = await token_res.json();
    const user_id = token_json['id'];
    const username = token_json['username'];
    const avatar = token_json['avatar'];
    let avatar_url;
    if (avatar) {
        avatar_url = `https://cdn.discordapp.com/avatars/${user_id}/${avatar}.png`;
    } else {
        avatar_url = `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
    if (!username) {
        console.log('username 없음');
        return null;
    }
    if (!user_id) {
        console.log('userid 없음');
        return null;
    }

    const instance_res = await fetch(
        `https://discord.com/api/v10/applications/${process.env['APPLICATION_ID']}/activity-instances/${instanceId}`,
        {
            headers: {
                Authorization: `Bot ${process.env['DISCORD_TOKEN']}`,
                'User-Agent': `DCcon_Sender (${process.env['AUTH_URL']}, 1.0)`,
            },
            method: 'GET',
        },
    );
    if (!instance_res.ok) {
        console.log('instance info http req error');
        return null;
    }
    const instance_json = await instance_res.json();
    const users = instance_json.users ?? [];
    if (!users.includes(user_id)) {
        console.log('유저가 포함 안되어있음');
        return null;
    }

    return {
        user_id,
        username,
        image: avatar_url,
        access_token,
        refresh_token,
        expires_at: Date.now() + expires_in * 1000,
    };
}
