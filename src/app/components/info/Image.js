'use client';
import { useEffect, useRef, useState } from 'react';
import './iframe.css';

export default function Image({ src, alt, wrapperClassName = '' }) {
    const [loadedSrc, setLoadedSrc] = useState(null);
    const loaded = loadedSrc === src;
    const imgRef = useRef(null);

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
        <div className={`dccon-wrapper ${wrapperClassName}`}>
            <div className="dccon-bg" style={{ opacity: loaded ? 0 : 1 }} />
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                className="dccon-real"
                style={{ opacity: loaded ? 1 : 0 }}
            />
        </div>
    );
}
