import { User, Channel, State } from './models.js';
import type { RecommendText } from '../Discord/MessageInteraction/RecommendQueue.js';
const VERSION = 1;

export async function getList(user_id: string) {
    const result = await User.findOne({ user_id: user_id }, { _id: 0, list: 1 }).lean<{
        list: string[];
    }>();
    return result?.list ?? [];
}

export async function getGuildList() {
    const guildIds = (await Channel.distinct('guild_id')) as string[];
    return guildIds;
}

export async function getAutoGuild() {
    const guildIds = (
        await Channel.find({ auto: true }, { _id: 0, guild_id: 1 }).lean<{ guild_id: string }[]>()
    ).map((v) => v.guild_id);
    return guildIds;
}

export async function searchChannel(
    guild_id: string,
): Promise<
    | { ok: false }
    | { ok: true; channel_id: string[]; count: number; decount: number; auto: boolean }
> {
    const result = await Channel.findOne(
        { guild_id: guild_id },
        { _id: 0, channel_id: 1, version: 1, count: 1, decount: 1 },
    ).lean<{
        channel_id: string[];
        count: number;
        decount: number;
        version: number;
        auto: boolean;
    }>();
    if (result === null || result.version !== VERSION) {
        return { ok: false };
    } else {
        return {
            ok: true,
            channel_id: result.channel_id,
            count: result.count,
            decount: result.decount,
            auto: result.auto,
        };
    }
}

export async function createChannel(
    guild_id: string,
    channel_id: string[],
    count: number,
    decount: number,
    auto: boolean,
) {
    await Channel.findOneAndUpdate(
        { guild_id: guild_id },
        {
            $setOnInsert: {
                guild_id: guild_id,
            },
            $set: {
                channel_id: channel_id,
                version: VERSION,
                count: count,
                decount: decount,
                auto: auto,
            },
        },
        { upsert: true, new: true },
    );
}

export async function saveRecommendTexts(items: RecommendText[]) {
    if (items.length === 0) return;

    const grouped = new Map<string, RecommendText[]>();

    for (const item of items) {
        const list = grouped.get(item.channel_id) ?? [];
        list.push(item);
        grouped.set(item.channel_id, list);
    }

    await State.bulkWrite(
        [...grouped.entries()].map(([channel_id, recommend_text]) => ({
            updateOne: {
                filter: { channel_id },
                update: {
                    $set: { recommend_text },
                },
                upsert: true,
            },
        })),
        { ordered: false },
    );
}

export async function getAllRecent1000RecommendTexts(): Promise<RecommendText[]> {
    const docs = await State.find(
        {},
        {
            channel_id: 1,
            recommend_text: { $slice: -1000 },
            _id: 0,
        },
    ).lean<{ channel_id: string; recommend_text: RecommendText[] }[]>();

    return docs.flatMap((doc) => doc.recommend_text ?? []);
}
