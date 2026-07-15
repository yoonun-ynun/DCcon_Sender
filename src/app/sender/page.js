import Load from './frame.js';
import { auth } from '@/auth.js';
import { redirect } from 'next/navigation.d.ts';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const session = await auth();

    if (!session?.user) {
        redirect('/api/sender');
    }

    return (
        <div>
            <Load session={session} />
        </div>
    );
}
