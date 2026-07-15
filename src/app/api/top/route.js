import { NextResponse } from 'next/server';
import { day_top, month_top, week_top } from '@/lib/fetchDC.js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [day, week, month] = await Promise.all([day_top(), week_top(), month_top()]);
        return NextResponse.json({ day, week, month });
    } catch (error) {
        console.error('Failed to load DCcon top lists', error);
        return NextResponse.json({ error: 'Failed to load DCcon top lists' }, { status: 502 });
    }
}
