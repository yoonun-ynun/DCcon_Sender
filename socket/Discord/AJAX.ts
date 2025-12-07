import type {
    DiscordCommandPayload,
    DiscordMessagePayload,
    DiscordMessageBody,
    interactionResponse,
    editMessage,
} from './Payloads.js';

const base_url = 'https://discord.com/api';

export async function createMessage(channel_id: string, body: DiscordMessageBody, files: File[]) {
    const headers = {
        Authorization: `Bot ${process.env['DISCORD_TOKEN']}`,
        'User-Agent': `DCcon_Sender (${process.env['AUTH_URL']}, 1.0)`,
    };
    files = files || [];
    const url = base_url + `/channels/${channel_id}/messages`;
    const form = new FormData();
    const payload: DiscordMessagePayload = { ...body, attachments: [] };
    for (let i = 0; i < files.length; i++) {
        payload.attachments.push({
            id: i,
            filename: files[i].name,
        });
    }
    form.append('payload_json', JSON.stringify(payload));
    for (let i = 0; i < files.length; i++) {
        form.append(`files[${i}]`, files[i]);
    }
    const option = {
        method: 'POST',
        headers: headers,
        body: form,
    };
    return await sender(url, option);
}

export async function createGlobalCommand(body: DiscordCommandPayload) {
    const headers = {
        Authorization: `Bot ${process.env['DISCORD_TOKEN']}`,
        'User-Agent': `DCcon_Sender (${process.env['AUTH_URL']}, 1.0)`,
        'Content-Type': 'application/json',
    };
    const url = base_url + `/applications/${process.env['APPLICATION_ID']}/commands`;
    const option = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    };
    return await sender(url, option);
}

export async function createInteractionResponse(
    interaction_id: string,
    interaction_token: string,
    body: interactionResponse,
) {
    const headers = {
        Authorization: `Bot ${process.env['DISCORD_TOKEN']}`,
        'User-Agent': `DCcon_Sender (${process.env['AUTH_URL']}, 1.0)`,
        'Content-Type': 'application/json',
    };
    const url = base_url + `/interactions/${interaction_id}/${interaction_token}/callback`;
    const option = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    };
    return await sender(url, option);
}

export async function editInteractionResponse(
    application_id: string,
    interaction_token: string,
    body: editMessage,
) {
    const url = base_url + `/webhooks/${application_id}/${interaction_token}/messages/@original`;
    const option = {
        method: 'PATCH',
        headers: {
            'User-Agent': `DCcon_Sender (${process.env['AUTH_URL']}, 1.0)`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    };
    return await sender(url, option);
}

export async function editInteractionResponseFile(
    application_id: string,
    interaction_token: string,
    body: editMessage,
    files: File[],
) {
    const url = base_url + `/webhooks/${application_id}/${interaction_token}/messages/@original`;
    const form = new FormData();
    body.attachments = [];
    for (let i = 0; i < files.length; i++) {
        body.attachments.push({
            id: i,
            filename: files[i].name,
        });
    }
    console.log(body);
    form.append('payload_json', JSON.stringify(body));
    for (let i = 0; i < files.length; i++) {
        form.append(`files[${i}]`, files[i]);
    }
    const option = {
        method: 'PATCH',
        headers: {
            'User-Agent': `DCcon_Sender (${process.env['AUTH_URL']}, 1.0)`,
        },
        body: form,
    };
    return await sender(url, option);
}

export async function removeInteractionResponse(application_id: string, interaction_token: string) {
    const url = base_url + `/webhooks/${application_id}/${interaction_token}/messages/@original`;
    const option = {
        method: 'DELETE',
        headers: {
            'User-Agent': `DCcon_Sender (${process.env['AUTH_URL']}, 1.0)`,
            'Content-Type': 'application/json',
        },
    };
    return await sender(url, option);
}

async function sender(url: string, option: Record<string, unknown>) {
    try {
        const response = await fetch(url, option);
        if (response.status === 204) {
            return { ok: true };
        }
        return {
            ok: true,
            message: await response.json(),
        };
    } catch (e: unknown) {
        console.error(e);
        if (!(e instanceof Error)) {
            console.log(e);
            return;
        }
        const message = e?.message ?? '';
        return {
            ok: false,
            message: message,
        };
    }
}
