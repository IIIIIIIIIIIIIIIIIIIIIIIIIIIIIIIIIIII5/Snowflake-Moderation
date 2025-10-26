const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

function formatTimestamp(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export async function logAction(actionData) {
  try {
    const getResponse = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
    const bin = await getResponse.json();
    const logs = Array.isArray(bin.record) ? bin.record : [];

    const userLogs = logs.filter(entry => entry.user === actionData.user);
    const nextId = userLogs.length + 1;
    const punishmentId = `#${nextId}`;

    logs.push({
      ...actionData,
      id: punishmentId,
      timestamp: formatTimestamp(new Date())
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

  const updatedLogs = logs.map(log =>
    log.user === userId && log.id === punishmentId
      ? { ...log, reason: newReason, editedAt: formatTimestamp(new Date()) }
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
