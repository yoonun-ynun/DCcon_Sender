'use client';
import { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import { getCacheableImageSrc } from '@/lib/dcconImageUrl.js';
import './iframe.css';

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
            <div className="dccon-bg" style={{ opacity: loaded ? 1 : 0 }}>
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
        </div>
    );
}
