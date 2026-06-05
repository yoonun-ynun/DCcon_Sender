'use client';
import { useState } from 'react';
import IframeOverlay from '@/app/components/IframeOveray';
import { useDcconSync } from '@/store/queryList.js';

export default function List({ Params }) {
    const [url, setUrl] = useState(null);
    useDcconSync();

    function iframe_clicker(event) {
        const el = event.target.closest('[dccon-idx]');
        if (!el) return;
        setUrl(`/components/info?idx=${el.getAttribute('dccon-idx')}`);
    }

    return (
        <div>
            <div className="list_wrapper">
                <div className="dccon-grid">
                    {Params.map((item, i) => {
                        return (
                            <div
                                className="premium-card"
                                dccon-idx={item.idx}
                                onClick={iframe_clicker}
                                key={i}
                            >
                                <div className="img-bg">
                                    <img
                                        src={`/api/img?u=${item.img.substring(6)}`}
                                        alt={item.title}
                                        className="image"
                                    />
                                </div>
                                <div className="title_field">{item.title}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {url && <IframeOverlay url={url} onClose={() => setUrl(null)} />}
        </div>
    );
}
