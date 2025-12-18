import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { decode, encode } from 'next-auth/jwt';
import { encrypt, decrypt } from '@/app/api/embed/crypter.js';
import { refreshDiscordToken } from '@/auth.js';
import Token from '@/models/Token.js';

export async function POST() {
    const ALLOW_EXP_GRACE = 60 * 10;

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
    if (!payload) return NextResponse.json({ ok: false, reason: 'invalid token' }, { status: 401 });
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    if (!exp || now > exp + ALLOW_EXP_GRACE)
        return NextResponse.json({ ok: false, reason: 'expired token' }, { status: 401 });
    const user_id = payload?.discordId;
    if (!user_id)
        return NextResponse.json({ ok: false, reason: 'user_id is missing' }, { status: 401 });

    const tokens = await Token.findOne({ user_id: user_id }).lean();
    if (!tokens) {
        return NextResponse.json({ ok: false, reason: 'missing discord tokens' }, { status: 401 });
    }
    const expires_at = tokens.expires_at;
    if (Date.now() > expires_at - 1000 * 60) {
        const encryptedRefreshToken = tokens?.refresh_token;
        const refresh_token = decrypt(encryptedRefreshToken);

        const newTokens = await refreshDiscordToken(refresh_token);
        if (newTokens === null)
            return NextResponse.json(
                { ok: false, reason: 'access_token is expired' },
                { status: 401 },
            );
        await updateAccessToken({ ...newTokens, user_id });
    }

    const token_payload = {
        discordId: user_id,
        name: payload.name,
        image: payload.image,
    };

    const embeddedToken = await encode({
        token: token_payload,
        secret: process.env.AUTH_SECRET,
        salt: 'embedded-token',
        maxAge: 60 * 30,
    });
    return NextResponse.json({ ok: true, embeddedToken });
}

async function updateAccessToken({ access_token, refresh_token, expires_at, user_id }) {
    const encryptAccessToken = encrypt(access_token);
    const encryptRefreshToken = encrypt(refresh_token);

    await Token.findOneAndUpdate(
        { user_id: user_id },
        {
            $set: {
                access_token: encryptAccessToken,
                refresh_token: encryptRefreshToken,
                expires_at: expires_at,
            },
        },
        { upsert: true, new: true },
    );
}
