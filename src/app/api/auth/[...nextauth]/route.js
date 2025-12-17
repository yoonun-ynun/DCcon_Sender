import { handlers } from '@/auth';
import { NextRequest } from 'next/server'; // Referring to the auth.ts we just created

function stripDiscordPrefix(req) {
    const url = req.nextUrl.clone();

    // 들어온 요청이 /components/discordapp/... 이면 prefix 제거
    if (url.pathname.startsWith('/components/discordapp/')) {
        url.pathname = url.pathname.replace('/components/discordapp', '');
    }

    // NextAuth가 보는 req.url 자체를 바꿔서 전달
    return new NextRequest(url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
    });
}

export async function GET(req) {
    return handlers.GET(stripDiscordPrefix(req));
}

export async function POST(req) {
    return handlers.POST(stripDiscordPrefix(req));
}
