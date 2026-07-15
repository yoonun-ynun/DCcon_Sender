export { auth as middleware } from '@/auth';

export const config = {
    matcher: [
        '/((?!sender(?:/|$)|api/(?:img|info|controller|top)(?:/|$)|_next/static|_next/image|favicon.ico).*)',
    ],
};
