'use server';

import Load from './frame.js';
import { day_top, month_top, week_top } from '@/lib/fetchDC.js';
import { auth } from '@/auth.js';
import { redirect } from 'next/navigation.d.ts';

export default async function Page() {
    const day = await day_top();
    const week = await week_top();
    const month = await month_top();
    const session = await auth();

    if (!session?.user) {
        redirect('/api/sender');
    } else {
        return (
            <div>
                <Load tops={{ day: day, week: week, month: month }} session={session}></Load>
            </div>
        );
    }
}
