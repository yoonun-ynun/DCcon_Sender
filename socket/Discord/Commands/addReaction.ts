import type { CommandPayload } from '../interfaces/Payloads.js';
import {
    getAuto,
    getMessageIdFromHistory,
    getRecommendQueue,
} from '../MessageInteraction/RecommendQueue.js';
import { CommandError } from '../Errors/CommandError.js';
import { editInteractionResponse } from '../AJAX.js';
import { addReactionEmoji } from '../MessageInteraction/addRecommendReaction.js';

export default async function addReaction(payload: CommandPayload) {
    if (!payload.guild_id || !payload.message_id) {
        throw new CommandError(
            'MISSING_ARGUMENT',
            '서버에서 오류가 발생하였습니다. 관리자에게 문의 해 주세요.',
        );
    }
    const isAuto = getAuto(payload.guild_id);
    if (isAuto) {
        await editInteractionResponse(
            payload.application.application_id,
            payload.interaction.interaction_token,
            {
                content: '수동으로 반응을 추가할 수 없습니다. 봇 설정을 수정 해 주세요',
                flags: 1 << 6,
            },
        );
        return;
    }
    const message_id = getMessageIdFromHistory(payload.message_id);
    if (message_id === undefined) {
        await editInteractionResponse(
            payload.application.application_id,
            payload.interaction.interaction_token,
            {
                content: '아직 추가할 수 없습니다.',
                flags: 1 << 6,
            },
        );
        return;
    }
    const recommendObject = getRecommendQueue(message_id);
    if (recommendObject === undefined) {
        await editInteractionResponse(
            payload.application.application_id,
            payload.interaction.interaction_token,
            {
                content: '메시지를 찾을 수 없습니다.',
                flags: 1 << 6,
            },
        );
        return;
    }
    addReactionEmoji(recommendObject?.channel_id, message_id);
    await editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        {
            content: '완료되었습니다.',
            flags: 1 << 6,
        },
    );
}
