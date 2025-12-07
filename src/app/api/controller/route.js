import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const runtime = 'nodejs';

export async function PUT(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json(
            { success: false, message: '로그인을 먼저 해주세요' },
            { status: 401 },
        );
    }
    const data = await req.json();
    const idx = data.idx;
    if (!idx)
        return NextResponse.json({ success: false, message: 'idx is missing' }, { status: 400 });
    const user_id = session.user.discordId;
    if (!user_id) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();

    await User.findOneAndUpdate(
        { user_id: user_id },
        {
            $setOnInsert: {
                user_id: user_id,
                user_name: session.user.name,
                user_mail: session.user.email,
            },
            $addToSet: { list: idx },
        },
        { upsert: true, new: true },
    );
    return NextResponse.json({ success: true });
}

export async function POST(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ success: false }, { status: 401 });
    }
    const data = await req.json();
    const idx = data.idx;
    if (!idx)
        return NextResponse.json({ success: false, message: 'idx is missing' }, { status: 400 });
    const user_id = session.user.discordId;
    if (!user_id) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();
    const exists = await User.exists({ user_id: user_id, list: idx });
    return NextResponse.json({ isExist: Boolean(exists), success: true });
}

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json(
            { success: false, message: '로그인을 먼저 해주세요' },
            { status: 401 },
        );
    }
    const user_id = session.user.discordId;
    if (!user_id) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();
    const result = await User.findOne({ user_id: user_id }, { _id: 0, list: 1 }).lean();
    return NextResponse.json({ list: result?.list ?? [] });
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
    const idx = data.idx;
    if (!idx)
        return NextResponse.json({ success: false, message: 'idx is missing' }, { status: 400 });
    const user_id = session.user.discordId;
    if (!user_id) {
        return NextResponse.json(
            { success: false, message: 'user_id값이 없습니다. 관리자에게 문의하세요' },
            { status: 401 },
        );
    }

    await connectDB();
    await User.findOneAndUpdate({ user_id }, { $pull: { list: idx } });

    return NextResponse.json({ success: true });
}
