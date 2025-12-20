const ALLOWED_HOSTS = ['dcimg5.dcinside.com'];

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get('u');
    if (!u) return new Response(null, { status: 400 });

    const targetUrl = `https:${u}`;

    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        return new Response('Invalid URL', { status: 400 });
    }

    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
        return new Response(null, { status: 403 });
    }

    const upstream = await fetch(parsed.toString(), {
        method: 'POST',
        headers: {
            referer: 'https://dccon.dcinside.com/',
        },
    });

    if (!upstream.ok || !upstream.body) {
        return new Response(`DCcon server responsed ${upstream.status}`, {
            status: upstream.status,
        });
    }

    const buf = await upstream.arrayBuffer();
    const uint8 = new Uint8Array(buf);

    let contentType = 'image/png'; // 기본값

    if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x38) {
        contentType = 'image/gif';
    } else if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4e && uint8[3] === 0x47) {
        contentType = 'image/png';
    }
    const len = String(buf.byteLength);

    return new Response(Buffer.from(buf), {
        headers: {
            'content-type': contentType,
            'content-length': len,
            'cache-control': 'public, max-age=86400, s-maxage=86400',
            'accept-ranges': 'bytes',
            'content-disposition': 'inline',
        },
    });
}
