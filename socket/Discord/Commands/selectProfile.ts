import { removeInteractionResponse } from '../AJAX.js';
import { getList } from '../../DataBase/query.js';
import sendDCcon from './sendDCcon.js';
import type { CommandPayload } from '../interfaces/Payloads.js';
import { CommandError } from '../Errors/CommandError.js';

export default async function selectProfile(payload: CommandPayload) {
    if (
        payload.user === undefined ||
        payload.select === undefined ||
        payload.select.selectedCon === undefined
    ) {
        throw new CommandError(
            'MISSING_ARGUMENT',
            '서버에서 오류가 발생하였습니다. 관리자에게 문의 해 주세요.',
        );
    }
    if (payload.select.selectedCon === 0 || payload.select.selector === 0) {
        await removeInteractionResponse(
            payload.application.application_id,
            payload.interaction.interaction_token,
        );
        return;
    }
    const List: string[] = await getList(payload.user.user_id);
    const idx = List[payload.select.selectedCon - 1];
    if (idx === undefined) {
        throw new CommandError('INDEX_OVERFLOW', '프로필에 해당하는 디시콘이 없습니다.');
    }
    payload.select.index = idx;
    await sendDCcon(payload);
}
