/**
 * Browser persistence adapter for the ProjectDesk repository.
 *
 * The public API is deliberately async even though localStorage is synchronous.
 * That keeps the repository independent of the storage mechanism, so this file
 * can later be replaced by an IndexedDB adapter or a backend/API client without
 * changing the views or the repository's public functions.
 *
 * The saved payload is versioned so incompatible data can be discarded safely.
 */

const STORAGE_KEY = 'projectdesk.state.v1';
const STORAGE_VERSION = 1;

const memoryStore = new Map();
let fallbackReason = null;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidState(data) {
  if (!isRecord(data)) return false;
  if (
    !Array.isArray(data.projects) ||
    !data.projects.every(
      (project) => isRecord(project) && typeof project.id === 'string' && typeof project.name === 'string'
    )
  ) {
    return false;
  }
  if (
    !Array.isArray(data.tasks) ||
    !data.tasks.every(
      (task) =>
        isRecord(task) &&
        typeof task.id === 'string' &&
        typeof task.projectId === 'string' &&
        typeof task.title === 'string'
    )
  ) {
    return false;
  }
  if (
    !Array.isArray(data.activity) ||
    !data.activity.every((record) => isRecord(record) && typeof record.id === 'string')
  ) {
    return false;
  }
  return isRecord(data.settings);
}

function resolveStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readRaw() {
  const storage = resolveStorage();
  if (!storage || fallbackReason) return memoryStore.get(STORAGE_KEY) ?? null;

  try {
    return storage.getItem(STORAGE_KEY);
  } catch (error) {
    fallbackReason = String(error?.message || error);
    return memoryStore.get(STORAGE_KEY) ?? null;
  }
}

/**
 * Load the saved state, or null when there is nothing valid to restore.
 * Corrupt, incompatible, or tampered data is treated as missing so the
 * repository can fall back to a fresh seed.
 */
export async function loadState() {
  const raw = readRaw();
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);
    if (!isRecord(payload) || payload.version !== STORAGE_VERSION) return null;
    return isValidState(payload.data) ? payload.data : null;
  } catch {
    return null;
  }
}

/**
 * Save a snapshot of the repository state.
 * Falls back to a page-session store when browser storage is unavailable, so
 * the app keeps working (without persistence) instead of failing writes.
 */
export async function saveState(state) {
  const payload = JSON.stringify({
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    data: state
  });

  memoryStore.set(STORAGE_KEY, payload);
  const storage = resolveStorage();

  if (!storage) {
    fallbackReason = fallbackReason || 'Browser storage is unavailable.';
    return { ok: true, persistent: false, reason: fallbackReason };
  }

  try {
    storage.setItem(STORAGE_KEY, payload);
    fallbackReason = null;
    return { ok: true, persistent: true };
  } catch (error) {
    fallbackReason = String(error?.message || error);
    return { ok: false, persistent: false, reason: fallbackReason };
  }
}

/**
 * Remove the saved snapshot. Used by Reset demo data.
 */
export async function clearState() {
  memoryStore.delete(STORAGE_KEY);
  const storage = resolveStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
    fallbackReason = null;
  } catch (error) {
    fallbackReason = String(error?.message || error);
  }
}

/**
 * Report whether writes are reaching persistent browser storage.
 */
export function getStorageStatus() {
  const storage = resolveStorage();
  return {
    persistent: Boolean(storage) && !fallbackReason,
    reason: fallbackReason
  };
}
