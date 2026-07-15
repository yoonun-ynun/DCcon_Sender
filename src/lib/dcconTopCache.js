import { connectDB } from '@/lib/mongodb';
import { getDcconTopPeriodKey } from '@/lib/dcconTopPeriod';
import DCconTopCache from '@/models/DCconTopCache';

const inFlightRequests = globalThis.dcconTopRequests ?? new Map();
globalThis.dcconTopRequests = inFlightRequests;

async function loadDcconTop(type, periodKey, loader) {
    let cached;

    try {
        await connectDB();
        cached = await DCconTopCache.findOne({ type }, { _id: 0, periodKey: 1, data: 1 }).lean();
    } catch (error) {
        console.error(`Failed to read ${type} DCcon top cache`, error);
        return loader();
    }

    if (cached?.periodKey === periodKey && Array.isArray(cached.data)) {
        return cached.data;
    }

    let data;
    try {
        data = await loader();
    } catch (error) {
        if (Array.isArray(cached?.data)) {
            console.error(`Failed to refresh ${type} DCcon top cache; serving stale data`, error);
            return cached.data;
        }
        throw error;
    }

    if (!Array.isArray(data)) {
        throw new Error(`${type} DCcon top response is not an array`);
    }

    try {
        await DCconTopCache.findOneAndUpdate(
            { type },
            {
                $set: {
                    periodKey,
                    data,
                    fetchedAt: new Date(),
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    } catch (error) {
        console.error(`Failed to write ${type} DCcon top cache`, error);
    }

    return data;
}

export async function getCachedDcconTop(type, loader, now = new Date()) {
    if (typeof loader !== 'function') throw new TypeError('DCcon top loader must be a function');

    const periodKey = getDcconTopPeriodKey(type, now);
    const requestKey = `${type}:${periodKey}`;
    const pending = inFlightRequests.get(requestKey);
    if (pending) return pending;

    const request = loadDcconTop(type, periodKey, loader);
    inFlightRequests.set(requestKey, request);

    try {
        return await request;
    } finally {
        if (inFlightRequests.get(requestKey) === request) {
            inFlightRequests.delete(requestKey);
        }
    }
}
