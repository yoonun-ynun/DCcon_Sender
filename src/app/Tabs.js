'use client';

import { useState } from 'react';
import IframeOverlay from '@/app/components/IframeOveray';
import Bar from '@/app/Bar';
import Header from '@/app/Header';
import { useDcconSync } from '@/store/queryList.js';
import Image from '@/app/components/info/Image.js';

export default function Tabs({ initialData }) {
    const [active, setActive] = useState(0);
    const [url, setUrl] = useState(null);
    useDcconSync();

    function iframe_clicker(event) {
        const el = event.target.closest('[dccon-idx]');
        if (!el) return;
        setUrl(`/components/info?idx=${el.getAttribute('dccon-idx')}`);
    }

    return (
        <div>
            <Header />
            <Bar />
            <div id="body">
                {/* 탭 셀렉터 */}
                <div id="selector" data-active={active} className="tabs">
                    <span
                        className={`hot ${active === 0 ? 'active' : ''}`}
                        onClick={() => setActive(0)}
                    >
                        일간 인기
                    </span>
                    <span
                        className={`hot ${active === 1 ? 'active' : ''}`}
                        onClick={() => setActive(1)}
                    >
                        주간 인기
                    </span>
                    <span
                        className={`hot ${active === 2 ? 'active' : ''}`}
                        onClick={() => setActive(2)}
                    >
                        월간 인기
                    </span>
                    <span className="pill" aria-hidden="true"></span>
                </div>

                {/* 리스트 영역 */}
                <div className="list_wrapper">
                    <div className="dccon-grid">
                        {initialData.map((item, i) => {
                            const currentData =
                                active === 0 ? item.day : active === 1 ? item.week : item.month;

                            return (
                                <div
                                    className="premium-card"
                                    dccon-idx={currentData.package_idx}
                                    onClick={iframe_clicker}
                                    key={i}
                                >
                                    <div className="img-bg">
                                        <Image
                                            wrapperClassName="hot-dccon-image"
                                            src={`/api/img?u=${encodeURIComponent(currentData.img)}`}
                                            alt={currentData.title}
                                            className="image"
                                            width={180}
                                            height={180}
                                        />
                                    </div>
                                    <div className="title_field">{currentData.title}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {url && <IframeOverlay url={url} onClose={() => setUrl(null)} />}
            </div>
            <div id="footer"></div>
        </div>
    );
}
