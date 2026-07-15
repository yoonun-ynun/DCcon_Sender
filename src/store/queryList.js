import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeList } from './storeList';

async function fetchAll(getRegisteredList) {
    let temp;
    if (getRegisteredList) {
        temp = await getRegisteredList();
    } else {
        const res = await fetch('/api/controller', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed to fetch list');
        temp = await res.json();
    }

    if (!temp || !Array.isArray(temp.list)) {
        throw new Error('invalid registered DCcon list');
    }

    const currentData = storeList.getState().data;
    const list = temp.list
        .map((item) =>
            typeof item === 'string'
                ? { idx: item, img: '' }
                : { idx: String(item.idx), img: item.img ?? '' },
        )
        .filter((item) => item.idx);
    return list.map((item) => ({
        idx: item.idx,
        name: currentData[item.idx]?.name ?? '',
        url: item.img || currentData[item.idx]?.url || '',
    }));
}

export function useDcconSync({ getRegisteredList, cacheKey } = {}) {
    const { status } = useSession();
    const isLoggedIn = status === 'authenticated';
    const canSync = isLoggedIn || Boolean(getRegisteredList);
    const replaceAll = storeList((state) => state.replaceAll);
    const update = storeList((state) => state.update);

    const query = useQuery({
        queryKey: ['dccon-query', cacheKey ?? 'session'],
        queryFn: () => fetchAll(getRegisteredList),
        enabled: canSync,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchInterval: canSync ? 120000 : false,
    });

    useEffect(() => {
        if (query.data) {
            replaceAll(query.data);
        }
    }, [query.data, replaceAll]);

    useEffect(() => {
        const missingInfo = (query.data ?? []).filter((item) => !item.name || !item.url);
        if (missingInfo.length === 0) return;

        let alive = true;

        async function enrichMissingInfo() {
            await Promise.all(
                missingInfo.map(async (item) => {
                    try {
                        const res = await fetch('/api/info', {
                            method: 'POST',
                            body: JSON.stringify({ idx: item.idx }),
                            headers: { 'Content-Type': 'application/json' },
                        });
                        if (!res.ok) throw new Error('failed to fetch DCcon info');

                        const info = await res.json();
                        if (alive) {
                            storeList
                                .getState()
                                .update(
                                    item.idx,
                                    item.name || info.title,
                                    item.url || info.main_img,
                                );
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }),
            );
        }

        enrichMissingInfo();

        return () => {
            alive = false;
        };
    }, [query.data]);

    useEffect(() => {
        function syncPersistedList(event) {
            if (event.key === 'dccon-store-list' || event.key === null) {
                void storeList.persist.rehydrate();
            }
        }

        window.addEventListener('storage', syncPersistedList);
        return () => window.removeEventListener('storage', syncPersistedList);
    }, []);

    return {
        ...query,
        List: storeList((s) => s.List),
        data: storeList((s) => s.data),
        add: storeList((s) => s.add),
        remove: storeList((s) => s.remove),
        update,
        reset: storeList((s) => s.reset),
    };
}
