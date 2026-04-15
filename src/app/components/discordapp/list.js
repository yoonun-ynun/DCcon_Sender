import Image from 'next/image';
import { storeChannel } from '@/store/storeList.js';
import { useState } from 'react';
import Sending from '@/app/components/discordapp/sending.js';

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
 *
 * @param {DcconList} data
 * @param {Getters} getters
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function List({ data, getters }) {
    const [msg, setMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const channel = storeChannel((s) => s.channel);
    if (!data || !data.path) {
        return <div></div>;
    }

    async function sender(addr) {
        try {
            setIsLoading(true);
            if (!getters?.send) {
                setMsg('잠시후 시도해주세요');
                return;
            }

            const result = await getters.send(encodeURIComponent(addr), channel.id);
            if (!result.ok) setMsg('전송 중 오류가 발생하였습니다.' + ` reason: ${result.reason}`);
            setIsLoading(false);
        } catch (e) {
            setMsg('에러가 발생하였습니다.');
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 0);
        }
    }

    return (
        <div>
            {isLoading && <Sending />}
            {msg}
            <br />
            <div className={'imageWrap'}>
                <div className={'image_list'}>
                    {data.path.map((item, i) => {
                        return (
                            <div
                                key={i}
                                style={{ cursor: 'pointer' }}
                                data-addr={item.addr}
                                onClick={() => sender(item.addr)}
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
