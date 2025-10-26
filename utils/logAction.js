const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export async function logAction(actionData) {
    try {
        const getResponse = await fetch(BASE_URL, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const bin = await getResponse.json();
        const logs = Array.isArray(bin.record) ? bin.record : [];

        const userLogs = logs.filter(entry => entry.user === actionData.user);
        const nextId = userLogs.length + 1;
        const punishmentId = `#${nextId}`;

        logs.push({
            ...actionData,
            id: punishmentId,
            timestamp: new Date().toISOString()
        });

        await fetch(BASE_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(logs)
        });
    } catch (error) {
        console.error('Failed to save moderation log:', error);
    }
}
