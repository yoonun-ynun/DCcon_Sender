import { createReaction } from '../AJAX.js';
import { acceptedGuild, appendRecommendQueue, getAuto } from './RecommendQueue.js';

const EMOJI_ID = process.env['RECOMMEND_ID'];
const EMOJI_NAME = process.env['RECOMMEND_NAME'];
const BEECHU_ID = process.env['REVERSE_ID'];
const BEECHU_NAME = process.env['REVERSE_NAME'];
const TIME_INTERVAL = 12 * 60 * 60 * 1000;

const channelMessage: Record<string, TempMessage | undefined> = {};

export default async function addRecommendReaction(
    text: string,
    channel_id: string,
    user_id?: string,
    message_id?: string,
    guild_id?: string,
    image?: string,
    user_name?: string,
) {
    if (
        message_id === undefined ||
        user_id === undefined ||
        guild_id === undefined ||
        user_name === undefined
    ) {
        console.error('invalid inner');
        return;
    }
    if (!acceptedGuild.has(guild_id)) {
        return;
    }
    if (user_id === process.env['APPLICATION_ID']) {
        return;
    }
    if (channelMessage[channel_id] === undefined) {
        const timeout = setTimeout(() => handleTimeout(channel_id, message_id, guild_id), 20000);
        channelMessage[channel_id] = {
            message_id: message_id,
            message_id_history: [message_id],
            user_id: user_id,
            user_name: user_name,
            text: text,
            timeout: timeout,
            image: image,
        };
    } else {
        const original = channelMessage[channel_id];
        clearTimeout(original.timeout);
        if (user_id !== original.user_id) {
            handleTimeout(channel_id, original.message_id, guild_id);
            original.text = '';
            original.image = undefined;
            original.message_id_history = [];
        }
        const timeout = setTimeout(() => handleTimeout(channel_id, message_id, guild_id), 20000);
        channelMessage[channel_id] = {
            message_id: message_id,
            message_id_history: [...original.message_id_history, message_id],
            user_id: user_id,
            user_name: user_name,
            text: original.text !== '' ? original.text + '\n' + text : text,
            timeout: timeout,
            image: image ? image : original.image,
        };
    }
}

function handleTimeout(channel_id: string, message_id: string, guild_id: string) {
    if (getAuto(guild_id)) {
        addReactionEmoji(channel_id, message_id);
    }
    const message = channelMessage[channel_id];
    if (message === undefined) {
        console.error('message is undefined');
        return;
    }
    appendRecommendQueue({
        text: message.text,
        image: message.image,
        channel_id: channel_id,
        user_id: message.user_id,
        user_name: message.user_name,
        message_id: message_id,
        message_id_history: message.message_id_history,
        guild_id: guild_id,
        expire_at: Date.now() + TIME_INTERVAL,
        count: 0,
        decount: 0,
    });
    channelMessage[channel_id] = undefined;
}

export function addReactionEmoji(channel_id: string, message_id: string) {
    if (
        EMOJI_ID === undefined ||
        EMOJI_NAME === undefined ||
        BEECHU_NAME === undefined ||
        BEECHU_ID === undefined
    ) {
        console.error('invalid emoji');
        return;
    }
    let result;
    setTimeout(async () => {
        result = await createReaction(channel_id, message_id, EMOJI_ID, EMOJI_NAME);
        if (!result?.ok) {
            console.error('add Reaction error');
            console.error(result?.message);
            if (result?.message['retry_after']) {
                setTimeout(
                    async () => await createReaction(channel_id, message_id, EMOJI_ID, EMOJI_NAME),
                    result?.message['retry_after'] * 1000,
                );
            }
        }
    }, 200);

    setTimeout(async () => {
        result = await createReaction(channel_id, message_id, BEECHU_ID, BEECHU_NAME);
        if (!result?.ok) {
            console.error('add Reaction error');
            console.error(result?.message);
            if (result?.message['retry_after']) {
                setTimeout(
                    async () =>
                        await createReaction(channel_id, message_id, BEECHU_ID, BEECHU_NAME),
                    result?.message['retry_after'] * 1000,
                );
            }
        }
    }, 700);
}

interface TempMessage {
    message_id: string;
    message_id_history: string[];
    user_id: string;
    user_name: string;
    text: string;
    timeout: NodeJS.Timeout;
    image?: string;
}
