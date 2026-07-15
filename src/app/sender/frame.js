'use client';

import Selector from '@/app/components/discordapp/selector.js';
import { getSession } from 'next-auth/react';
import Channels from '../components/discordapp/channels.js';
import PipReady from './PipReady.js';

export default function Load({ tops, session }) {
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
    return (
        <div>
            <PipReady />
            <Channels getters={/** @type {Getters | null} */ getters} />
            <Selector discordId={session.user.discordId} tops={tops} getters={getters}></Selector>
        </div>
    );
}
