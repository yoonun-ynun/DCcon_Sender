'use server';

import Selector from '@/app/components/discordapp/selector.js';

export default async function Page() {
    return <Selector CLIENT_ID={process.env.AUTH_DISCORD_ID} />;
}
