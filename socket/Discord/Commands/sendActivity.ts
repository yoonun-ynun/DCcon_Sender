import { editInteractionResponse } from '../AJAX.js';
import type { CommandPayload } from '../interfaces/Payloads.js';

export default async function sendActivity(payload: CommandPayload) {
    const activityUrl = process.env['ACTIVITY_URL'];
    const content = activityUrl ?? '활동 URL이 설정되지 않음 관리자에게 문의해 주세요';
    await editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        {
            content: content,
        },
    );
}
