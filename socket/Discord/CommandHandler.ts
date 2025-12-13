import { type Message } from '../connection/Message.js';
import { createGlobalCommand, createInteractionResponse } from './AJAX.js';
import type { applicationCommandDataStructure, interaction } from './interfaces/types.js';
import handle from './Commands/handler.js';

export async function handler(message: Message) {
    if (message.t === 'MESSAGE_CREATE') {
        if (message.d === undefined) return;
        const author = (message.d as Record<string, unknown>)['author'];
        if (typeof author !== 'object' || author === null) return;
        console.log(
            (author as { username: string }).username +
                ': ' +
                (message.d as Record<string, unknown>)['content'],
        );
    }
    if (message.t === 'READY') {
        createCommand();
    }
    if (message.t === 'INTERACTION_CREATE') {
        try {
            console.log('Interaction created');
            await handleInteraction(message);
        } catch (e: unknown) {
            console.error('Error created by' + e);
        }
    }
}

async function handleInteraction(message: Message) {
    if (message.d === undefined) return;
    const interaction: interaction = message.d as interaction;
    if (interaction.type !== 2) return;
    const interaction_id = interaction.id;
    const application_id = interaction.application_id;
    const interaction_token = interaction.token;
    await createInteractionResponse(interaction_id, interaction_token, {
        type: 5,
    });
    const command_name = (interaction.data as applicationCommandDataStructure).name;
    const user_id = interaction.user?.id ?? interaction.member?.user?.id;
    const user_name =
        interaction.member?.nick ??
        interaction.user?.global_name ??
        interaction.member?.user?.global_name ??
        interaction.user?.username ??
        interaction.member?.user?.username ??
        'Unknown User';

    let avatar_url;
    if (interaction.guild_id !== undefined) {
        const avatar = interaction.member?.avatar;
        if (avatar) {
            avatar_url = `https://cdn.discordapp.com/guilds/${interaction.guild_id}/users/${user_id}/avatars/${avatar}.png`;
        }
    }
    if (!avatar_url) {
        const avatar = interaction.user?.avatar ?? interaction.member?.user?.avatar;
        if (avatar) {
            avatar_url = `https://cdn.discordapp.com/avatars/${user_id}/${avatar}.png`;
        }
    }
    if (!avatar_url) {
        avatar_url = `https://cdn.discordapp.com/embed/avatars/0.png`;
    }

    if (!user_id) {
        throw new Error('Interaction user not found');
    }

    const data = interaction.data as applicationCommandDataStructure;
    const options = data.options ?? [];
    let idx, selector, index;
    options.forEach((item) => {
        if (item.name === 'idx') idx = item.value as string;
        if (item.name === 'selector') selector = item.value as number;
        if (item.name === 'index') index = item.value as number;
    });

    await handle({
        name: command_name,
        user: {
            user_id: user_id,
            user_name: user_name,
            avatar_link: avatar_url,
        },
        application: {
            application_id: application_id,
        },
        interaction: {
            interaction_token: interaction_token,
        },
        select: {
            selectedCon: index,
            index: idx,
            selector: selector,
        },
    });
}

function createCommand() {
    createGlobalCommand({
        name: 'list',
        description: '추가한 디시콘 목록을 확인합니다.',
        type: 1,
    })
        .then((res) => {
            if (res?.ok !== true) {
                console.log(res?.message);
                return;
            }
            console.log('명령어 설정 완료');
        })
        .catch(() => console.error('명령어 설정에 실패하였습니다.'));
    createGlobalCommand({
        name: 'select',
        description: '특정 디시콘을 idx, selector를 사용해서 전송합니다.',
        type: 1,
        options: [
            {
                type: 3,
                name: 'idx',
                description: '해당 디시콘의 idx 값을 넣어주세요',
            },
            {
                type: 4,
                name: 'selector',
                description: '몇번째 콘을 가져올건지 입력 해 주세요',
                min_value: 1,
                max_value: 100,
            },
        ],
    })
        .then((res) => {
            if (res?.ok !== true) {
                console.log(res?.message);
                return;
            }
            console.log('명령어 설정 완료');
        })
        .catch(() => console.error('명령어 설정에 실패하였습니다.'));
    createGlobalCommand({
        name: 'profile',
        description: '프로필에 추가한 디시콘을 index, selector를 사용해서 전송합니다.',
        type: 1,
        options: [
            {
                type: 4,
                name: 'index',
                description: '몇번째 디시콘을 선택할건지 입력 해 주세요',
                min_value: 1,
                max_value: 25,
            },
            {
                type: 4,
                name: 'selector',
                description: '몇번째 콘을 가져올건지 입력 해 주세요',
                min_value: 1,
                max_value: 100,
            },
        ],
    })
        .then((res) => {
            if (res?.ok !== true) {
                console.log(res?.message);
                return;
            }
            console.log('명령어 설정 완료');
        })
        .catch(() => console.error('명령어 설정에 실패하였습니다.'));
}
