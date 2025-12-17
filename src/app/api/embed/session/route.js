import { decode } from 'next-auth/jwt';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
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

    const session = {
        discordId: payload.discordId,
        name: payload.name,
        image: payload.image,
    };

    return NextResponse.json(session);
}
