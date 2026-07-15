// UTC midnight after this shift is 04:00 in Korea (UTC+9).
const KST_BOUNDARY_SHIFT_MS = 5 * 60 * 60 * 1000;

function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getDcconTopPeriodKey(type, now = new Date()) {
    const shifted = new Date(now.getTime() + KST_BOUNDARY_SHIFT_MS);
    const year = shifted.getUTCFullYear();
    const month = shifted.getUTCMonth();
    const day = shifted.getUTCDate();

    if (type === 'day') {
        return formatDate(year, month + 1, day);
    }

    if (type === 'month') {
        return `${year}-${String(month + 1).padStart(2, '0')}`;
    }

    if (type === 'week') {
        const sunday = new Date(Date.UTC(year, month, day - shifted.getUTCDay()));
        return formatDate(sunday.getUTCFullYear(), sunday.getUTCMonth() + 1, sunday.getUTCDate());
    }

    throw new Error(`Unsupported DCcon top period: ${type}`);
}
