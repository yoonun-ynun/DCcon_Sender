import { connectDB } from '@/lib/mongodb';
import DCconImageCache, { DCCON_IMAGE_CACHE_TTL_SECONDS } from '@/models/DCconImageCache';

const ALLOWED_HOSTS = new Set(['dcimg5.dcinside.com']);
const CACHE_DURATION_MS = DCCON_IMAGE_CACHE_TTL_SECONDS * 1000;
const MAX_CACHEABLE_BYTES = 14 * 1024 * 1024;
const MAX_MEMORY_ITEM_BYTES = 4 * 1024 * 1024;
const MAX_MEMORY_PRELOAD_BYTES = 1024 * 1024;
const MEMORY_PRELOAD_COUNT = 64;
const MEMORY_CACHE_LIMIT_BYTES = 64 * 1024 * 1024;
const WARM_CONCURRENCY = 6;

const inFlightFetches = globalThis.dcconImageFetches ?? new Map();
globalThis.dcconImageFetches = inFlightFetches;
const memoryCache = globalThis.dcconImageMemoryCache ?? { entries: new Map(), byteLength: 0 };
globalThis.dcconImageMemoryCache = memoryCache;

function httpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

export function normalizeDcconImageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
        throw httpError('Image URL is missing', 400);
    }

    const rawUrl = value.trim();
    const targetUrl = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;

    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        throw httpError('Invalid image URL', 400);
    }

    if (parsed.protocol !== 'https:') {
        throw httpError('Invalid image protocol', 400);
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        throw httpError('Image host is not allowed', 403);
    }

    return parsed.toString();
}

function detectContentType(data) {
    if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38) {
        return 'image/gif';
    }
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
        return 'image/png';
    }
    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
        return 'image/jpeg';
    }
    if (
        data[0] === 0x52 &&
        data[1] === 0x49 &&
        data[2] === 0x46 &&
        data[3] === 0x46 &&
        data[8] === 0x57 &&
        data[9] === 0x45 &&
        data[10] === 0x42 &&
        data[11] === 0x50
    ) {
        return 'image/webp';
    }
    return 'image/png';
}

function getMemoryCachedImage(url) {
    const cached = memoryCache.entries.get(url);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
        memoryCache.entries.delete(url);
        memoryCache.byteLength -= cached.data.byteLength;
        return null;
    }

    memoryCache.entries.delete(url);
    memoryCache.entries.set(url, cached);
    return cached;
}

function setMemoryCachedImage(url, data, contentType, expiresAt) {
    if (data.byteLength > MAX_MEMORY_ITEM_BYTES) return;

    const existing = memoryCache.entries.get(url);
    if (existing) {
        memoryCache.byteLength -= existing.data.byteLength;
        memoryCache.entries.delete(url);
    }

    memoryCache.entries.set(url, {
        data,
        contentType,
        expiresAt: expiresAt.getTime(),
    });
    memoryCache.byteLength += data.byteLength;

    while (memoryCache.byteLength > MEMORY_CACHE_LIMIT_BYTES) {
        const oldestKey = memoryCache.entries.keys().next().value;
        if (!oldestKey) break;

        const oldest = memoryCache.entries.get(oldestKey);
        memoryCache.entries.delete(oldestKey);
        memoryCache.byteLength -= oldest.data.byteLength;
    }
}

function extendMemoryCache(urls, expiresAt) {
    for (const url of urls) {
        const cached = memoryCache.entries.get(url);
        if (cached) cached.expiresAt = expiresAt.getTime();
    }
}

