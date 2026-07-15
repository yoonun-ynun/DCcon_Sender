'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();

    async function openPIP() {
        const senderUrl = new URL('/sender', window.location.origin).toString();
        const pictureInPicture = window.documentPictureInPicture;

        if (!pictureInPicture?.requestWindow) {
            window.open(
                senderUrl,
                'dccon-sender',
                'popup=yes,width=450,height=600,resizable=yes,scrollbars=yes',
            );
            return;
        }

        if (pictureInPicture.window && !pictureInPicture.window.closed) {
            pictureInPicture.window.focus();
            return;
        }

        try {
            const pipWindow = await pictureInPicture.requestWindow({
                width: 450,
                height: 600,
            });
            const style = pipWindow.document.createElement('style');
            const iframe = pipWindow.document.createElement('iframe');

            pipWindow.document.title = 'DCcon Sender';
            style.textContent = `
                :root, html, body {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    background: #050507;
                }

                iframe {
                    display: block;
                    width: 100%;
                    height: 100%;
                    border: 0;
                }
            `;

            iframe.src = senderUrl;
            iframe.title = 'DCcon Sender';
            iframe.setAttribute('allow', 'clipboard-read; clipboard-write');

            pipWindow.document.head.append(style);
            pipWindow.document.body.replaceChildren(iframe);
        } catch (error) {
            if (error.name !== 'NotAllowedError') {
                console.error('Failed to open Picture-in-Picture window', error);
            }
        }
    }

    return (
        <div id="header">
            <div id="title" onClick={() => router.push('/')}>
                <span className="title-top">DCcon</span>
                <span className="title-bottom">Sender</span>
            </div>

            <span className="button">
                {session ? (
                    <button id="Discord_login" type="button" onClick={openPIP}>
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
