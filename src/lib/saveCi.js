// lib/serverStore.ts
const globalForStore = globalThis;

/**
 * @type {Map<string, any>}
 */
const serverStore = globalForStore.myServerCache ?? new Map();

if (process.env.NODE_ENV !== 'production') {
    globalForStore.myServerCache = serverStore;
}

export function get_ci() {
    /**
     * @type {{value: string; expiresAt: Date; maxAge: number}}
     */
    const ci_info = serverStore.get('ci');
    if (!ci_info) {
        console.log('no_ci');
        return null;
    }
    const now = new Date();
    if (now > ci_info.expiresAt) {
        return null;
    }
    return ci_info.value;
}

/**
 * @param value {string}
 * @param expiresAt {Date}
 * @param maxAge {number}
 */
export function set_ci(value, expiresAt, maxAge) {
    serverStore.set('ci', { value, expiresAt, maxAge });
}

// 동시에 여러 요청이 들어올 때 쿠키를 1번만 발급받도록 Promise 공유
export async function ensure_ci(fetcher) {
    const existing = get_ci();
    if (existing) return existing;

    let pending = serverStore.get('ci_pending');
    if (!pending) {
        pending = fetcher().finally(() => {
            serverStore.delete('ci_pending');
        });
        serverStore.set('ci_pending', pending);
    }
    return pending;
}
