import { type Message } from '../connection/Message.js';
import { createGlobalCommand, createInteractionResponse, editInteractionResponse } from './AJAX.js';
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
    if (command_name === 'list') {
        await sendList(
            interaction_id,
            interaction_token,
            user_id,
            user_name,
            avatar_url,
            application_id,
        );
    }
}

async function sendList(
    interaction_id: string,
    interaction_token: string,
    user_id: string,
    user_name: string,
    avatar_link: string,
    application_id: string,
) {
    if (interaction_id === '' || user_id === '' || interaction_token === '')
        throw Error('Field is empty');
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
                author: {
                    name: user_name,
                    icon_url: avatar_link,
                },
                fields: fields,
            },
        ],
    });
}
