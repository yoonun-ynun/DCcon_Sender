import type { CommandPayload } from '../interfaces/Payloads.js';
import { createChannel, searchChannel } from '../../DataBase/query.js';
import { CommandError } from '../Errors/CommandError.js';
import { createGuildChannel, editInteractionResponse, getGuildChannels } from '../AJAX.js';
import type { channel } from '../interfaces/primaryType.js';
import { removeCache } from '../MessageReaction/handler.js';

export default async function initializeRecommend(payload: CommandPayload) {
    if (!payload.guild_id) {
        throw new CommandError('MISSING_ARGUMENT', 'guild id is missing');
    }
    if (
        !payload.select ||
        payload.select.count === undefined ||
        payload.select.decount === undefined ||
        payload.select.auto === undefined
    ) {
        throw new CommandError('MISSING_ARGUMENT', 'count or decount is missing');
    }
    if (!payload.user?.permission) {
        throw new CommandError('MISSING_ARGUMENT', 'missing permission');
    }
    const permission = 1n << 3n;
    const result = (BigInt(payload.user.permission) & permission) === permission;
    if (!result) {
        await editInteractionResponse(
            payload.application.application_id,
            payload.interaction.interaction_token,
            { content: '관리자만 사용 가능합니다.' },
        );
        return;
    }

    const channelResult = await searchChannel(payload.guild_id);
    if (channelResult.ok) {
        const channels = await getGuildChannels(payload.guild_id);
        if (channels === undefined || !channels.ok) {
            console.error(channels?.message);
            throw new CommandError('MISSING_ARGUMENT', 'Discord server error');
        }
        const data = channels.message as channel[];
        const isChannel = data.find((channel) => {
            return channel.id === channelResult.channel_id[0];
        });
        if (
            isChannel &&
            channelResult.count === payload.select?.count &&
            channelResult.decount === payload.select?.decount &&
            channelResult.auto === payload.select?.auto
        ) {
            await editInteractionResponse(
                payload.application.application_id,
                payload.interaction.interaction_token,
                { content: '수정하거나 추가할 내용이 없습니다.' },
            );
            return;
        } else if (isChannel) {
            await createChannel(
                payload.guild_id,
                channelResult.channel_id,
                payload.select.count,
                payload.select.decount,
                payload.select.auto,
            );
            removeCache(payload.guild_id);
            await editInteractionResponse(
                payload.application.application_id,
                payload.interaction.interaction_token,
                { content: '완료되었습니다.' },
            );
            return;
        }
    }
    const categoryResult = await createGuildChannel(payload.guild_id, '인기글', 4, undefined, 3);
    if (!categoryResult || !categoryResult.ok) {
        console.error(categoryResult?.message);
        throw new CommandError('MISSING_ARGUMENT', 'Discord server error');
    }
    const category = categoryResult.message as channel;
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 500);
    });
    const recommendChannelResult = await createGuildChannel(
        payload.guild_id,
        '개념글',
        0,
        category.id,
        1,
    );
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 500);
    });
    const trashChannelResult = await createGuildChannel(
        payload.guild_id,
        '쓰레기통',
        0,
        category.id,
        0,
    );
    if (
        !recommendChannelResult ||
        !recommendChannelResult.ok ||
        !trashChannelResult ||
        !trashChannelResult.ok
    ) {
        console.error(recommendChannelResult?.message);
        console.error(trashChannelResult?.message);
        throw new CommandError('MISSING_ARGUMENT', 'Discord server error');
    }
    const recommendChannel = recommendChannelResult.message as channel;
    const trashChannel = trashChannelResult.message as channel;
    await createChannel(
        payload.guild_id,
        [recommendChannel.id, trashChannel.id],
        payload.select.count,
        payload.select.decount,
        payload.select.auto,
    );
    await editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        { content: '완료되었습니다.' },
    );
}
