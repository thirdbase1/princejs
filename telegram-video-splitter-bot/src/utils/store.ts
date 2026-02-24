// Simple in-memory store with TTL
// Map<key, { value, expiresAt }>

const store = new Map<string, { value: any; expiresAt: number }>();
const TTL = 3600 * 1000; // 1 hour

export const set = (key: string, value: any) => {
  store.set(key, { value, expiresAt: Date.now() + TTL });
  // Cleanup occasionally?
  // For simplicity, just let it grow until memory limit or clear periodically.
  // With 200 users, it's small.
  if (store.size > 1000) cleanup();
};

export const get = (key: string) => {
  const item = store.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    store.delete(key);
    return null;
  }
  return item.value;
};

const cleanup = () => {
  const now = Date.now();
  for (const [key, item] of store.entries()) {
    if (now > item.expiresAt) store.delete(key);
  }
};
