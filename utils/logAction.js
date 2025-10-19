const admin = require("firebase-admin");

const FIREBASE_CONFIG = JSON.parse(process.env.FIREBASE_CONFIG);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_CONFIG)
  });
}

const db = admin.firestore();
const LOGS_COLLECTION = "logs";

export async function logAction(actionData) {
    try {
        const snapshot = await db.collection(LOGS_COLLECTION).get();
        const logs = [];
        snapshot.forEach(doc => logs.push(doc.data()));

        const nextId = logs.length + 1;
        const punishmentId = `#${nextId.toString().padStart(4, '0')}`;

        logs.push({
            ...actionData,
            id: punishmentId,
            timestamp: new Date().toLocaleString('en-GB')
        });

        await db.collection(LOGS_COLLECTION).add({
            ...actionData,
            id: punishmentId,
            timestamp: new Date().toLocaleString('en-GB')
        });

        return punishmentId;
    } catch (error) {
        console.error('Failed to save moderation log:', error);
    }
}
