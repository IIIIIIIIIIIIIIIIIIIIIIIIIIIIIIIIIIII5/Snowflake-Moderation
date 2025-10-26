const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export async function logAction(actionData) {
    try {
        const getResponse = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
        const bin = await getResponse.json();
        const logs = Array.isArray(bin.record) ? bin.record : [];

        const userLogs = logs.filter(entry => entry.user === actionData.user);
        const nextId = userLogs.length + 1;
        const punishmentId = `#${nextId}`;

        const dateOnly = new Date().toISOString().split('T')[0];

        logs.push({
            ...actionData,
            id: punishmentId,
            timestamp: dateOnly
        });

        await fetch(BASE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(logs)
        });

        return punishmentId;
    } catch (error) {
        console.error('Failed to save moderation log:', error);
    }
}

export async function updateReason(userId, punishmentId, newReason) {
    const getResponse = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
    const bin = await getResponse.json();
    const logs = Array.isArray(bin.record) ? bin.record : [];

    const dateOnly = new Date().toISOString().split('T')[0];

    const updatedLogs = logs.map(log =>
        log.user === userId && log.id === punishmentId
            ? { ...log, reason: newReason, editedAt: dateOnly }
            : log
    );

    await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
        body: JSON.stringify(updatedLogs)
    });
}

export async function revokePunishment(userId, punishmentId) {
    const getResponse = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
    const bin = await getResponse.json();
    const logs = Array.isArray(bin.record) ? bin.record : [];

    const updatedLogs = logs.filter(log => !(log.user === userId && log.id === punishmentId));

    await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
        body: JSON.stringify(updatedLogs)
    });
}
