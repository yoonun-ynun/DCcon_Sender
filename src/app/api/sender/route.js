import { signIn } from '@/auth.js';

export async function GET() {
    return signIn('discord', {
        redirectTo: '/sender',
    });
}
