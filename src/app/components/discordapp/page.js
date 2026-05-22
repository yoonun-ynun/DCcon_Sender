'use server';

import Frame from '@/app/components/discordapp/frame.js';
import { day_top, week_top, month_top } from '@/lib/fetchDC';

export default async function Page() {
    const day = await day_top();
    const week = await week_top();
    const month = await month_top();
    return (
        <Frame
            CLIENT_ID={process.env.AUTH_DISCORD_ID}
            tops={{ day: day, week: week, month: month }}
        />
    );
}
