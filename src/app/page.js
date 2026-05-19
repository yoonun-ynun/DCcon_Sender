import Tabs from '@/app/Tabs';
import { day_top, week_top, month_top } from '@/lib/fetchDC';

export default async function Home() {
    const day = await day_top();
    const week = await week_top();
    const month = await month_top();
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
