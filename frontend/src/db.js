import { openDB } from 'idb';

const DB_NAME = 'zero_knowledge_chat';
const STORE_KEYS = 'security_keys';
const STORE_MESSAGES = 'chat_messages';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS);
      }
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        db.createObjectStore(STORE_MESSAGES, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function saveIdentity(userId, keyPair) {
  const db = await initDB();
  await db.put(STORE_KEYS, { userId, keyPair }, 'identity');
}

export async function getIdentity() {
  const db = await initDB();
  return await db.get(STORE_KEYS, 'identity');
}

export async function saveMessage(targetId, message) {
  const db = await initDB();
  await db.add(STORE_MESSAGES, {
    targetId,
    ...message,
    timestamp: message.timestamp || Date.now(),
    isRead: message.sender === 'me' ? true : (message.isRead || false)
  });
}

export async function markAsRead(myId, targetId) {
  const db = await initDB();
  const tx = db.transaction(STORE_MESSAGES, 'readwrite');
  const store = tx.objectStore(STORE_MESSAGES);
  const all = await store.getAll();
  
  for (const m of all) {
    if (m.sender === targetId && m.targetId === myId && !m.isRead) {
      m.isRead = true;
      await store.put(m);
    }
  }
  await tx.done;
}

export async function getMessages(targetId) {
  const db = await initDB();
  const allMessages = await db.getAll(STORE_MESSAGES);
  return allMessages.filter(m => m.targetId === targetId || (m.sender === targetId && m.targetId === 'me'));
}

// Adjusting message get to be more robust
export async function getChatHistory(myId, targetId) {
    const db = await initDB();
    const all = await db.getAll(STORE_MESSAGES);
    return all.filter(m => 
        (m.sender === myId && m.targetId === targetId) || 
        (m.sender === targetId && m.targetId === myId)
    ).sort((a, b) => a.timestamp - b.timestamp);
}
