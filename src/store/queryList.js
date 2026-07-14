import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeList } from './storeList';

async function fetchAll() {
    const res = await fetch('/api/controller');
    if (!res.ok) throw new Error('failed to fetch list');
    const temp = await res.json();
    const list = (temp.list ?? [])
        .map((item) =>
            typeof item === 'string'
                ? { idx: item, img: '' }
                : { idx: String(item.idx), img: item.img ?? '' },
        )
        .filter((item) => item.idx);
    const infos = await Promise.all(
        list.map(async (item) => {
            const res = await fetch('/api/info', {
                method: 'POST',
                body: JSON.stringify({ idx: item.idx }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('failed to fetch list');
            return { info: await res.json(), item };
        }),
    );
    return infos.map(({ info, item }) => ({
        idx: info.idx,
        name: info.title,
        url: item.img || info.main_img,
    }));
}

export function useDcconSync() {
    const { status } = useSession();
    const isLoggedIn = status === 'authenticated';
    const replaceAll = storeList((state) => state.replaceAll);

    const query = useQuery({
        queryKey: ['dccon-query'],
        queryFn: fetchAll,
        enabled: isLoggedIn,
        refetchInterval: isLoggedIn ? 120000 : false,
    });

    useEffect(() => {
        if (query.data) {
            replaceAll(query.data);
        }
    }, [query.data, replaceAll]);

    return {
        ...query,
        List: storeList((s) => s.List),
        data: storeList((s) => s.data),
        add: storeList((s) => s.add),
        remove: storeList((s) => s.remove),
        reset: storeList((s) => s.reset),
    };
}
