import {
    getAllRecent1000RecommendTexts,
    getAutoGuild,
    getGuildList,
    saveRecommendTexts,
} from '../../DataBase/query.js';

export const acceptedGuild: Set<string> = new Set<string>();
const autoGuild: Set<string> = new Set<string>();

export interface RecommendText {
    text: string;
    image?: string;
    channel_id: string;
    user_id: string;
    user_name: string;
    message_id: string;
    message_id_history: string[];
    guild_id: string;
    expire_at: number;
    count: number;
    decount: number;
}

const recommendQueue: Map<string, RecommendText> = new Map<string, RecommendText>();
const historyMap: Map<string, string> = new Map<string, string>();

async function updateSet() {
    try {
        const result = await getGuildList();
        const auto = await getAutoGuild();
        acceptedGuild.forEach((guild) => {
            if (!result.includes(guild)) acceptedGuild.delete(guild);
        });
        autoGuild.forEach((guild) => {
            if (!auto.includes(guild)) autoGuild.delete(guild);
        });
        result.forEach((guild) => acceptedGuild.add(guild));
        auto.forEach((guild) => autoGuild.add(guild));
    } catch (err) {
        console.error('Failed to update guild sets:', err);
    } finally {
        setTimeout(updateSet, 5000);
    }
}
setTimeout(updateSet, 5000);

function updateQueue() {
    recommendQueue.forEach((value, key) => {
        if (value.expire_at <= Date.now()) {
            recommendQueue.delete(key);
            value.message_id_history.forEach((message) => {
                historyMap.delete(message);
            });
        }
    });
    setTimeout(updateQueue, 10000);
}

setTimeout(updateQueue, 10000);

let syncing = false;
let dbLoaded = false;
export async function getDB() {
    if (dbLoaded) return;
    try {
        const recent = await getAllRecent1000RecommendTexts();
        recent.forEach((value) => {
            recommendQueue.set(value.message_id, value);
            value.message_id_history.forEach((history) => {
                historyMap.set(history, value.message_id);
            });
        });
        dbLoaded = true;
        startSyncDB();
    } catch (err) {
        console.error('Error occurred: ', err);
        setTimeout(getDB, 1000);
    }
}
setTimeout(getDB, 1000);

function startSyncDB() {
    if (syncing) return;
    syncing = true;
    void syncDB();
}

async function syncDB() {
    try {
        const recent = [...recommendQueue.values()].slice(-1000);

        await saveRecommendTexts(recent);
    } catch (err) {
        console.error('Failed to sync recommend queue:', err);
    } finally {
        setTimeout(syncDB, 1000);
    }
}

export function appendRecommendQueue(object: RecommendText) {
    recommendQueue.set(object.message_id, object);
    object.message_id_history.forEach((message) => {
        historyMap.set(message, object.message_id);
    });
}

export function getMessageIdFromHistory(message_id: string) {
    return historyMap.get(message_id);
}

export function getRecommendQueue(message_id: string) {
    return recommendQueue.get(message_id);
}

export function removeRecommendQueue(message_id: string) {
    const message_history = recommendQueue.get(message_id)?.message_id_history;
    recommendQueue.delete(message_id);
    if (message_history === undefined) return;
    message_history.forEach((message) => {
        historyMap.delete(message);
    });
}

export function getAuto(guild_id: string) {
    return autoGuild.has(guild_id);
}
