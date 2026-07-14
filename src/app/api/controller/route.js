import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const runtime = 'nodejs';

function normalizeList(items) {
    if (!Array.isArray(items)) return [];

    const seen = new Set();
    const list = [];

    for (const item of items) {
        const idx = typeof item === 'string' ? item : item?.idx;
        if (!idx || seen.has(String(idx))) continue;

        const normalizedIdx = String(idx);
        seen.add(normalizedIdx);
        list.push({
            idx: normalizedIdx,
            img: typeof item === 'object' && item?.img ? String(item.img) : '',
        });
    }

    return list;
}

async function getUserId(req) {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    return {
        session,
        userId: session?.user?.discordId ?? requestedUserId,
    };
}

export async function PUT(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json(
            { success: false, message: '로그인을 먼저 해주세요' },
            { status: 401 },
        );
    }

    const data = await req.json();
    const idx = data.idx ? String(data.idx) : '';
    const img = typeof data.img === 'string' ? data.img.trim() : '';
    if (!idx) {
        return NextResponse.json({ success: false, message: 'idx is missing' }, { status: 400 });
    }
    if (!img) {
        return NextResponse.json({ success: false, message: 'img is missing' }, { status: 400 });
    }

    const userId = session.user.discordId;
    if (!userId) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();

    const user = await User.findOne({ user_id: userId }, { _id: 0, list: 1 }).lean();
    const list = normalizeList(user?.list);
    const existing = list.find((item) => item.idx === idx);

    if (!existing && list.length >= 25) {
        return NextResponse.json({
            success: false,
            message: '최대 25개까지 추가가 가능합니다.',
        });
    }

    const nextList = existing
        ? list.map((item) => (item.idx === idx ? { idx, img } : item))
        : [...list, { idx, img }];

    await User.findOneAndUpdate(
        { user_id: userId },
        {
            $setOnInsert: {
                user_id: userId,
                user_name: session.user.name,
                user_mail: session.user.email,
            },
            $set: { list: nextList },
        },
        { upsert: true, new: true },
    );

    return NextResponse.json({ success: true, item: { idx, img } });
}

export async function POST(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    const data = await req.json();
    const idx = data.idx ? String(data.idx) : '';
    if (!idx) {
        return NextResponse.json({ success: false, message: 'idx is missing' }, { status: 400 });
    }

    const userId = session.user.discordId;
    if (!userId) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();
    const user = await User.findOne({ user_id: userId }, { _id: 0, list: 1 }).lean();
    const isExist = normalizeList(user?.list).some((item) => item.idx === idx);
    return NextResponse.json({ isExist, success: true });
}

export async function GET(req) {
    const { session, userId } = await getUserId(req);
    if (!session && !userId) {
        return NextResponse.json(
            { success: false, message: '로그인을 먼저 해주세요' },
            { status: 401 },
        );
    }
    if (!userId) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();
    const result = await User.findOne({ user_id: userId }, { _id: 0, list: 1 }).lean();
    return NextResponse.json({ list: normalizeList(result?.list) });
}

export async function DELETE(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json(
            { success: false, message: '로그인을 먼저 해주세요' },
            { status: 401 },
        );
    }

    const data = await req.json();
    const idx = data.idx ? String(data.idx) : '';
    if (!idx) {
        return NextResponse.json({ success: false, message: 'idx is missing' }, { status: 400 });
    }

    const userId = session.user.discordId;
    if (!userId) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();
    const user = await User.findOne({ user_id: userId }, { _id: 0, list: 1 }).lean();
    if (user) {
        const list = normalizeList(user.list).filter((item) => item.idx !== idx);
        await User.updateOne({ user_id: userId }, { $set: { list } });
    }

    return NextResponse.json({ success: true });
}
