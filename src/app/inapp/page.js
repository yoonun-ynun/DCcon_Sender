'use server';

import Load from './frame.js';
import { day_top, month_top, week_top } from '../../lib/fetchDC.js';

export default async function Page() {
    const day = await day_top();
    const week = await week_top();
    const month = await month_top();
    return (
        <div>
            <Load tops={{ day: day, week: week, month: month }}></Load>
        </div>
    );
}
