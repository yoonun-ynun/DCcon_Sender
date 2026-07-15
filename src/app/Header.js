'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { warmDcconImagesInBrowser } from '@/lib/clientImagePreload.js';
import { storeList } from '@/store/storeList.js';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const senderDocumentPrefetchRef = useRef(null);
    const registeredList = storeList((state) => state.List);
    const registeredData = storeList((state) => state.data);

    const prefetchSender = useCallback(() => {
        router.prefetch('/sender');
        void import('@/app/sender/frame.js').catch(() => {});

        if (!senderDocumentPrefetchRef.current) {
            const request = fetch('/sender', { cache: 'force-cache' })
                .then((response) => response.arrayBuffer())
                .catch(() => {
                    if (senderDocumentPrefetchRef.current === request) {
                        senderDocumentPrefetchRef.current = null;
                    }
                });
            senderDocumentPrefetchRef.current = request;
        }
    }, [router]);

    useEffect(() => {
        const discordId = session?.user?.discordId;
        if (!discordId) return;

        prefetchSender();
    }, [prefetchSender, session?.user?.discordId]);

    useEffect(() => {
        if (!session?.user?.discordId) return;

        warmDcconImagesInBrowser(registeredList.map((idx) => ({ url: registeredData[idx]?.url })));
    }, [registeredData, registeredList, session?.user?.discordId]);

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
            const loading = pipWindow.document.createElement('div');
            const spinner = pipWindow.document.createElement('span');
            const loadingLabel = pipWindow.document.createElement('span');

            pipWindow.document.title = 'DCcon Sender';
            style.textContent = `
                :root, html, body {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    background: #050507;
                    color-scheme: dark;
                }

                body {
                    position: relative;
                }

                .pip-loading {
                    position: absolute;
                    inset: 0;
                    display: grid;
                    place-content: center;
                    justify-items: center;
                    gap: 14px;
                    color: #d8d8e3;
                    font-family: system-ui, sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 0;
                }

                .pip-loading-spinner {
                    width: 34px;
                    height: 34px;
                    border: 3px solid rgba(255, 255, 255, 0.15);
                    border-top-color: #5865f2;
                    border-radius: 50%;
                    animation: pip-spin 0.8s linear infinite;
                }

                iframe {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    border: 0;
                    opacity: 0;
                    transition: opacity 0.12s ease;
                }

                iframe[data-ready='true'] {
                    opacity: 1;
                }

                @keyframes pip-spin {
                    to { transform: rotate(360deg); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .pip-loading-spinner { animation: none; }
                }
            `;

            loading.className = 'pip-loading';
            loading.setAttribute('role', 'status');
            loading.setAttribute('aria-live', 'polite');
            spinner.className = 'pip-loading-spinner';
            spinner.setAttribute('aria-hidden', 'true');
            loadingLabel.textContent = '보내기 화면을 준비하는 중';
            loading.append(spinner, loadingLabel);

            function cleanupReadyListeners() {
                pipWindow.removeEventListener('message', handleReadyMessage);
                pipWindow.removeEventListener('pagehide', cleanupReadyListeners);
                iframe.removeEventListener('load', revealIframe);
                if (readyPoll) pipWindow.clearInterval(readyPoll);
            }

            function revealIframe() {
                iframe.dataset.ready = 'true';
                loading.remove();
                cleanupReadyListeners();
            }

            function handleReadyMessage(event) {
                if (
                    event.origin === window.location.origin &&
                    event.source === iframe.contentWindow &&
                    event.data?.type === 'dccon-sender-ready'
                ) {
                    revealIframe();
                }
            }

            const readyPoll = pipWindow.setInterval(() => {
                try {
                    const frameUrl = new URL(iframe.contentWindow.location.href);
                    const frameDocument = iframe.contentDocument;
                    const hasVisibleShell = frameDocument?.querySelector(
                        'main[role="status"], #selectorList',
                    );

                    if (frameUrl.origin === window.location.origin && hasVisibleShell) {
                        revealIframe();
                    }
                } catch {
                    // Cross-origin redirects are revealed by the iframe load event.
                }
            }, 50);

            pipWindow.addEventListener('message', handleReadyMessage);
            pipWindow.addEventListener('pagehide', cleanupReadyListeners, { once: true });
            iframe.addEventListener('load', revealIframe, { once: true });
            iframe.src = senderUrl;
            iframe.title = 'DCcon Sender';
            iframe.setAttribute('allow', 'clipboard-read; clipboard-write');

            pipWindow.document.head.append(style);
            pipWindow.document.body.replaceChildren(loading, iframe);
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
                    <button
                        id="Discord_login"
                        type="button"
                        onClick={openPIP}
                        onPointerEnter={prefetchSender}
                        onFocus={prefetchSender}
                    >
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
