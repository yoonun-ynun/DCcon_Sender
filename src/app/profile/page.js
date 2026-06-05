'use client';
import Header from '@/app/Header';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import IframeOverlay from '@/app/components/IframeOveray';
import { useDcconSync } from '@/store/queryList.js';
// 생성한 CSS 모듈 import
import styles from './page.module.css';

export default function Page() {
    const { reset } = useDcconSync();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [menu, setMenu] = useState('profile');

    useEffect(() => {
        if (status === 'unauthenticated') {
            reset();
            router.replace('/');
        }
    }, [status, router]);

    if (status !== 'authenticated') return null;

    return (
        <div>
            <Header />
            <main className={styles.container}>
                <div className={styles.layout}>
                    {/* 사이드바 메뉴 영역 */}
                    <nav className={styles.sidebar}>
                        <button
                            className={`${styles.menuBtn} ${menu === 'profile' ? styles.menuBtnActive : ''}`}
                            onClick={() => setMenu('profile')}
                        >
                            프로필
                        </button>
                        <button
                            className={`${styles.menuBtn} ${menu === 'list' ? styles.menuBtnActive : ''}`}
                            onClick={() => setMenu('list')}
                        >
                            나의 디시콘
                        </button>
                    </nav>

                    {/* 메인 컨텐츠 영역 */}
                    <section className={styles.content}>
                        {menu === 'profile' && (
                            <Profile
                                discordId={session.user.discordId}
                                img={session.user.image}
                                name={session.user.name}
                            />
                        )}
                        {menu === 'list' && <ListUp />}
                    </section>
                </div>

                {/* 하단 로그아웃 */}
                <div className={styles.footer}>
                    <button
                        className={styles.logoutBtn}
                        onClick={() => {
                            reset();
                            signOut();
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    );
}

// 가독성을 위해 Profile을 컴포넌트 형태로 분리했습니다.
function Profile({ discordId, img, name }) {
    return (
        <div className={styles.profileWrapper}>
            <img className={styles.profileImg} src={img} alt={`${name}'s profile image`} />
            <div className={styles.profileInfo}>
                <h2>{name}</h2>
                <p>ID: {discordId}</p>
            </div>
        </div>
    );
}

function ListUp() {
    const { isFetching, refetch, List, data, remove } = useDcconSync();
    const [url, setUrl] = useState(null);

    function Delete(event) {
        const el = event.target.closest('[data-dccon-idx]');
        if (!el) return;
        const idx = el.getAttribute('data-dccon-idx');
        fetch('api/controller', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idx: idx }),
        })
            .then((res) => res.json())
            .then((resData) => {
                if (resData.success) {
                    alert('삭제에 성공하였습니다');
                    remove(idx);
                } else alert(resData.message);
            })
            .catch((err) => {
                alert('삭제 중 오류가 발생하였습니다.');
                console.error(err);
            });
    }

    function iframe_clicker(event) {
        const el = event.target.closest('[data-dccon-idx]');
        if (!el) return;
        setUrl(`/components/info?idx=${el.getAttribute('data-dccon-idx')}`);
    }

    return (
        <div>
            <div className={styles.listHeader}>
                <h3>내 디시콘 목록</h3>
                <button
                    className={styles.refreshBtn}
                    onClick={() => !isFetching && refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className={styles.listGrid}>
                {List !== null && List.length > 0 ? (
                    List.map((item, i) => (
                        <div className={styles.listItem} key={`dccon${i}`}>
                            <img
                                src={`/api/img?u=${encodeURIComponent(data[item].url)}`}
                                alt={'dccon_img'}
                            />
                            <div
                                className={styles.itemTitle}
                                data-dccon-idx={item}
                                onClick={iframe_clicker}
                            >
                                {data[item].name}
                            </div>
                            <button
                                className={styles.deleteBtn}
                                data-dccon-idx={item}
                                onClick={Delete}
                                title="삭제"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#888', padding: '2rem 0' }}>
                        저장된 디시콘이 없습니다.
                    </p>
                )}
            </div>
            {url && <IframeOverlay url={url} onClose={() => setUrl(null)} />}
        </div>
    );
}
