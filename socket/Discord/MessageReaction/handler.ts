import {
    appendRecommendQueue,
    getMessageIdFromHistory,
    getRecommendQueue,
    type RecommendText,
    removeRecommendQueue,
} from '../MessageInteraction/RecommendQueue.js';
import { searchChannel } from '../../DataBase/query.js';
import type { embed } from '../interfaces/Payloads.js';
import { createMessage, deleteAllReactionsForEmoji } from '../AJAX.js';
import { addReactionEmoji } from '../MessageInteraction/addRecommendReaction.js';

const cacheChannel: Map<string, channels> = new Map<string, channels>();

export async function reactionHandler(
    isAdd: boolean,
    emoji_id: string | null,
    emoji_name: string | null,
    message_id: string,
) {
    const EMOJI_ID = process.env['RECOMMEND_ID'];
    const BEECHU_ID = process.env['REVERSE_ID'];
    if (emoji_name === '👍' || emoji_name === '👎') {
        void handleThumb(message_id, emoji_name);
    }
    if (emoji_id !== EMOJI_ID && emoji_id !== BEECHU_ID) {
        return;
    }
    if (isAdd) await addCount(emoji_id, message_id);
    else removeCount(emoji_id, message_id);
}

async function handleThumb(message_id: string, emoji_name: string) {
    const target = getMessageIdFromHistory(message_id);
    if (target === undefined) {
        return;
    }
    const data = getRecommendQueue(target);
    if (data === undefined) {
        return;
    }
    const result = await deleteAllReactionsForEmoji(
        data.channel_id,
        message_id,
        encodeURIComponent(emoji_name),
    );

    addReactionEmoji(data.channel_id, data.message_id);
}

async function addCount(emoji_id: string, message_id: string) {
    const EMOJI_ID = process.env['RECOMMEND_ID'];
    const message = getRecommendQueue(message_id);
    if (!message) {
        console.error('MISSING MESSAGE');
        return;
    }
    console.log('reaction added');
    if (emoji_id === EMOJI_ID) message.count++;
    else message.decount++;
    appendRecommendQueue(message);
    await verifyCount(emoji_id === EMOJI_ID, message);
}

function removeCount(emoji_id: string, message_id: string) {
    const EMOJI_ID = process.env['RECOMMEND_ID'];
    const message = getRecommendQueue(message_id);
    if (!message) {
        console.error('MISSING MESSAGE');
        return;
    }
    console.log('reaction removed');
    if (emoji_id === EMOJI_ID) message.count--;
    else message.decount--;
    appendRecommendQueue(message);
}

async function verifyCount(isRecommend: boolean, message: RecommendText) {
    let channels: undefined | channels;
    const cached = cacheChannel.get(message.guild_id);
    if (cached === undefined) {
        const result = await searchChannel(message.guild_id);
        if (!result.ok) {
            console.error('database error');
            return;
        }
        channels = {
            channel_ids: result.channel_id,
            count: result.count,
            decount: result.decount,
        };
        cacheChannel.set(message.guild_id, channels);
    } else {
        channels = cached;
    }
    const embed: embed = {
        title:
            message.text.split('\n')[0] === '' ? '원본 메시지로 이동' : message.text.split('\n')[0],
        description: message.text,
        type: 'link',
        url: `https://discord.com/channels/${message.guild_id}/${message.channel_id}/${message.message_id}`,
        image: message.image ? { url: message.image } : undefined,
    };
    if (isRecommend) {
        if (message.count >= channels.count) {
            console.log(embed);
            const result = await createMessage(
                channels.channel_ids[0],
                { content: `<@${message.user_id}>`, embeds: [embed] },
                [],
            );
            if (!result?.ok) {
                console.error('error during create reaction embed');
                console.error(result?.message);
            }
            removeRecommendQueue(message.message_id);
        }
    } else {
        if (message.decount >= channels.decount) {
            const result = await createMessage(
                channels.channel_ids[1],
                { content: `<@${message.user_id}>`, embeds: [embed] },
                [],
            );
            if (!result?.ok) {
                console.error('error during create reaction embed');
                console.error(result?.message);
            }
            removeRecommendQueue(message.message_id);
        }
    }
}

export function removeCache(guild_id: string) {
    cacheChannel.delete(guild_id);
}

interface channels {
    channel_ids: string[];
    count: number;
    decount: number;
}
