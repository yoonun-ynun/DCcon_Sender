'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function IframeOverlay({ url, onClose }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);

        function onKey(e) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 16,
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: 'min(100%, 1000px)',
                    height: 'min(85vh, 800px)',
                    border: '1px solid white',
                    background: '#fff',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,.35)',
                }}
            >
                <iframe
                    key={url} // URL 바뀔 때 완전 새로 로드
                    src={url}
                    title="iframe-overlay"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    sandbox="allow-scripts allow-same-origin allow-downloads allow-modals"
                    allow="fullscreen"
                    referrerPolicy="no-referrer"
                />
                <button
                    onClick={onClose}
                    aria-label="닫기"
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#fff',
                        color: 'rgba(0,0,0,.85)',
                        cursor: 'pointer',
                        fontSize: 18,
                        lineHeight: '36px',
                        textAlign: 'center',
                    }}
                >
                    ✕
                </button>
            </div>
        </div>,
        document.body, // ← Portal: 항상 body 최상단에 붙음
    );
}
