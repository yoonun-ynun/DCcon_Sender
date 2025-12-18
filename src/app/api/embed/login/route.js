import { NextResponse } from 'next/server';
import { signIn, verifyEmbeddedProof } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import Token from '@/models/Token';
import { encode } from 'next-auth/jwt';
import { encrypt } from '@/app/api/embed/crypter.js';

export async function POST(req) {
    const { code, instanceId, cookieUsable } = await req.json();

    if (cookieUsable) {
        const result = await signIn('discord-embedded', {
            code,
            instanceId,
            redirect: false,
        });
        if (result?.error) {
            return NextResponse.json({ ok: false, reason: 'credentials' }, { status: 401 });
        }
        return NextResponse.json({ ok: true });
    }
    await connectDB();
    const verified = await verifyEmbeddedProof({ code, instanceId });

    const tokenPayload = {
        discordId: verified.user_id,
        name: verified.username,
        image: verified.image,
    };

    const access_token = encrypt(verified.access_token);
    const refresh_token = encrypt(verified.refresh_token);

    await Token.findOneAndUpdate(
        { user_id: verified.user_id },
        {
            $setOnInsert: {
                user_id: verified.user_id,
            },
            $set: {
                access_token: access_token,
                refresh_token: refresh_token,
                expires_at: verified.expires_at,
            },
        },
        { upsert: true, new: true },
    );

    const embeddedToken = await encode({
        token: tokenPayload,
        secret: process.env.AUTH_SECRET,
        salt: 'embedded-token',
        maxAge: 60 * 30,
    });

    return NextResponse.json({ ok: true, embeddedToken });
}
