export { auth as middleware } from '@/auth';

export const config = {
    matcher: ['/((?!api/(?:img|info)(?:/|$)|_next/static|_next/image|favicon.ico).*)'],
};
