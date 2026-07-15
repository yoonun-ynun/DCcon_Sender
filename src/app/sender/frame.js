'use client';

import Selector from '@/app/components/discordapp/selector.js';
import { getSession } from 'next-auth/react';
import Channels from '../components/discordapp/channels.js';
import PipReady from './PipReady.js';
import { useEffect, useMemo, useState } from 'react';

const EMPTY_TOPS = { day: [], week: [], month: [] };

export default function Load({ session }) {
    const [tops, setTops] = useState(EMPTY_TOPS);
    const getters = useMemo(
        () => ({
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
        }),
        [],
    );

    useEffect(() => {
        let cancelled = false;

        async function loadTops() {
            try {
                const response = await fetch('/api/top');
                if (!response.ok) throw new Error('Failed to load DCcon top lists');

                const data = await response.json();
                if (cancelled) return;
                setTops({
                    day: Array.isArray(data.day) ? data.day : [],
                    week: Array.isArray(data.week) ? data.week : [],
                    month: Array.isArray(data.month) ? data.month : [],
                });
            } catch (error) {
                if (!cancelled) console.error(error);
            }
        }

        loadTops();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            <PipReady />
            <Channels getters={/** @type {Getters | null} */ getters} />
            <Selector discordId={session.user.discordId} tops={tops} getters={getters}></Selector>
        </div>
    );
}
