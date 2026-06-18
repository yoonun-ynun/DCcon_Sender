import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const storeList = create(
    persist(
        (set, get) => ({
            List: [],
            data: {},
            add: (idx, name, url) => {
                const { List } = get();
                if (List.includes(idx)) return;
                set((state) => {
                    return {
                        List: [...state.List, idx],
                        data: { ...state.data, [idx]: { name: name, url: url } },
                    };
                });
                fetchAdd(idx);
            },
            remove: (idx) =>
                set((state) => {
                    const new_List = state.List.filter((item) => item !== idx);
                    const new_data = { ...state.data };
                    delete new_data[idx];
                    return {
                        List: new_List,
                        data: new_data,
                    };
                }),
            has: (idx) => {
                const { List } = get();
                return List.includes(idx);
            },
            replaceAll: (lists) => {
                set(() => ({
                    List: lists.map((i) => i.idx),
                    data: Object.fromEntries(
                        lists.map((i) => [i.idx, { name: i.name, url: i.url }]),
                    ),
                }));
            },
            reset: () => set(() => ({ List: [], data: {} })),
        }),
        {
            name: 'dccon-store-list',
        },
    ),
);

export const storeChannel = create((set, get) => ({
    guild: { id: '', name: '' },
    channel: { id: '', name: '' },
    /**
     * @param {{id:string, name: string}} guild
     * @param {{id: string, name: string}} channel
     */
    set: (guild, channel) => {
        set(() => {
            return {
                guild: guild,
                channel: channel,
            };
        });
    },
    /**
     *
     * @returns {{guild: {id: string, name: string}, channel: {id: string, name: string}}}
     */
    get: () => {
        const { guild, channel } = get();
        return { guild, channel };
    },
}));

function fetchAdd(idx) {
    fetch('/api/controller', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idx: idx }),
    })
        .then((res) => {
            if (res.status === 404 || res.status === 405) {
                alert('Http Error');
                throw new Error('Http Error');
            }
            return res.json();
        })
        .then((res) => {
            if (!res.success) {
                alert(res.message);
                throw new Error('Server Error');
            }
        })
        .catch((err) => {
            console.error(err);
            storeList.getState().remove(idx);
        });
}
