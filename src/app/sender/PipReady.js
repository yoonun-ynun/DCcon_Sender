'use client';

import { useEffect } from 'react';

export default function PipReady() {
    useEffect(() => {
        if (window.parent === window) return;

        window.parent.postMessage({ type: 'dccon-sender-ready' }, window.location.origin);
    }, []);

    return null;
}
