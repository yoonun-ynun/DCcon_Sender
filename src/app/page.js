import Tabs from '@/app/Tabs';
import { day_top, week_top, month_top } from '@/lib/fetchDC';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const [day, week, month] = await Promise.all([day_top(), week_top(), month_top()]);
    const data = [];
    day.forEach((item) => {
        data.push({ day: item });
    });
    week.forEach((item, i) => {
        data[i].week = item;
    });
    month.forEach((item, i) => {
        data[i].month = item;
    });

    return <Tabs initialData={data} />;
}
