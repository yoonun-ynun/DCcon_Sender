'use client';

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
 * @typedef {Object} DCconInfo
 * @property {number} rank
 * @property { string } package_idx
 * @property { string } title
 * @property {string} desc
 * @property {string} nick_name
 * @property {string} price
 * @property {string} img
 */

/**
 * @param { string } discordId
 * @param {Getters} getters
 * @param { {day: DCconInfo[], week: DCconInfo[], month: DCconInfo[]} } tops
 * @param {{id: string, name: string} | undefined} channelId
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function Selector({ discordId, getters, tops, channelId }) {
    const [msg, setMsg] = useState('');
    const [listInfo, setListInfo] = useState(
        /** @type {{key: string, value: DcconList, empty?: boolean}[]} */ [],
    );
    const [mode, setMode] = useState('registered');
    const [selected, setSelected] = useState(1);

    useEffect(() => {
        let called = false;
        (async () => {
            /**@type {string[]} **/
            let list = [];
            if (mode === 'registered') {
                const listRes = await fetch(`/api/controller?userId=${discordId}`);
                if (!listRes.ok) {
                    setMsg('id로 부터 등록된 리스트를 불러오는 도중 오류가 발생하였습니다.');
                    return;
                }

                list = (await listRes.json()).list ?? [];
            } else {
                const target =
                    mode === 'month' ? tops.month : mode === 'week' ? tops.week : tops.day;
                if (!target) {
                    setMsg('인기 디시콘 정보를 찾을 수 없습니다.');
                    return;
                }

                list = target.map((item) => {
                    return item.package_idx;
                });
            }
            setMsg(list.toString());
            if (called) return;
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
            setListInfo([
                {
                    key: '__empty__',
                    empty: true,
                    value: {
                        main_img: '',
                        idx: '',
                        path: [],
                    },
                },
                ...info.map((item) => {
                    return {
                        key: item.idx,
                        value: item,
                    };
                }),
            ]);
        })();

        return () => {
            called = true;
        };
    }, [discordId, mode, tops]);

    function setSelect(event) {
        const idx = Number(event.currentTarget.id);
        setSelected(idx);
    }

    function changeMode(event) {
        setMode(event.currentTarget.value);
    }

    return (
        <div>
            <List data={listInfo[selected]?.value ?? {}} getters={getters} channelId={channelId} />
            <div className={'selectList'}>
                <div className={'list'} id={'DCconList'}>
                    {listInfo.map((value, key) => {
                        return (
                            <div
                                className={`item ${key === selected ? 'active' : ''}  ${value.empty ? 'stickySelectItem' : ''}`}
                                key={value.key}
                                id={String(key)}
                                onClick={value.empty ? undefined : setSelect}
                            >
                                {value.empty ? (
                                    <select
                                        className="dcconSelect"
                                        value={mode}
                                        onChange={changeMode}
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <option value="registered">등록됨</option>
                                        <option value="month">월간인기</option>
                                        <option value="week">주간인기</option>
                                        <option value="day">일간인기</option>
                                    </select>
                                ) : (
                                    <Image
                                        src={`/api/img?u=${encodeURIComponent(value.value.main_img)}`}
                                        alt=""
                                        width={50}
                                        height={50}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
