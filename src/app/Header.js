'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();

    async function openPIP() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const pip = await documentPictureInPicture.requestWindow({
            width: 100,
            height: 100,
        });
        pip.document.body.innerHTML = '<iframe src="https://yoonun.com/sender"> </iframe>';
    }

    return (
        <div id="header">
            <div id="title" onClick={() => router.push('/')}>
                <span className="title-top">DCcon</span>
                <span className="title-bottom">Sender</span>
            </div>

            <span className="button">
                {session ? (
                    <button id="Discord_login" onClick={() => openPIP()}>
                        PIP 열기
                    </button>
                ) : undefined}
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
