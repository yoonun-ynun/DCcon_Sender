'use client';
import { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import './iframe.css';

function getCacheableImageSrc(src) {
    if (typeof src !== 'string') return src;

    try {
        const proxyUrl = new URL(src, 'https://dccon.local');
        if (proxyUrl.pathname !== '/api/img') return src;

        const upstreamValue = proxyUrl.searchParams.get('u');
        if (!upstreamValue) return src;

        const upstreamUrl = new URL(
            upstreamValue.startsWith('//') ? `https:${upstreamValue}` : upstreamValue,
        );
        const cacheKey = upstreamUrl.searchParams.get('no');
        if (!cacheKey || !/^[a-zA-Z0-9_-]+$/.test(cacheKey)) return src;

        return `/api/img/${cacheKey}.gif?u=${encodeURIComponent(upstreamValue)}`;
    } catch {
        return src;
    }
}

export default function Image({ src, alt, wrapperClassName = '', width, height }) {
    const [loadedSrc, setLoadedSrc] = useState(null);
    const loaded = loadedSrc === src;
    const imgRef = useRef(null);
    const imageSrc = getCacheableImageSrc(src);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        function handleLoad() {
            setLoadedSrc(src);
        }

        function handleError() {
            setLoadedSrc(src);
        }

        if (img.complete) {
            handleLoad();
        }

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        return () => {
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
        };
    }, [src]);

    return (
        <div
            className={`dccon-wrapper ${wrapperClassName}`}
            style={{
                width,
                height,
            }}
        >
            <div className="dccon-bg" style={{ opacity: loaded ? 0 : 1 }} />
            <NextImage
                ref={imgRef}
                src={imageSrc}
                alt={alt}
                className="dccon-real"
                style={{ opacity: loaded ? 1 : 0 }}
                width={width}
                height={height}
                unoptimized
            />
        </div>
    );
}
