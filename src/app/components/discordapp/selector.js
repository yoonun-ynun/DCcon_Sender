import { useEffect, useState } from 'react';
import Image from 'next/image';
import './style.css';
import List from '@/app/components/discordapp/list.js';

/**
 * @typedef {Object} DcconList
 * @property {string | undefined} title
 * @property {string | undefined} description
 * @property { string } main_img
 * @property { string } idx
 * @property { string[] } path
 */

/**
 * @typedef {Object} Getters
 * @property {() => Promise<{ok: boolean, guilds: {id: string, name: string}[], reason: string}>} getGuilds
 * @property {() => Promise<{discordId: string, name: string, image: string}>} getSession
 * @property {(id:string, channel:string) => Promise<{ok: boolean, reason: string}>} send
 */

/**
 * @param { string } discordId
 * @param {Getters} getters
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function Selector({ discordId, getters }) {
    const [msg, setMsg] = useState('');
    const [listInfo, setListInfo] = useState(/**@type {Record<string, DcconList>}*/ {});
    const [selected, setSelected] = useState('');

    useEffect(() => {
        let called = false;

        (async () => {
            const listRes = await fetch(`/api/controller?userId=${discordId}`);
            if (!listRes.ok) {
                setMsg('id로 부터 등록된 리스트를 불러오는 도중 오류가 발생하였습니다.');
                return;
            }
            /** @type { string[] } */
            const list = (await listRes.json()).list ?? [];
            setMsg(list.toString());
            if (called) return;
            setSelected(list[0]);
            /** @type { DcconList[] } */
            const info = await Promise.all(
                list.map(async (item) => {
                    return (
                        await fetch('/api/info', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idx: item }),
                        })
                    ).json();
                }),
            );
            setMsg(info.toString());
            if (called) return;
            setListInfo(
                Object.fromEntries(
                    info.map((item) => {
                        return [item.idx, item];
                    }),
                ),
            );
        })();

        return () => {
            called = true;
        };
    }, [discordId]);

    function setSelect(event) {
        const idx = event.currentTarget.id;
        setSelected(idx);
    }

    return (
        <div>
            <List data={listInfo[selected] ?? {}} getters={getters} />
            <div className={'selectList'}>
                <div className={'list'} id={'DCconList'}>
                    {Object.entries(listInfo).map(([key, value]) => {
                        return (
                            <div
                                className={`item ${key === selected ? 'active' : ''} `}
                                key={key}
                                id={key}
                                onClick={setSelect}
                            >
                                <Image
                                    src={`/api/img?u=${encodeURIComponent(value.main_img)}`}
                                    alt={''}
                                    width={50}
                                    height={50}
                                ></Image>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
