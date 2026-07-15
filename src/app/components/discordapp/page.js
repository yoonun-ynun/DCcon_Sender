import Frame from '@/app/components/discordapp/frame.js';
import { day_top, week_top, month_top } from '@/lib/fetchDC';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const [day, week, month] = await Promise.all([day_top(), week_top(), month_top()]);
    return (
        <Frame
            CLIENT_ID={process.env.AUTH_DISCORD_ID}
            tops={{ day: day, week: week, month: month }}
        />
    );
}
