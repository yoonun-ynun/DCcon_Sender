import { NextResponse } from 'next/server';
import { signIn, verifyEmbeddedProof } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import Token from '@/models/Token';
import { encode } from 'next-auth/jwt';

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
    await Token.findOneAndUpdate(
        { user_id: verified.user_id },
        {
            $setOnInsert: {
                user_id: verified.user_id,
                access_token: verified.access_token,
                refresh_token: verified.refresh_token,
                expires_at: verified.expires_at,
            },
        },
        { upsert: true, new: true },
    );

    const embeddedToken = await encode({
        token: tokenPayload,
        secret: process.env.AUTH_SECRET,
        salt: 'embedded-token',
        maxAge: 60 * 15,
    });

    return NextResponse.json({ ok: true, embeddedToken });
}
