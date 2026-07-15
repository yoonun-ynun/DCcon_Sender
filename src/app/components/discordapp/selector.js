'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from '@/app/components/info/Image.js';
import './style.css';
import List from '@/app/components/discordapp/list.js';
import { warmDcconImagesInBrowser } from '@/lib/clientImagePreload.js';
import { useDcconSync } from '@/store/queryList.js';

/**
 * @typedef {Object} DcconList
 * @property {string | undefined} title
 * @property {string | undefined} description
 * @property {string} main_img
 * @property {string} idx
 * @property {{addr: string, ext?: string}[]} path
 */

/**
 * @typedef {Object} DcconSummary
 * @property {string} idx
 * @property {string} img
 * @property {string | undefined} title
 */

/**
 * @typedef {Object} Getters
 * @property {() => Promise<{ok: boolean, guilds: {id: string, name: string}[], reason: string}>} getGuilds
 * @property {() => Promise<{discordId: string, name: string, image: string}>} getSession
 * @property {(() => Promise<{list: unknown[]}>) | undefined} getRegisteredList
 * @property {(id:string, channel:string) => Promise<{ok: boolean, reason: string}>} send
 */

/**
 * @typedef {Object} DCconInfo
 * @property {number} rank
 * @property {string} package_idx
 * @property {string} title
 * @property {string} desc
 * @property {string} nick_name
 * @property {string} price
 * @property {string} img
 */

/**
 * @param {unknown} item
 * @param {Map<string, DCconInfo>} popularByIdx
 * @returns {DcconSummary | null}
 */
function normalizeRegisteredItem(item, popularByIdx) {
    const idx = typeof item === 'string' ? item : item?.idx;
    if (!idx) return null;

    const normalizedIdx = String(idx);
    const popular = popularByIdx.get(normalizedIdx);

    return {
        idx: normalizedIdx,
        img: typeof item === 'object' && item?.img ? String(item.img) : (popular?.img ?? ''),
        title: popular?.title ?? (typeof item === 'object' ? item?.title : undefined),
    };
}

/**
 * @param {string | undefined} discordId
 * @param {Getters} getters
 * @param {{day: DCconInfo[], week: DCconInfo[], month: DCconInfo[]}} tops
 * @param {{id: string, name: string} | undefined} channelId
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function Selector({ discordId, getters, tops, channelId }) {
    const {
        List: storedRegisteredList,
        data: storedRegisteredData,
        update: updateRegisteredItem,
    } = useDcconSync({
        getRegisteredList: getters?.getRegisteredList,
        cacheKey: discordId,
    });
    const [msg, setMsg] = useState('');
    const [registeredInfo, setRegisteredInfo] = useState(/** @type {DcconSummary[]} */ ([]));
    const [selectedInfo, setSelectedInfo] = useState(/** @type {DcconList | null} */ (null));
    const [isInfoLoading, setIsInfoLoading] = useState(false);
    const [mode, setMode] = useState('registered');
    const [selected, setSelected] = useState(/** @type {string | null} */ (null));
    const infoAbortRef = useRef(/** @type {AbortController | null} */ (null));
    const infoCacheRef = useRef(/** @type {Map<string, DcconList>} */ (new Map()));

    const popularByIdx = useMemo(() => {
        const popularItems = [...(tops.day ?? []), ...(tops.week ?? []), ...(tops.month ?? [])];
        return new Map(popularItems.map((item) => [String(item.package_idx), item]));
    }, [tops]);

    const listInfo = useMemo(() => {
        if (mode === 'registered') {
            return registeredInfo
                .map((item) => normalizeRegisteredItem(item, popularByIdx))
                .filter(Boolean);
        }

        const target = mode === 'month' ? tops.month : mode === 'week' ? tops.week : tops.day;
        return (target ?? []).map((item) => ({
            idx: String(item.package_idx),
            img: item.img,
            title: item.title,
        }));
    }, [mode, popularByIdx, registeredInfo, tops]);

    useEffect(() => {
        infoAbortRef.current?.abort();
        setSelected(null);
        setSelectedInfo(null);
        setIsInfoLoading(false);
        setMsg('');

        return () => {
            infoAbortRef.current?.abort();
        };
    }, [discordId, mode]);

    useEffect(() => {
        const nextList = storedRegisteredList.map((idx) => ({
            idx,
            img: storedRegisteredData[idx]?.url ?? '',
            title: storedRegisteredData[idx]?.name,
        }));

        setRegisteredInfo(nextList);
        warmDcconImagesInBrowser(nextList);
    }, [storedRegisteredData, storedRegisteredList]);

    async function setSelect(item) {
        infoAbortRef.current?.abort();
        setSelected(item.idx);
        setMsg('');

        const cachedInfo = infoCacheRef.current.get(item.idx);
        if (cachedInfo) {
            infoAbortRef.current = null;
            setSelectedInfo(cachedInfo);
            setIsInfoLoading(false);
            return;
        }

        const controller = new AbortController();
        infoAbortRef.current = controller;
        setSelectedInfo(null);
        setIsInfoLoading(true);

        try {
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idx: item.idx, warmImages: true }),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error('Failed to load DCcon info');
            }

            const info = await response.json();
            if (controller.signal.aborted) return;

            infoCacheRef.current.set(item.idx, info);
            setSelectedInfo(info);
            if (!item.img && info.main_img && mode === 'registered') {
                updateRegisteredItem(item.idx, item.title || info.title, info.main_img);
                warmDcconImagesInBrowser([{ img: info.main_img }]);

                fetch('/api/controller', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idx: item.idx, img: info.main_img }),
                }).catch((error) => console.error('Failed to migrate DCcon image', error));
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error(error);
            setMsg('디시콘 정보를 불러오는 도중 오류가 발생하였습니다.');
        } finally {
            if (infoAbortRef.current === controller) {
                setIsInfoLoading(false);
            }
        }
    }

    function changeMode(event) {
        setMode(event.currentTarget.value);
    }

    return (
        <div>
            {isInfoLoading ? (
                <div className="dcconInfoStatus">디시콘 정보를 불러오는 중입니다.</div>
            ) : msg ? (
                <div className="dcconInfoStatus error">{msg}</div>
            ) : (
                <List data={selectedInfo ?? {}} getters={getters} channelId={channelId} />
            )}
            <div className={'selectList'}>
                <div className={'list'} id={'DCconList'}>
                    <div className="item stickySelectItem">
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
                    </div>
                    {listInfo.map((item) => (
                        <div
                            className={`item ${item.idx === selected ? 'active' : ''}`}
                            key={item.idx}
                            onClick={() => setSelect(item)}
                            role="button"
                            title={item.title}
                        >
                            {item.img ? (
                                <Image
                                    src={`/api/img?u=${encodeURIComponent(item.img)}`}
                                    alt={item.title ?? ''}
                                    width={50}
                                    height={50}
                                />
                            ) : (
                                <span className="dcconImageFallback">{item.idx.slice(-3)}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
