import { editInteractionResponse } from '../AJAX.js';
import type { CommandPayload } from '../interfaces/Payloads.js';
import { CommandError } from '../Errors/CommandError.js';

export default async function getInfo(payload: CommandPayload) {
    if (payload.select?.embeds === undefined || payload.select.embeds[0].url === undefined)
        throw new CommandError(
            'MISSING_ARGUMENT',
            '전송된 메시지에서 디시콘 정보를 찾을 수 없습니다.',
        );
    const url = payload.select.embeds[0].url;
    const res = await fetch('http://localhost:3000/api/info', {
        method: 'POST',
        body: JSON.stringify({
            idx: url.split('idx=')[1],
        }),
    });

    const data = await res.json();

    const title = data?.title;
    if (!title) {
        throw new CommandError(
            'MISSING_ARGUMENT',
            '전송된 메시지에서 디시콘 정보를 찾을 수 없습니다.',
        );
    }

    await editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        {
            content: `# [${title}](${url})`,
        },
    );
}
