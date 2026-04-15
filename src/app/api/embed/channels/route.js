import { NextResponse } from 'next/server';

export async function POST(req) {
    const { guildId } = await req.json();
    if (!guildId) {
        return NextResponse.json({ ok: false, reason: 'guildId is required' }, { status: 400 });
    }
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        method: 'GET',
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'User-Agent': `DCcon_Sender (${process.env.AUTH_URL}, 1.0)`,
        },
    });
    if (!res.ok) {
        return NextResponse.json({ ok: false, reason: 'failed get channels' }, { status: 400 });
    }
    const list = await res.json();
    if (!list) {
        return NextResponse.json({ ok: false, reason: 'invalid List' }, { status: 400 });
    }
    const channelList = list
        .map((item) => {
            if (item.type !== 0) return;
            return { id: item.id, name: item.name ?? '알 수 없는 채널' };
        })
        .filter(Boolean);
    console.log(channelList);
    return NextResponse.json({ ok: true, channelList });
}
