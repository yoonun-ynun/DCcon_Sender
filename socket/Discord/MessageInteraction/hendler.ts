import { embedSender } from './SendDCEmbed.js';
import addRecommendReaction from './addRecommendReaction.js';

const interaction: Record<
    string,
    (
        data: string,
        channel_id: string,
        user_id?: string,
        message_id?: string,
        guild_id?: string,
        image?: string,
    ) => Promise<void>
> = {
    dcinside: embedSender,
    reaction: addRecommendReaction,
    none: () => {
        return Promise.resolve();
    },
};

export async function messageHandler(event: messageEvent) {
    const type = checkInteraction(event.data);
    await interaction[type](event.data, event.channel_id);
    await interaction['reaction'](
        event.data,
        event.channel_id,
        event.user_id,
        event.message_id,
        event.guild_id,
        event.image,
    );
}

function checkInteraction(data: string): string {
    const dc_regex = /https:\/\/(gall|m)\.dcinside\.com\/[^\s]+(\/|no=)\d+/;
    if (dc_regex.test(data)) {
        console.log('디시 링크 트리거');
        return 'dcinside';
    } else return 'none';
}

interface messageEvent {
    data: string;
    channel_id: string;
    message_id: string;
    user_id: string;
    guild_id?: string;
    image?: string;
}
