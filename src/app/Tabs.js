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

    function handleClick(idx) {
        setActive(idx);
    }

    return (
        <div>
            <Header />
            <Bar />
            <div id={'body'}>
                <div id={'selector'} data-active={active} className={'tabs'}>
                    <span
                        id={'monthly'}
                        data-idx={0}
                        className={`hot ${active === 0 ? 'active' : ''}`}
                        onClick={() => handleClick(0)}
                    >
                        일간 인기 디시콘
                    </span>
                    <span
                        id={'weekly'}
                        data-idx={1}
                        className={`hot ${active === 1 ? 'active' : ''}`}
                        onClick={() => handleClick(1)}
                    >
                        주간 인기 디시콘
                    </span>
                    <span
                        id={'monthly'}
                        data-idx={2}
                        className={`hot ${active === 2 ? 'active' : ''}`}
                        onClick={() => handleClick(2)}
                    >
                        월간 인기 디시콘
                    </span>
                    <span className={'pill'} aria-hidden="true"></span>
                </div>
                <div className={'list_wrapper'}>
                    <div className={'list'}>
                        {initialData.map((item, i) => {
                            return (
                                <span
                                    id={`hot_${i}`}
                                    className={'hot_item'}
                                    dccon-idx={
                                        active === 0
                                            ? item.day.package_idx
                                            : active === 1
                                              ? item.week.package_idx
                                              : item.month.package_idx
                                    }
                                    onClick={iframe_clicker}
                                    key={i}
                                >
                                    <div className={'img-bg hot-image-frame'}>
                                        <Image
                                            wrapperClassName="hot-dccon-image"
                                            src={
                                                active === 0
                                                    ? `/api/img?u=${encodeURIComponent(item.day.img)}`
                                                    : active === 1
                                                      ? `/api/img?u=${encodeURIComponent(item.week.img)}`
                                                      : `/api/img?u=${encodeURIComponent(item.month.img)}`
                                            }
                                            alt={'DCcon image'}
                                            className={'image'}
                                            width={180}
                                            height={180}
                                        />
                                    </div>
                                    <div className={'title_field'}>
                                        {active === 0
                                            ? item.day.title
                                            : active === 1
                                              ? item.week.title
                                              : item.month.title}
                                    </div>
                                </span>
                            );
                        })}
                    </div>
                </div>
                {url && <IframeOverlay url={url} onClose={() => setUrl(null)} />}
            </div>
            <hr />
            <div id={'footer'}></div>
        </div>
    );
}
