import { User, Channel } from './models.js';
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

export async function searchChannel(
    guild_id: string,
): Promise<{ ok: false } | { ok: true; channel_id: string[]; count: number; decount: number }> {
    const result = await Channel.findOne(
        { guild_id: guild_id },
        { _id: 0, channel_id: 1, version: 1, count: 1, decount: 1 },
    ).lean<{
        channel_id: string[];
        count: number;
        decount: number;
        version: number;
    }>();
    if (result === null || result.version !== VERSION) {
        return { ok: false };
    } else {
        return {
            ok: true,
            channel_id: result.channel_id,
            count: result.count,
            decount: result.decount,
        };
    }
}

export async function createChannel(
    guild_id: string,
    channel_id: string[],
    count: number,
    decount: number,
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
            },
        },
        { upsert: true, new: true },
    );
}
