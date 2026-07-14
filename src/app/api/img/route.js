import { getCachedDcconImage } from '@/lib/dcconImageCache';

export const runtime = 'nodejs';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('u');
    if (!url) return new Response(null, { status: 400 });

    try {
        const image = await getCachedDcconImage(url);

        return new Response(image.data, {
            headers: {
                'content-type': image.contentType,
                'content-length': String(image.data.byteLength),
                'cache-control':
                    'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400, immutable',
                'accept-ranges': 'bytes',
                'content-disposition': 'inline',
                'x-dccon-image-cache': image.cacheStatus,
            },
        });
    } catch (error) {
        const status = Number.isInteger(error?.status) ? error.status : 502;
        return new Response(error?.message ?? 'Failed to load DCcon image', { status });
    }
}
