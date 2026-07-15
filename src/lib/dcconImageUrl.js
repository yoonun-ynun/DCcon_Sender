export function getCacheableImageSrc(src) {
    if (typeof src !== 'string') return src;

    try {
        const proxyUrl = new URL(src, 'https://dccon.local');
        if (proxyUrl.pathname !== '/api/img') return src;

        const upstreamValue = proxyUrl.searchParams.get('u');
        if (!upstreamValue) return src;

        const upstreamUrl = new URL(
            upstreamValue.startsWith('//') ? `https:${upstreamValue}` : upstreamValue,
        );
        const cacheKey = upstreamUrl.searchParams.get('no');
        if (!cacheKey || !/^[a-zA-Z0-9_-]+$/.test(cacheKey)) return src;

        return `/api/img/${cacheKey}.gif?u=${encodeURIComponent(upstreamValue)}`;
    } catch {
        return src;
    }
}
