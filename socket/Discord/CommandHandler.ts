import { type event } from '../connection/Message.js';
import { createGlobalCommand, createInteractionResponse, deleteMessage } from './AJAX.js';
import type {
    applicationCommandDataStructure,
    interaction,
    ReactionPayload,
} from './interfaces/types.js';
import handle from './Commands/handler.js';
import { messageHandler } from './MessageInteraction/hendler.js';
import { type createdMessage, type message } from './interfaces/primaryType.js';
import { reactionHandler } from './MessageReaction/handler.js';

export async function handler(message: event) {
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
    if (message.t === 'MESSAGE_CREATE') {
        try {
            await handleMessage(message);
        } catch (e: unknown) {
            console.error('Error created by' + e);
        }
    }
    if (message.t === 'MESSAGE_REACTION_ADD') {
        try {
            await handleReaction(message, true);
        } catch (e: unknown) {
            console.error('Error created by' + e);
        }
    }
    if (message.t === 'MESSAGE_REACTION_REMOVE') {
        try {
            await handleReaction(message, false);
        } catch (e: unknown) {
            console.error('Error created by' + e);
        }
    }
}

async function handleReaction(message: event, isAdd: boolean) {
    if (message.d === undefined) return;
    const event = message.d as ReactionPayload;
    const emoji = event.emoji;
    await reactionHandler(isAdd, emoji.id, emoji.name, event.message_id);
}

async function handleMessage(message: event) {
    if (message.d === undefined) return;
    const data: createdMessage = message.d as createdMessage;
    const isActivityLaunchMessage =
        data.type === 23 &&
        data.application?.id === process.env['APPLICATION_ID'] &&
        data.interaction_metadata?.name === 'launch' &&
        data.activity_instance?.id;
    if (isActivityLaunchMessage) {
        await deleteMessage(data.channel_id, data.id);
        return;
    }
    let image: string | undefined;
    if (data.attachments.length > 0) {
        const media = data.attachments[data.attachments.length - 1];
        if (media['content_type'] !== undefined && media['url'] !== undefined) {
            const type = (media['content_type'] as string).split('/')[0];
            if (type === 'image') {
                image = media['url'] as string;
            }
        }
    }
    await messageHandler({
        data: data.content,
        channel_id: data.channel_id,
        message_id: data.id,
        user_id: data.author.id,
        user_name: data.member?.nick ?? data.author.global_name ?? data.author.username,
        guild_id: data.guild_id,
        image: image,
    });
}

async function handleInteraction(message: event) {
    if (message.d === undefined) return;
    const interaction: interaction = message.d as interaction;
    if (interaction.type !== 2) return;
    const interaction_id = interaction.id;
    const application_id = interaction.application_id;
    const interaction_token = interaction.token;
    const command_name = (interaction.data as applicationCommandDataStructure).name;
    await createInteractionResponse(interaction_id, interaction_token, {
        type: 5,
        data: {
            flags:
                command_name === '개추/비추 반응 추가' || command_name === 'activity'
                    ? 1 << 6
                    : undefined,
        },
    });

    const user_id = interaction.user?.id ?? interaction.member?.user?.id;
    const user_name =
        interaction.member?.nick ??
        interaction.user?.global_name ??
        interaction.member?.user?.global_name ??
        interaction.user?.username ??
        interaction.member?.user?.username ??
        'Unknown User';
    const permission = interaction.member?.permissions;

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
    let idx, selector, index, count, decount, auto;
    options.forEach((item) => {
        if (item.name === 'idx') idx = item.value as string;
        if (item.name === 'selector') selector = item.value as number;
        if (item.name === 'index') index = item.value as number;
        if (item.name === 'count') count = item.value as number;
        if (item.name === 'decount') decount = item.value as number;
        if (item.name === 'auto') auto = item.value as boolean;
    });
    const guild_id = interaction.guild_id
        ? interaction.guild_id
        : (interaction.guild?.['id'] as undefined | string);
    const message_id = (interaction.data as applicationCommandDataStructure).target_id;

    await handle({
        name: command_name,
        guild_id: guild_id,
        message_id: message_id,
        user: {
            user_id: user_id,
            user_name: user_name,
            avatar_link: avatar_url,
            permission: permission,
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
            count: count,
            decount: decount,
            auto: auto,
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
                required: true,
            },
            {
                type: 4,
                name: 'selector',
                description: '몇번째 콘을 가져올건지 입력 해 주세요',
                min_value: 1,
                max_value: 100,
                required: true,
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
                required: true,
            },
            {
                type: 4,
                name: 'selector',
                description: '몇번째 콘을 가져올건지 입력 해 주세요',
                min_value: 1,
                max_value: 100,
                required: true,
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
        name: 'init',
        description: '개추 작동을 위한 초기화를 실시합니다.',
        type: 1,
        options: [
            {
                type: 4,
                name: 'count',
                description: '추천이 몇 개 쌓이면 개념글에 보낼지',
                min_value: 1,
                max_value: 100,
                required: true,
            },
            {
                type: 4,
                name: 'decount',
                description: '비추가 몇 개 쌓이면 쓰레기통에 보낼지',
                min_value: 1,
                max_value: 100,
                required: true,
            },
            {
                type: 5,
                name: 'auto',
                description: '개추/비추 반응을 자동으로 추가할지',
                required: true,
            },
        ],
    })
        .then((res) => {
            if (res?.ok !== true) {
                console.log(res?.message);
                return;
            }
            console.log('명령어 설정 환료');
        })
        .catch(() => console.error('명령어 설정에 실패하였습니다.'));
    createGlobalCommand({
        name: '개추/비추 반응 추가',
        type: 3,
    }).then((res) => {
        if (res?.ok !== true) {
            console.log(res?.message);
            return;
        }
        console.log('명령어 설정 환료');
    });
    createGlobalCommand({
        name: 'invite',
        description: '개인용 명령어',
        type: 1,
        options: [
            {
                type: 4,
                name: 'days',
                description: '대기 일수',
                min_value: 1,
                max_value: 100,
                required: true,
            },
        ],
    })
        .then((res) => {
            if (res?.ok !== true) {
                console.log(res?.message);
                return;
            }
            console.log('명령어 설정 환료');
        })
        .catch(() => console.error('명령어 설정에 실패하였습니다.'));
    createGlobalCommand({
        name: 'activity',
        description: '봇을 실행시키기 위한 액티비티 링크를 반환합니다.',
        type: 1,
    }).then((res) => {
        if (res?.ok !== true) {
            console.log(res?.message);
            return;
        }
        console.log('명령어 설정 환료');
    });
}
