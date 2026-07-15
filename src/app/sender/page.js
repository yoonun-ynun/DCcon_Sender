import Load from './frame.js';
import Loading from './loading.js';
import { day_top, month_top, week_top } from '@/lib/fetchDC.js';
import { auth } from '@/auth.js';
import { redirect } from 'next/navigation.d.ts';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function SenderContent({ session }) {
    const [day, week, month] = await Promise.all([day_top(), week_top(), month_top()]);

    return (
        <div>
            <Load tops={{ day: day, week: week, month: month }} session={session}></Load>
        </div>
    );
}

export default async function Page() {
    const session = await auth();

    if (!session?.user) {
        redirect('/api/sender');
    }

    return (
        <Suspense fallback={<Loading />}>
            <SenderContent session={session} />
        </Suspense>
    );
}
