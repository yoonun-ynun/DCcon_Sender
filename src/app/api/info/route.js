import { after, NextResponse } from 'next/server';
import { getCachedDcconInfo, refreshStaleDcconInfo } from '@/lib/dcconInfoCache';
import { warmDcconImages } from '@/lib/dcconImageCache';

export const runtime = 'nodejs';

export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: 'invalid JSON body' }, { status: 400 });
    }

    const idx = body?.idx === undefined || body?.idx === null ? '' : String(body.idx).trim();
    const shouldWarmImages = body?.warmImages === true;
    if (!idx) {
        return NextResponse.json({ message: 'idx is missing' }, { status: 400 });
    }

    try {
        const result = await getCachedDcconInfo(idx);

        if (result.isStale) {
            after(async () => {
                try {
                    await refreshStaleDcconInfo(idx);
                } catch (error) {
                    console.error(`Failed to refresh DCcon info cache for ${idx}`, error);
                }
            });
        }

        if (shouldWarmImages) {
            const warming = warmDcconImages(result.data).catch((error) => {
                console.error(`Failed to warm DCcon image cache for ${idx}`, error);
            });
            after(() => warming);
        }

        return NextResponse.json(result.data, {
            headers: { 'x-dccon-cache': result.cacheStatus },
        });
    } catch (error) {
        console.error(`Failed to load DCcon info for ${idx}`, error);
        return NextResponse.json(
            { message: '디시콘 정보를 불러오지 못했습니다.' },
            { status: 502 },
        );
    }
}
