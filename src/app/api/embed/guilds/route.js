import { decode } from 'next-auth/jwt';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Token from '@/models/Token';
import { decrypt } from '@/app/api/embed/crypter';

export async function POST(req) {
    const { cookieUsable } = await req.json();
    let access_token;
    if (cookieUsable) {
        const headerList = await headers();
        const cookieHeader = headerList.get('cookie');
        if (!cookieHeader)
            return NextResponse.json({ ok: false, reason: 'no_cookie' }, { status: 401 });
        const cookieList = parseCookies(cookieHeader);
        const sessionToken = cookieList['__Secure-next-auth.session-token'];

        if (!sessionToken) {
            return NextResponse.json({ ok: false, reason: 'no_cookie' }, { status: 401 });
        }
        const decodedToken = await decode({
            token: decodeURIComponent(sessionToken),
            secret: process.env.AUTH_SECRET,
            salt: '__Secure-next-auth.session-token',
        });

        if (!decodedToken) {
            return NextResponse.json({ ok: false, reason: 'decode_fail' }, { status: 401 });
        }

        access_token = decodedToken.discordEmbedded?.accessToken;
        if (!access_token) {
            console.log('JWT token missing');
            return NextResponse.json({ ok: false, reason: 'token is missing' }, { status: 401 });
        }
    } else {
        const headerList = await headers();
        const h = headerList.get('authorization');
        if (!h?.startsWith('Bearer ')) {
            return NextResponse.json({ ok: false, reason: 'invalid header' }, { status: 401 });
        }

        const jwt = h.slice('Bearer '.length);
        const payload = await decode({
            token: jwt,
            secret: process.env.AUTH_SECRET,
            salt: 'embedded-token',
        });
        if (!payload)
            return NextResponse.json({ ok: false, reason: 'invalid token' }, { status: 401 });
        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp;
        if (!exp || now >= exp)
            return NextResponse.json({ ok: false, reason: 'expired token' }, { status: 401 });
        const user_id = payload?.discordId;
        if (!user_id)
            return NextResponse.json({ ok: false, reason: 'user_id is missing' }, { status: 401 });
        const tokens = await Token.findOne({ user_id: user_id }).lean();
        if (!tokens)
            return NextResponse.json({ ok: false, reason: 'token is missing' }, { status: 401 });
        if (tokens.expires_at <= Date.now())
            return NextResponse.json({ ok: false, reason: 'expired token' }, { status: 401 });
        access_token = decrypt(tokens.access_token);
    }
    if (!access_token) {
        console.log('access_token missing');
        return NextResponse.json({ ok: false, reason: 'missing token' }, { status: 401 });
    }

    const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        method: 'GET',
        headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!res.ok)
        return NextResponse.json({ ok: false, reason: 'Error during Ajax' }, { status: 401 });
    const guilds = await res.json();
    if (!guilds) return NextResponse.json({ ok: false, reason: 'invalid result' }, { status: 400 });
    const guildIds = guilds.map((item) => ({ id: item.id, name: item.name }));

    const server_guilds = await serverGuilds();
    if (!server_guilds)
        return NextResponse.json({ ok: false, reason: 'server Error' }, { status: 400 });
    const guild_union = server_guilds
        .map((item) => {
            if (guildIds.some((user) => user.id === item.id)) return item;
        })
        .filter(Boolean);
    return NextResponse.json({ ok: true, guilds: guild_union });
}

/**
 * @returns {Promise<{id: string, name: string}[]|null>}
 */
async function serverGuilds() {
    const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        method: 'GET',
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'User-Agent': `DCcon_Sender (${process.env.AUTH_URL}, 1.0)`,
        },
        next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    /** @type { {id: string, name: string}[] | null } */
    const guild_list = await res.json();
    if (!guild_list) return null;
    return guild_list.map((item) => ({ id: item.id, name: item.name }));
}

/**
 * @param { string } cookieString
 */
function parseCookies(cookieString) {
    const list = cookieString.split('; ');
    const cookieList = Object.fromEntries(
        list.map((item) => {
            const [key, ...value] = item.split('=');
            return [key, decodeURIComponent(value.join('='))];
        }),
    );
    return cookieList;
}
