/**
 * Keeps the latest design's separate layers (garment photo + design only) for the mockup preview.
 *
 * They're several MB of PNGs, too big for sessionStorage, and the storefront reaches the mockup
 * page through a full page load, so they go to IndexedDB. Only the most recent set is kept.
 */
const DB_NAME = 'personalizer';
const STORE = 'mockup-layers';
const RECORD_KEY = 'latest';

function openDb() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB is unavailable.'));
            return;
        }

        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function run(mode, action) {
    return openDb().then((db) => new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
            db.close();
            resolve(request.result);
        };
        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    }));
}

/**
 * @param {string} key  Identifies the order these layers belong to (stored on the order details).
 * @param {Record<string, {base: Blob, design: Blob}>} views  Layers per view id ('front', 'back').
 */
export function saveMockupLayers(key, views) {
    return run('readwrite', (store) => store.put({ key, views, savedAt: Date.now() }, RECORD_KEY));
}

/** Layers for `key`, or null when they're missing or belong to a different (older) design. */
export async function loadMockupLayers(key) {
    if (!key) return null;
    const record = await run('readonly', (store) => store.get(RECORD_KEY));
    return record?.key === key ? record.views : null;
}
