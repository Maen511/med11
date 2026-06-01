const DB_NAME = 'med-product-images';
const DB_VERSION = 1;
const STORE = 'images';

type StoredImage = { id: number; dataUrl: string; updatedAt: number };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error ?? new Error('idb_open_failed'));
      };
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
    });
  }
  return dbPromise;
}

export async function putProductImageDataUrl(productId: number, dataUrl: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('idb_write_failed'));
    tx.objectStore(STORE).put({ id: productId, dataUrl, updatedAt: Date.now() } satisfies StoredImage);
  });
}

export async function getProductImageDataUrl(productId: number): Promise<string | null> {
  const map = await getProductImageDataUrlBatch([productId]);
  return map.get(productId) ?? null;
}

/** Single transaction for many product images (catalog hydrate). */
export async function getProductImageDataUrlBatch(productIds: number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  const unique = [...new Set(productIds)];
  if (unique.length === 0) return out;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('idb_read_failed'));
    for (const id of unique) {
      const req = store.get(id);
      req.onsuccess = () => {
        const row = req.result as StoredImage | undefined;
        if (row?.dataUrl) out.set(id, row.dataUrl);
      };
    }
  });
  return out;
}

export async function deleteProductImageDataUrl(productId: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('idb_delete_failed'));
    tx.objectStore(STORE).delete(productId);
  });
}
