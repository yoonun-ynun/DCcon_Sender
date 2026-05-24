import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { headers } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { getDoubleImage } from '@/app/api/embed/send/getDoubleImage.js';

const base_url = 'https://discord.com/api/v10';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('u');
    const cookieUsable = searchParams.get('c');
    const channel = searchParams.get('ch');
    let double = Number(searchParams.get('d'));
    let reply = searchParams.get('r');
    if (!url || !cookieUsable || !channel || url === '' || channel === '') {
        return NextResponse.json({ ok: false, reason: 'invalid request' }, { status: 400 });
    }
    if (!reply || reply === 'undefined' || reply === 'null') {
        reply = null;
    }
    if (isNaN(double)) {
        double = 1;
    }

    let session;

    if (cookieUsable === 'true') {
        const authing = await auth();
        if (!authing)
            return NextResponse.json({ ok: false, reason: 'authing failed' }, { status: 401 });
        session = authing.user;
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

        session = {
            discordId: payload.discordId,
            name: payload.name,
            image: payload.image,
        };
    }

    let image;
    let ext;
    if (double > 1) {
        const urls = JSON.parse(url).urls;
        const result = await getDoubleImage(urls);
        if (!result) {
            return NextResponse.json(
                { ok: false, reason: 'failed fetching image' },
                { status: 400 },
            );
        }
        image = result.file;
        ext = result.ext;
    } else {
        const res = await fetch(`http://localhost:3000/api/img?u=${encodeURIComponent(url)}`);
        if (!res.ok)
            return NextResponse.json(
                { ok: false, reason: 'failed fetching image' },
                { status: 400 },
            );
        ext = res.headers.get('Content-Type').split('/')[1] ?? 'png';
        image = new File([await res.blob()], 'main_image.' + ext);
    }
    if (!image) return NextResponse.json({ ok: false, reason: 'invalid image' }, { status: 400 });
    const replyObject = {
        type: 0,
        message_id: reply,
        channel_id: channel,
    };
    const body = {
        embeds: [
            {
                author: {
                    name: session.name,
                    icon_url: session.image,
                },
                image: {
                    url: `attachment://main_image.${ext}`,
                },
            },
        ],
        message_reference: reply ? replyObject : undefined,
    };

    const createRes = await createMessage(channel, body, [image]);
    if (!createRes.ok)
        return NextResponse.json({ ok: false, reason: 'send error' }, { status: 400 });
    return NextResponse.json({ ok: true });
}

async function createMessage(channel_id, body, files) {
    const headers = {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'User-Agent': `DCcon_Sender (${process.env.AUTH_URL}, 1.0)`,
    };
    files = files || [];
    const url = base_url + `/channels/${channel_id}/messages`;
    const form = new FormData();
    const payload = { ...body, attachments: [] };
    for (let i = 0; i < files.length; i++) {
        payload.attachments.push({
            id: i,
            filename: files[i].name,
        });
    }
    form.append('payload_json', JSON.stringify(payload));
    for (let i = 0; i < files.length; i++) {
        form.append(`files[${i}]`, files[i]);
    }
    const option = {
        method: 'POST',
        headers: headers,
        body: form,
    };
    const result = await sender(url, option);
    console.log(result.message);
    return result;
}

async function sender(url, option) {
    try {
        const response = await fetch(url, option);
        if (response.status === 204) {
            return { ok: true };
        }
        if (!response.ok) return { ok: false, message: await response.json() };
        return {
            ok: true,
            message: await response.json(),
        };
    } catch (e) {
        console.error(e);
        if (!(e instanceof Error)) {
            console.log(e);
            throw Error('Discord Error');
        }
        const message = e?.message ?? '';
        console.log(message);
        return {
            ok: false,
            message: message,
        };
    }
}
