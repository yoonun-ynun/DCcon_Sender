import { type Message } from '../connection/Message.js';
import {
    createGlobalCommand,
    createInteractionResponse,
    editInteractionResponse,
    editInteractionResponseFile,
    removeInteractionResponse,
} from './AJAX.js';
import type { applicationCommandDataStructure, interaction } from './types.js';
import { getList } from '../DataBase/query.js';

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
    if (command_name === 'list') {
        await sendList(interaction_token, user_id, user_name, avatar_url, application_id);
    }
    if (command_name === 'select') {
        const data = interaction.data as applicationCommandDataStructure;
        const options = data.options ?? [];
        let idx: string = '';
        let selector: number = 0;
        options.forEach((item) => {
            if (item.name === 'idx') idx = item.value as string;
            if (item.name === 'selector') selector = item.value as number;
        });
        await sendDCcon(idx, selector, interaction_token, user_name, avatar_url, application_id);
    }
    if (command_name === 'profile') {
        const data = interaction.data as applicationCommandDataStructure;
        const options = data.options ?? [];
        let index: number = 0;
        let selector: number = 0;
        options.forEach((item) => {
            if (item.name === 'index') index = item.value as number;
            if (item.name === 'selector') selector = item.value as number;
        });
        await selectProfile(
            index,
            selector,
            interaction_token,
            user_name,
            user_id,
            avatar_url,
            application_id,
        );
    }
}

async function selectProfile(
    index: number,
    selector: number,
    interaction_token: string,
    user_name: string,
    user_id: string,
    avatar_link: string,
    application_id: string,
) {
    try {
        if (index === 0 || selector === 0) {
            await removeInteractionResponse(application_id, interaction_token);
            return;
        }
        const List: string[] = await getList(user_id);
        const idx = List[index - 1];
        if (idx === undefined) {
            await editInteractionResponse(application_id, interaction_token, {
                content: '해당하는 디시콘이 없습니다.',
            });
            return;
        }
        await sendDCcon(idx, selector, interaction_token, user_name, avatar_link, application_id);
    } catch (e: unknown) {
        await editInteractionResponse(application_id, interaction_token, {
            content: '에러가 발생하였습니다.',
        });
        console.error(e);
        if (e instanceof Error) {
            /* empty */
        }
    }
}

async function sendDCcon(
    idx: string,
    selector: number,
    interaction_token: string,
    user_name: string,
    avatar_link: string,
    application_id: string,
) {
    try {
        if (idx === '' || selector === 0) {
            await removeInteractionResponse(application_id, interaction_token);
            return;
        }
        const temp = await fetch('http://localhost:3000/api/info', {
            method: 'POST',
            body: JSON.stringify({ idx: idx }),
            headers: { 'Content-Type': 'application/json' },
        });

        const info = (await temp.json()) as {
            title: string;
            description: string;
            main_img: string;
            idx: string;
            path: { addr: string; ext: string }[];
        };
        const path = info.path[selector - 1];
        const url = `http://localhost:3000/api/img?u=${path.addr}&e=${path.ext}`;
        const img_temp = await fetch(url);
        const image: File = new File([await img_temp.blob()], 'main_image.' + path.ext);
        const embed = {
            author: {
                name: user_name,
                icon_url: avatar_link,
            },
            image: {
                url: `attachment://main_image.${path.ext}`,
                width: 200,
                height: 200,
            },
        };
        await editInteractionResponseFile(application_id, interaction_token, {}, [image]);
    } catch (e: unknown) {
        await editInteractionResponse(application_id, interaction_token, {
            content: '해당하는 디시콘이 없거나 전송 중 오류가 발생하였습니다.',
        });
        console.error(e);
        if (e instanceof Error) {
            /* empty */
        }
    }
}

async function sendList(
    interaction_token: string,
    user_id: string,
    user_name: string,
    avatar_link: string,
    application_id: string,
) {
    try {
        if (user_id === '' || interaction_token === '') throw Error('Field is empty');
        const List: string[] = await getList(user_id);
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
        await editInteractionResponse(application_id, interaction_token, {
            embeds: [
                {
                    description: '추가한 디시콘 목록을 확인합니다.',
                    author: {
                        name: user_name,
                        icon_url: avatar_link,
                    },
                    fields: fields,
                },
            ],
        });
    } catch (e: unknown) {
        await editInteractionResponse(application_id, interaction_token, {
            content: '에러가 발생하였습니다.',
        });
        console.error(e);
        if (e instanceof Error) {
            /* empty */
        }
    }
}
