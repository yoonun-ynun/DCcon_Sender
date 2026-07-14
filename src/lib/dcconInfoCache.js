import { connectDB } from '@/lib/mongodb';
import { dccon_info } from '@/lib/fetchDC';
import DCconInfoCache, { DCCON_INFO_CACHE_TTL_SECONDS } from '@/models/DCconInfoCache';

const FRESH_DURATION_MS = 60 * 60 * 1000;
const CACHE_DURATION_MS = DCCON_INFO_CACHE_TTL_SECONDS * 1000;
const REFRESH_LEASE_MS = 5 * 60 * 1000;

function normalizeIdx(idx) {
    const value = idx === undefined || idx === null ? '' : String(idx).trim();
    if (!value) throw new Error('idx is missing');
    return value;
}

export async function getCachedDcconInfo(idx) {
    const normalizedIdx = normalizeIdx(idx);
    await connectDB();

    const now = new Date();
    const expiresAfter = new Date(now.getTime() - CACHE_DURATION_MS);
    const cached = await DCconInfoCache.findOne(
        {
            idx: normalizedIdx,
            lastAccessedAt: { $gt: expiresAfter },
            data: { $exists: true },
        },
        { _id: 0, data: 1, fetchedAt: 1 },
    ).lean();

    if (cached?.data) {
        await DCconInfoCache.updateOne({ idx: normalizedIdx }, { $set: { lastAccessedAt: now } });

        const fetchedAt = cached.fetchedAt ? new Date(cached.fetchedAt).getTime() : 0;
        const isStale = now.getTime() - fetchedAt >= FRESH_DURATION_MS;
        return {
            data: cached.data,
            isStale,
            cacheStatus: isStale ? 'stale' : 'hit',
        };
    }

    const data = await dccon_info(normalizedIdx);
    const fetchedAt = new Date();
    await DCconInfoCache.findOneAndUpdate(
        { idx: normalizedIdx },
        {
            $set: {
                data,
                fetchedAt,
                lastAccessedAt: fetchedAt,
            },
            $unset: { refreshingAt: 1 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return { data, isStale: false, cacheStatus: 'miss' };
}

export async function refreshStaleDcconInfo(idx) {
    const normalizedIdx = normalizeIdx(idx);
    await connectDB();

    const now = new Date();
    const freshAfter = new Date(now.getTime() - FRESH_DURATION_MS);
    const expiresAfter = new Date(now.getTime() - CACHE_DURATION_MS);
    const leaseExpiredAt = new Date(now.getTime() - REFRESH_LEASE_MS);

    const claimed = await DCconInfoCache.findOneAndUpdate(
        {
            idx: normalizedIdx,
            lastAccessedAt: { $gt: expiresAfter },
            $and: [
                {
                    $or: [{ fetchedAt: { $lte: freshAfter } }, { fetchedAt: { $exists: false } }],
                },
                {
                    $or: [{ refreshingAt: null }, { refreshingAt: { $lte: leaseExpiredAt } }],
                },
            ],
        },
        { $set: { refreshingAt: now } },
        { new: true },
    ).lean();

    if (!claimed) return false;

    try {
        const data = await dccon_info(normalizedIdx);
        await DCconInfoCache.updateOne(
            { idx: normalizedIdx, refreshingAt: now },
            {
                $set: { data, fetchedAt: new Date() },
                $unset: { refreshingAt: 1 },
            },
        );
        return true;
    } catch (error) {
        await DCconInfoCache.updateOne(
            { idx: normalizedIdx, refreshingAt: now },
            { $unset: { refreshingAt: 1 } },
        );
        throw error;
    }
}
