'use client';

import { useEffect, useRef, useState } from 'react';
import { DiscordSDK, RPCCloseCodes } from '@discord/embedded-app-sdk';
import { getSession, useSession } from 'next-auth/react';
import Channels from '@/app/components/discordapp/channels.js';

export default function Frame({ CLIENT_ID }) {
    const sdkRef = useRef(null);
    const startedRef = useRef(false);
    const platform = useRef('');
    const getters = useRef(null);
    const token = useRef(null);
    const refreshing = useRef(null);
    const { data, status } = useSession();
    const [msg, setMsg] = useState('초기화중');
    const [session, setSession] = useState(null);
    const [auth, setAuth] = useState(false);

    //헤더에 발급한 token을 가지고 fetch할 시
    async function authedFetch(url, options = {}) {
        async function doAjax() {
            return await fetch(url, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${token.current}`,
                },
            });
        }

        let res = await doAjax();
        if (res.status === 401) {
            await checkRefresh();
            res = await doAjax();
        }
        return await res.json();
    }

    //token refresh
    async function checkRefresh() {
        if (refreshing.current) return refreshing.current;

        refreshing.current = (async () => {
            const res = await fetch('/api/embed/refresh', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token.current}` },
            });
            if (!res.ok) throw Error('Error during request refresh.');
            const newToken = await res.json();
            if (!newToken?.embeddedToken) throw Error('Missing token.');
            token.current = newToken.embeddedToken;
        })();

        try {
            await refreshing.current;
        } catch (e) {
            sdkRef?.current?.close?.(RPCCloseCodes.CLOSE_NORMAL, '토큰 refresh 실패');
        } finally {
            refreshing.current = null;
        }
    }

    useEffect(() => {
        //중복 실행 검사
        if (startedRef.current) return;
        startedRef.current = true;

        const discordSdk = new DiscordSDK(CLIENT_ID);

        //로그인 시작
        async function setup() {
            await discordSdk.ready();
            sdkRef.current = discordSdk;

            platform.current = discordSdk.platform;

            //Discord에 Authorization_code 요청
            const res = await discordSdk.commands.authorize({
                client_id: CLIENT_ID,
                response_type: 'code',
                state: crypto.randomUUID(),
                scope: ['identify', 'guilds'],
            });
            const code = res.code;
            if (!code) {
                discordSdk.close(RPCCloseCodes.CLOSE_NORMAL, '인증을 할 수 없습니다.');
                return;
            }

            //브라우저가 third-party-cookie를 허용하는지 확인
            setMsg('cookie-test 확인');
            await fetch('/api/embed/cookie-test', { credentials: 'include' });
            const r2 = await fetch('/api/embed/cookie-test', { credentials: 'include' });
            const j2 = await r2.json();

            const cookieUsable = j2.gotCookie;
            setMsg(`cookieUsable: ${cookieUsable}\ncode 반환 및 로그인 시도`);

            //쿠키 사용 가능성과 함께 로그인 요청, api/embed/login 코드 참조
            const login_res = await fetch('/api/embed/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, instanceId: discordSdk.instanceId, cookieUsable }),
            });
            if (!login_res.ok) {
                setMsg('로그인 실패');
                discordSdk.close(RPCCloseCodes.CLOSE_NORMAL, '로그인 실패');
                return;
            }
            const login_json = await login_res.json();

            //쿠키 사용 가능한지에 따른 응답에 따라 JWT, Auth헤더를 사용한 토큰 사용으로 갈리기 때문에 별개의 처리 필요
            //getters 객체를 통해 토큰 교환 과정은 최대한 추상화
            if (cookieUsable) {
                const user = await waitForNextAuthSession();
                if (!user) {
                    setMsg('session 동기화 실패');
                    setTimeout(() => {
                        try {
                            discordSdk.close(
                                RPCCloseCodes.CLOSE_NORMAL,
                                'session 동기화에 실패하였습니다.',
                            );
                        } catch {}
                    }, 1000);
                    return;
                }
                setMsg('next-auth session 확인 완료');
                getters.current = {
                    getSession: async () => {
                        const session = await getSession();
                        return session?.user;
                    },
                    getGuilds: async () => {
                        const guilds = await fetch('/api/embed/guilds', {
                            method: 'POST',
                            body: JSON.stringify({ cookieUsable }),
                            headers: { 'Content-Type': 'application/json' },
                        });
                        return await guilds.json();
                    },
                };
                setSession(user.user);
            } else {
                token.current = login_json.embeddedToken;
                const embed_session = await fetch('/api/embed/session', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token.current}` },
                });
                setSession(await embed_session.json());
                getters.current = {
                    getSession: async () => {
                        return await authedFetch('/api/embed/session', { method: 'POST' });
                    },
                    getGuilds: async () => {
                        return await authedFetch('/api/embed/guilds', {
                            method: 'POST',
                            body: JSON.stringify({ cookieUsable }),
                            headers: { 'Content-Type': 'application/json' },
                        });
                    },
                };
            }

            //setAuth를 true 로 바꿈으로써 페이지 로딩
            setAuth(true);
            setMsg('로그인 성공');
        }
        setup().catch(() => {
            try {
                setMsg('인증 중 오류');
                setTimeout(
                    () => discordSdk.close(RPCCloseCodes.CLOSE_NORMAL, '인증 중 오류'),
                    1000,
                );
            } catch {}
        });
    }, [CLIENT_ID]);

    if (!auth) {
        return (
            <div style={{ paddingTop: 56 }}>
                <img
                    src={
                        '/api/img?u=%2F%2Fdcimg5.dcinside.com%2Fdccon.php%3Fno%3D62b5df2be09d3ca567b1c5bc12d46b394aa3b1058c6e4d0ca41648b658ea2670533b35490cc266f07671eb7dca04e463187b0dbae0fab3b021328466b7db6218e976ae7feeaf7144eba3'
                    }
                    alt={'image'}
                />
                <br />
                msg: {msg}
            </div>
        );
    }

    return (
        <div>
            {platform.current === 'mobile' && (
                <div
                    style={{
                        paddingTop: '56px',
                        background: 'rgba(0,0,0,0.0)',
                    }}
                ></div>
            )}
            <Channels
                usingGuildId={sdkRef.current?.guildId}
                usingChannelId={sdkRef.current?.channelId}
                getters={getters.current}
            />
            로그인 성공
            <br />
            디스코드 닉네임: {session?.name}
        </div>
    );
}
async function waitForNextAuthSession({ tries = 10, interval = 100 } = {}) {
    for (let i = 0; i < tries; i++) {
        const session = await getSession();
        if (session) return session;
        await new Promise((r) => setTimeout(r, interval));
    }
    return null;
}
