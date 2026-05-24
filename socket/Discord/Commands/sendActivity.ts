import { editInteractionResponse } from '../AJAX.js';
import type { CommandPayload } from '../interfaces/Payloads.js';

export default async function sendActivity(payload: CommandPayload) {
    await editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        {
            content: process.env['ACTIVITY_URL'],
        },
    );
}
