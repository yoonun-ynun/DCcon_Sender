'use client';

import Selector from '@/app/components/discordapp/selector.js';
import { useEffect, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';

export default function Load({ tops }) {
    const [context, setContext] = useState(null);

    const getters = {
        getSession: async () => {
            const session = await getSession();
            return session?.user;
        },
        getGuilds: async () => {
            const guilds = await fetch('/api/embed/guilds', {
                method: 'POST',
                body: JSON.stringify({ cookieUsable: true }),
                headers: { 'Content-Type': 'application/json' },
            });
            return await guilds.json();
        },
        send: async (item, ch, d, r, index) => {
            const res = await fetch(
                `/api/embed/send?u=${item}&c=${true}&ch=${ch}&d=${d}&r=${r}&i=${index}`,
            );
            return await res.json();
        },
        recents: async (ch) => {
            const res = await fetch(`/api/embed/recents?c=${true}&ch=${ch}`);
            return await res.json();
        },
    };

    useEffect(() => {
        async function listener(event) {
            if (event.origin !== 'https://discord.com') {
                return;
            }

            // Discord iframe의 부모 창에서 보낸 메시지만 허용
            if (event.source !== window.parent) {
                return;
            }

            if (event.data?.type !== 'DCCON_CONTEXT') {
                return;
            }

            const { userId, channelId, messageId } = event.data;

            if (!userId || !channelId) {
                return;
            }
            const session = await getSession();
            if (!session?.user) {
                await signIn('discord-channel-proof', {
                    userId,
                    channelId,
                    messageId,
                    redirect: false,
                });
            }

            setContext({
                userId,
                channelId,
                messageId,
            });
        }

        window.addEventListener('message', listener);

        window.parent.postMessage({ type: 'DCCON_READY' }, 'https://discord.com');

        return () => {
            window.removeEventListener('message', listener);
        };
    }, []);

    if (context) {
        return (
            <div>
                <Selector
                    discordId={context.userId}
                    channelId={{ id: context.channelId, name: '' }}
                    tops={tops}
                    getters={getters}
                ></Selector>
            </div>
        );
    } else {
        return <div>now initializing...</div>;
    }
}
