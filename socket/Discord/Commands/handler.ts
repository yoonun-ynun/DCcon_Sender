import sendDCcon from './sendDCcon.js';
import sendList from './sendList.js';
import selectProfile from './selectProfile.js';
import type { CommandPayload } from '../interfaces/Payloads.js';
import { CommandError } from '../Errors/CommandError.js';
import { editInteractionResponse } from '../AJAX.js';

const Command = {
    list: sendList,
    select: sendDCcon,
    profile: selectProfile,
};

const errorList = {
    MISSING_ARGUMENT: argumentsErrorHandler,
    INVALID_ARGUMENT: argumentsErrorHandler,
    INDEX_OVERFLOW: indexOverflowErrorHandler,
};

export default async function handle(payload: CommandPayload) {
    const usingFunction = Command[payload.name];
    try {
        await usingFunction(payload);
    } catch (e: unknown) {
        if (!(e instanceof CommandError)) {
            throw e;
        }
        const func = errorList[e.code];
        func(e, payload);
    }
}

function argumentsErrorHandler(e: CommandError, payload: CommandPayload) {
    console.error(
        `[${e.code}]: 필요한 인수가 undefined로 들어왔을 때 발생합니다. CommandHandler 코드를 점검 해 주시면 좋고 가끔씩 Discord 서버의 오류로 인해 발생할 수도 있습니다.`,
    );
    editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        { content: e.message },
    );
}

function indexOverflowErrorHandler(e: CommandError, payload: CommandPayload) {
    console.error(
        `[${e.code}]: 대부분 사용자의 잘못된 입력으로 인해 발생합니다. 만약 서버측 오류일 경우 DB부분을 한번 점검 해 주세요`,
    );
    editInteractionResponse(
        payload.application.application_id,
        payload.interaction.interaction_token,
        { content: e.message },
    );
}
