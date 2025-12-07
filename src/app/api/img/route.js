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
    const ct = upstream.headers.get('content-type') ?? 'image/png';
    const len = String(buf.byteLength);
    console.log(ct);

    return new Response(Buffer.from(buf), {
        headers: {
            'content-type': ct,
            'content-length': len,
            'cache-control': 'public, max-age=86400, s-maxage=86400',
            'accept-ranges': 'bytes',
            'content-disposition': 'inline',
        },
    });
}