async function fetchAndCacheImage(url, expiresAt, shouldStore = true) {
    const pending = inFlightFetches.get(url);
    if (pending) return pending;

    const request = (async () => {
        const upstream = await fetch(url, {
            method: 'POST',
            headers: { referer: 'https://dccon.dcinside.com/' },
            cache: 'no-store',
        });

        if (!upstream.ok) {
            throw httpError(`DCcon image server responded ${upstream.status}`, upstream.status);
        }

        const data = Buffer.from(await upstream.arrayBuffer());
        const contentType = detectContentType(data);
        let cacheStatus = 'bypass';

        setMemoryCachedImage(url, data, contentType, expiresAt);

        if (shouldStore && data.byteLength <= MAX_CACHEABLE_BYTES) {
            try {
                await DCconImageCache.findOneAndUpdate(
                    { url },
                    {
                        $set: {
                            data,
                            contentType,
                            byteLength: data.byteLength,
                            fetchedAt: new Date(),
                            expiresAt,
                        },
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true },
                );
                cacheStatus = 'miss';
            } catch (error) {
                console.error(`Failed to store DCcon image cache for ${url}`, error);
            }
        }

        return { data, contentType, cacheStatus };
    })();

    inFlightFetches.set(url, request);
    try {
        return await request;
    } finally {
        if (inFlightFetches.get(url) === request) {
            inFlightFetches.delete(url);
        }
    }
}

export async function getCachedDcconImage(value) {
    const url = normalizeDcconImageUrl(value);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
    const memoryCached = getMemoryCachedImage(url);

    if (memoryCached) {
        return {
            data: memoryCached.data,
            contentType: memoryCached.contentType,
            cacheStatus: 'memory',
        };
    }

    let cacheAvailable = true;
    try {
        await connectDB();
        const cached = await DCconImageCache.findOne(
            { url, expiresAt: { $gt: now } },
            { _id: 0, data: 1, contentType: 1, expiresAt: 1 },
        );

        if (cached?.data) {
            const data = Buffer.from(cached.data);
            setMemoryCachedImage(url, data, cached.contentType, cached.expiresAt);
            return {
                data,
                contentType: cached.contentType,
                cacheStatus: 'hit',
            };
        }
    } catch (error) {
        cacheAvailable = false;
        console.error('DCcon image cache is unavailable; using the origin server.', error);
    }

    return fetchAndCacheImage(url, expiresAt, cacheAvailable);
}

function collectImageUrls(info) {
    const values = [info?.main_img, ...(info?.path ?? []).map((item) => item?.addr)];
    const urls = new Set();

    for (const value of values) {
        try {
            urls.add(normalizeDcconImageUrl(value));
        } catch {
            // Ignore malformed image paths in upstream info responses.
        }
    }

    return [...urls];
}

export async function warmDcconImages(info) {
    const urls = collectImageUrls(info);
    if (urls.length === 0) return { total: 0, cached: 0, warmed: 0, failed: 0 };

    await connectDB();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
    const cachedUrls = await DCconImageCache.distinct('url', {
        url: { $in: urls },
        expiresAt: { $gt: now },
    });
    const cachedSet = new Set(cachedUrls);

    if (cachedUrls.length > 0) {
        await DCconImageCache.updateMany({ url: { $in: cachedUrls } }, { $set: { expiresAt } });
        extendMemoryCache(cachedUrls, expiresAt);

        const preloadUrls = urls.slice(0, MEMORY_PRELOAD_COUNT);
        const preloadImages = await DCconImageCache.find(
            {
                url: { $in: preloadUrls },
                expiresAt: { $gt: now },
                byteLength: { $lte: MAX_MEMORY_PRELOAD_BYTES },
            },
            { _id: 0, url: 1, data: 1, contentType: 1 },
        );

        for (const image of preloadImages) {
            setMemoryCachedImage(image.url, Buffer.from(image.data), image.contentType, expiresAt);
        }
    }

    const missingUrls = urls.filter((url) => !cachedSet.has(url));
    let cursor = 0;
    let warmed = 0;
    let failed = 0;

    async function worker() {
        while (cursor < missingUrls.length) {
            const url = missingUrls[cursor];
            cursor += 1;
            try {
                const result = await fetchAndCacheImage(url, expiresAt);
                if (result.cacheStatus === 'miss') warmed += 1;
            } catch {
                failed += 1;
            }
        }
    }

    const workerCount = Math.min(WARM_CONCURRENCY, missingUrls.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    if (failed > 0) {
        console.warn(`Failed to warm ${failed} of ${missingUrls.length} DCcon images.`);
    }

    return { total: urls.length, cached: cachedUrls.length, warmed, failed };
}
