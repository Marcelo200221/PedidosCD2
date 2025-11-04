import { Capacitor, registerPlugin } from '@capacitor/core';
// Secure, native storage (Keychain/Keystore) for iOS/Android
// Native plugin name: SecureStorage (@capawesome/capacitor-secure-storage)
// Install when ready:
//   npm i @capawesome/capacitor-secure-storage
//   npx cap sync

// Avoid static import so Web build works even if plugin isn't installed yet.
type SecureStoragePlugin = {
  set(options: { key: string; value: string }): Promise<void>;
  get(options: { key: string }): Promise<{ value?: string }>;
  remove(options: { key: string }): Promise<void>;
};

const SecureStorage = registerPlugin<SecureStoragePlugin>('SecureStorage');

// ---------- Web fallback: IndexedDB (avoid localStorage) ----------
const DB_NAME = 'app_secure_store';
const STORE_NAME = 'kv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('indexedDB not available'));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB open error'));
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('idb set error'));
    tx.objectStore(STORE_NAME).put(value, key);
  });
  db.close();
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  const result = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    tx.onerror = () => reject(tx.error || new Error('idb get error'));
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error || new Error('idb get request error'));
  });
  db.close();
  return result;
}

async function idbRemove(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('idb remove error'));
    tx.objectStore(STORE_NAME).delete(key);
  });
  db.close();
}

// Last-resort in-memory store (non-persistent) if neither native nor IDB
const memoryStore = new Map<string, string>();

const isNative = () => Capacitor.isNativePlatform?.() === true;

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (isNative()) {
      await SecureStorage.set({ key, value });
      return;
    }
  } catch (_) {}
  // Fallback web: IndexedDB
  try { await idbSet(key, value); return; } catch (_) {}
  // In-memory last resort
  memoryStore.set(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  try {
    if (isNative()) {
      const { value } = await SecureStorage.get({ key });
      return value ?? null;
    }
  } catch (_) {}
  try { return await idbGet(key); } catch (_) {}
  return memoryStore.get(key) ?? null;
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (isNative()) {
      await SecureStorage.remove({ key });
      return;
    }
  } catch (_) {}
  try { await idbRemove(key); return; } catch (_) {}
  memoryStore.delete(key);
}

// Helpers específicos para token
const TOKEN_KEY = 'auth_token';
export const getToken = () => getItem(TOKEN_KEY);
export const setToken = (v: string) => setItem(TOKEN_KEY, v);
export const removeToken = () => removeItem(TOKEN_KEY);
