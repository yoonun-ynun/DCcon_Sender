import { NextResponse } from 'next/server';

export async function GET(req) {
    const res = NextResponse.json({
        ok: true,
        gotCookie: req.headers.get('cookie')?.includes('ct=1') ?? false,
    });
    res.cookies.set('ct', '1', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
        maxAge: 60,
    });
    return res;
}
