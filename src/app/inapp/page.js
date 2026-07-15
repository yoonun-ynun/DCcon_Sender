import Load from './frame.js';
import { day_top, month_top, week_top } from '../../lib/fetchDC.js';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const [day, week, month] = await Promise.all([day_top(), week_top(), month_top()]);
    return (
        <div>
            <Load tops={{ day: day, week: week, month: month }}></Load>
        </div>
    );
}
