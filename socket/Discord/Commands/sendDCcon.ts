import { editInteractionResponseFile } from '../AJAX.js';
import type { CommandPayload } from '../interfaces/Payloads.js';
import { CommandError } from '../Errors/CommandError.js';

export default async function sendDCcon(payload: CommandPayload) {
    if (
        payload.select === undefined ||
        payload.select.index === undefined ||
        payload.select.selector === undefined
    ) {
        throw new CommandError(
            'MISSING_ARGUMENT',
            '서버에서 오류가 발생하였습니다. 관리자에게 문의 해 주세요.',
        );
    }
    const temp = await fetch('http://localhost:3000/api/info', {
        method: 'POST',
        body: JSON.stringify({ idx: payload.select.index }),
        headers: { 'Content-Type': 'application/json' },
    });

    const info = (await temp.json()) as {
        title: string;
        description: string;
        main_img: string;
        idx: string;
        path: { addr: string; ext: string }[];
    };
    const path = info.path[payload.select.selector - 1];
    if (path === undefined) {
        throw new CommandError(
            'INDEX_OVERFLOW',
            '해당하는 디시콘 또는 이미지가 존재하지 않습니다.',
        );
    }
    const url = `http://localhost:3000/api/img?u=${path.addr}&e=${path.ext}`;
    const img_temp = await fetch(url);
    const image: File = new File([await img_temp.blob()], 'main_image.' + path.ext);
    await editInteractionResponseFile(
        payload.application.application_id,
        payload.interaction.interaction_token,
        {},
        [image],
    );
}
