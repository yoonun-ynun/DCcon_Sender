import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { headers } from 'next/headers';
import { decode } from 'next-auth/jwt';
import State from '@/models/State.js';
import { connectDB } from '@/lib/mongodb.js';

export const runtime = 'nodejs';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const cookieUsable = searchParams.get('c');
    const channelId = searchParams.get('ch');
    await connectDB();

    if (!cookieUsable || !channelId) {
        return NextResponse.json({ ok: false, reason: 'invalid request' }, { status: 400 });
    }

    if (cookieUsable === 'true') {
        const authing = await auth();
        if (!authing)
            return NextResponse.json({ ok: false, reason: 'authing failed' }, { status: 401 });
    } else {
        const headerList = await headers();
        const h = headerList.get('authorization');
        if (!h?.startsWith('Bearer ')) {
            console.log('invalid header');
            return NextResponse.json({ ok: false, reason: 'invalid header' }, { status: 401 });
        }

        const jwt = h.slice('Bearer '.length);
        /**@type {{name: string, discordId: string, image: string}} */
        const payload = await decode({
            token: jwt,
            secret: process.env.AUTH_SECRET,
            salt: 'embedded-token',
        });
        if (payload === null) {
            return NextResponse.json({ ok: false, reason: 'authing failed' }, { status: 401 });
        }
    }

    const recent = await getRecentRecommendText(channelId);
    const result = recent.map((item) => {
        return {
            message_id: item.message_id,
            username: item.user_name,
            text: item.text,
        };
    });
    return NextResponse.json({ ok: true, data: result });
}

/**
 * @param {string} channel_id
 * @returns {Promise<Array<Object>>}
 */
async function getRecentRecommendText(channel_id) {
    const state = await State.findOne(
        { channel_id },
        {
            recommend_text: { $slice: -100 },
            _id: 0,
        },
    ).lean();

    return state?.recommend_text ?? [];
}
