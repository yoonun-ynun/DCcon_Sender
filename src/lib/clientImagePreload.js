'use client';

import { getCacheableImageSrc } from '@/lib/dcconImageUrl.js';

const PRELOAD_CONCURRENCY = 4;
const queuedImageSources = new Set();
const imageQueue = [];
let activeImagePreloads = 0;

function drainImageQueue() {
    if (typeof window === 'undefined') return;

    while (activeImagePreloads < PRELOAD_CONCURRENCY && imageQueue.length > 0) {
        const src = imageQueue.shift();
        activeImagePreloads += 1;

        const image = new window.Image();
        image.decoding = 'async';
        image.fetchPriority = 'low';

        function finish() {
            activeImagePreloads -= 1;
            drainImageQueue();
        }

        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
        image.src = src;
    }
}

export function warmDcconImagesInBrowser(items) {
    if (typeof window === 'undefined' || !Array.isArray(items)) return;

    for (const item of items) {
        const upstreamUrl = item?.img || item?.url;
        if (!upstreamUrl) continue;

        const src = getCacheableImageSrc(`/api/img?u=${encodeURIComponent(upstreamUrl)}`);
        if (!src || queuedImageSources.has(src)) continue;

        queuedImageSources.add(src);
        imageQueue.push(src);
    }

    drainImageQueue();
}
