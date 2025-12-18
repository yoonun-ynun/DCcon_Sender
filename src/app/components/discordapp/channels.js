'use client';

import { useEffect, useState } from 'react';
import { storeChannel } from '@/store/storeList';

/**
 * @typedef {Object} Getters
 * @property {() => Promise<{ok: boolean, guilds: {id: string, name: string}[], reason: string}>} getGuilds
 * @property {() => Promise<{discordId: string, name: string, image: string}>} getSession
 */
/**
 * @typedef {{id: string, name: string}[]} field
 */

/**
 * @param {{
 *   usingGuildId: string,
 *   usingChannelId: string,
 *   getters: Getters
 * }} props
 */
export default function Channels({ usingGuildId, usingChannelId, getters }) {
    const set = storeChannel((s) => s.set);
    const guild = storeChannel((s) => s.guild);
    const channel = storeChannel((s) => s.channel);
    const [guildList, setGuildList] = useState(/** @type {field} */ []);
    const [channelList, setChannelList] = useState(/** @type {field} */ []);

    useEffect(() => {
        document.body.classList.add('force-white');
        return () => document.body.classList.remove('force-white');
    }, []);

    useEffect(() => {
        let called = false;
        (async () => {
            const get_guilds = await getters.getGuilds();
            if (!get_guilds.ok) {
                alert('서버 목록을 가져오는데 실패하였습니다.');
                return;
            }
            const guild_list = get_guilds.guilds;
            setGuildList(guild_list);
            if (called) return;
            const found = guild_list.find((item) => item?.id === usingGuildId);
            if (found) {
                const req_channels = await fetch('/api/embed/channels', {
                    method: 'POST',
                    body: JSON.stringify({ guildId: found.id }),
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!req_channels.ok) {
                    alert('채널 목록을 불러오는 중 오류가 발생하였습니다.');
                    return;
                }
                const json_channels = await req_channels.json();
                /**
                 * @type { field }
                 */
                const channels = json_channels.channelList;
                const channel_found = channels.find((item) => item.id === usingChannelId) ?? {
                    id: '',
                    name: '',
                };
                set(found, { id: channel_found.id, name: channel_found.name });
                setChannelList(channels);
            }
        })();

        return () => {
            called = true;
        };
    }, [usingGuildId, usingChannelId, getters]);

    async function setGuild(event) {
        const guild_id = event.currentTarget.value;
        const find = guildList.find((item) => item.id === guild_id) ?? { id: '', name: '' };
        const req_channels = await fetch('/api/embed/channels', {
            method: 'POST',
            body: JSON.stringify({ guildId: find.id }),
            headers: { 'Content-Type': 'application/json' },
        });
        if (!req_channels.ok) {
            alert('채널 목록을 불러오는 중 오류가 발생하였습니다.');
            return;
        }
        const json_channels = await req_channels.json();
        /**
         * @type { field }
         */
        const channels = json_channels.channelList;
        set(find, { id: '', name: '' });
        setChannelList(channels);
    }

    function setChannel(event) {
        const channel_id = event.currentTarget.value;
        const find = channelList.find((item) => item.id === channel_id) ?? { id: '', name: '' };
        set(guild, find);
    }

    return (
        <div>
            <br />
            <select name={'guild'} id={'guildList'} className={'selector'} onChange={setGuild}>
                <option value={''} selected={guild.id === ''}>
                    서버를 선택 해 주세요
                </option>
                {guildList.map((item, i) => {
                    return (
                        <option key={i} value={item.id} selected={item.id === guild.id}>
                            {item.name}
                        </option>
                    );
                })}
            </select>
            <select
                name={'channel'}
                id={'channelList'}
                className={'selector'}
                onChange={setChannel}
            >
                <option value={''} selected={channel.id === ''}>
                    채널을 선택 해 주세요
                </option>
                {channelList.map((item, i) => {
                    return (
                        <option key={i} value={item.id} selected={item.id === channel.id}>
                            {item.name}
                        </option>
                    );
                })}
            </select>
            <br />
            선택한 길드 ID: {guild.id}
            <br />
            선택한 채널 ID: {channel.id}
        </div>
    );
}
