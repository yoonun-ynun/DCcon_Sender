'use server';

import Frame from '@/app/components/discordapp/frame.js';

export default async function Page() {
    return <Frame CLIENT_ID={process.env.AUTH_DISCORD_ID} />;
}
