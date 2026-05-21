import Image from '../info/Image.js';
import { storeChannel } from '@/store/storeList.js';
import { useState } from 'react';
import Sending from '@/app/components/discordapp/sending.js';

/**
 * @typedef {Object} DcconPath
 * @property {string} addr
 */

/**
 * @typedef {Object} DcconList
 * @property {string | undefined} title
 * @property {string | undefined} description
 * @property {string} main_img
 * @property {string} idx
 * @property {DcconPath[]} path
 */

/**
 * @typedef {Object} Getters
 * @property {() => Promise<{ok: boolean, guilds: {id: string, name: string}[], reason: string}>} getGuilds
 * @property {() => Promise<{discordId: string, name: string, image: string}>} getSession
 * @property {(id:string, channel:string, double: number) => Promise<{ok: boolean, reason: string}>} send
 */

/**
 *
 * @param {DcconList} data
 * @param {Getters} getters
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function List({ data, getters }) {
    const [msg, setMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [double, setDouble] = useState(1);
    const [selected, setSelected] = useState([]);
    const channel = storeChannel((s) => s.channel);
    if (!data || !data.path) {
        return <div></div>;
    }

    async function clickImage(addr) {
        if (isLoading) return;
        if (double === 1) {
            await sender(addr);
            return;
        }

        if (selected.includes(addr)) {
            setSelected(selected.filter((v) => v !== addr));
            return;
        }

        const next = [...selected, addr];

        if (next.length < double) {
            setSelected(next);
            return;
        }

        setSelected([]);

        await sender(JSON.stringify({ urls: next }), double);
    }

    async function sender(addr, count = 1) {
        try {
            setIsLoading(true);
            if (!getters?.send) {
                setMsg('잠시후 시도해주세요');
                return;
            }

            if (!channel?.id) {
                setMsg('채널을 먼저 선택해주세요');
                return;
            }

            const result = await getters.send(encodeURIComponent(addr), channel.id, count);
            if (!result.ok) setMsg('전송 중 오류가 발생하였습니다.' + ` reason: ${result.reason}`);
        } catch (e) {
            setMsg('에러가 발생하였습니다.');
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 0);
        }
    }

    function changeDoubleMode() {
        setSelected([]);
        setDouble((prev) => (prev % 3) + 1);
    }

    return (
        <div>
            {isLoading && <Sending />}
            {msg}
            <br />
            <div className={`Double mode_${double}`} onClick={changeDoubleMode} role="button">
                {double === 1 ? (
                    <span>싱글콘</span>
                ) : double === 2 ? (
                    <span>더블콘</span>
                ) : (
                    <span>트리플콘</span>
                )}
            </div>
            <div className={'imageWrap'}>
                <div className={'image_list'}>
                    {data.path.map((item, i) => {
                        return (
                            <div
                                key={i}
                                style={{ cursor: 'pointer' }}
                                data-addr={item.addr}
                                className={`dcconImageItem ${selected.includes(item.addr) ? 'selected_dccon' : ''}`}
                                onClick={() => clickImage(item.addr)}
                                role={'button'}
                            >
                                <Image
                                    src={`/api/img?u=${encodeURIComponent(item.addr)}`}
                                    alt={'path image'}
                                    key={i}
                                    width={100}
                                    height={100}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div id={'safety'} style={{ paddingBottom: '100px' }}></div>
        </div>
    );
}
