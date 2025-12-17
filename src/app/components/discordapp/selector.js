'use client';

import { useEffect, useRef, useState } from 'react';
import { DiscordSDK, RPCCloseCodes } from '@discord/embedded-app-sdk';
import { getSession, useSession } from 'next-auth/react';

export default function Selector({ CLIENT_ID }) {
    const sdkRef = useRef(null);
    const startedRef = useRef(false);
    const { data, status } = useSession();
    const [msg, setMsg] = useState('초기화중');
    const [token, setToken] = useState(null);
    const [session, setSession] = useState(null);
    const [auth, setAuth] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') return;
        if (startedRef.current) return;
        startedRef.current = true;

        const discordSdk = new DiscordSDK(CLIENT_ID);
        async function setup() {
            await discordSdk.ready();
            sdkRef.current = discordSdk;
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
            setMsg('cookie-test 확인');
            await fetch('/api/embed/cookie-test', { credentials: 'include' });
            const r2 = await fetch('/api/embed/cookie-test', { credentials: 'include' });
            const j2 = await r2.json();

            const cookieUsable = j2.gotCookie;
            setMsg(`cookieUsable: ${cookieUsable}\ncode 반환 및 로그인 시도`);
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
            if (cookieUsable) {
                await getSession();
                const user = await getSession();
                setMsg(status);
                setSession(user);
            } else {
                setToken(login_json.embeddedToken);
                const embed_session = await fetch('/api/embed/session', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${login_json.embeddedToken}` },
                });
                setSession(await embed_session.json());
            }
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
    }, [CLIENT_ID, status]);

    if (!auth) {
        return (
            <div style={{ padding: 12 }}>
                <img
                    src={
                        '/api/img?u=%2F%2Fdcimg5.dcinside.com%2Fdccon.php%3Fno%3D62b5df2be09d3ca567b1c5bc12d46b394aa3b1058c6e4d0ca41648b658ea2670533b35490cc266f07671eb7dca04e463187b0dbae0fab3b021328466b7db6218e976ae7feeaf7144eba3'
                    }
                    alt={'image'}
                />
                status: {status}
                msg: {msg}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: 'white', color: 'black' }}>
            <div
                style={{
                    padding: '56px',
                    background: 'rgba(255,0,0,0.9)',
                    color: '#fff',
                    fontSize: 14,
                }}
            >
                모바일 디버그: 여기 보이면 렌더는 됨 ✅
            </div>
            <div style={{ paddingTop: 60, color: 'black' }}>로그인 성공 name: {session.name}</div>
        </div>
    );
}
