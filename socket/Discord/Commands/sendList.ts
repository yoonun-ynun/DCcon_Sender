import { getList } from '../../DataBase/query.js';
import { editInteractionResponse } from '../AJAX.js';
import type { CommandPayload } from '../interfaces/Payloads.js';
import { CommandError } from '../Errors/CommandError.js';

export default async function sendList(payload: CommandPayload) {
    if (
        payload.user === undefined ||
        payload.user.user_name === undefined ||
        payload.user.avatar_link === undefined
    )
        throw new CommandError(
            'MISSING_ARGUMENT',
            '서버에서 오류가 발생하였습니다. 관리자에게 문의 해 주세요.',
        );
    const List: string[] = await getList(payload.user.user_id);
    const info = (await Promise.all(
        List.map(async (item) => {
            const res = await fetch('http://localhost:3000/api/info', {
                method: 'POST',
                body: JSON.stringify({ idx: item }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('failed to fetch list');
            return res.json();
        }),
    )) as {
        title: string;
        description: string;
        main_img: string;
        idx: string;
        path: string[];
    }[];
    const fields = info.map((item) => {
        return {
            name: item.title,
            value:
                item.description.length > 25
                    ? item.description.slice(0, 25) + '...'
                    : item.description,
            inline: false,
        };
    });
    await editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        {
            embeds: [
                {
                    description: '추가한 디시콘 목록을 확인합니다.',
                    author: {
                        name: payload.user.user_name,
                        icon_url: payload.user.avatar_link,
                    },
                    fields: fields,
                },
            ],
        },
    );
}
