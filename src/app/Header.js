'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <div id="header">
            <div id="title" onClick={() => router.push('/')}>
                <span className="title-top">DCcon</span>
                <span className="title-bottom">Sender</span>
            </div>

            <span className="button">
                {session ? (
                    <button id="Discord_login" onClick={() => router.push('/profile')}>
                        <img src="/Discord-Symbol.svg" alt="Discord" id="Discord_symbol" />
                        {session.user.name}
                    </button>
                ) : (
                    <button id="Discord_login" onClick={() => signIn('discord')}>
                        <img src="/Discord-Symbol.svg" alt="Discord" id="Discord_symbol" />
                        Sign In
                    </button>
                )}
            </span>
        </div>
    );
}
