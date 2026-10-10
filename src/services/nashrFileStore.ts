/**
 * NashrFileStore - IndexedDB File Storage for UNIGATES Nashr Platform.
 * Stores large file data (PDFs, Word docs, Images) safely in browser IndexedDB
 * bypassing the 5MB localStorage limit. Can store hundreds of megabytes without quota issues.
 */

const DB_NAME = "unigates_nashr_storage";
const DB_VERSION = 1;
const STORE_NAME = "files";

// In-memory cache for ultra-fast synchronous lookups
const memoryCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class NashrFileStore {
  /**
   * Save a single file to IndexedDB and memory cache
   */
  static async saveFile(id: string, dataUrl: string): Promise<void> {
    if (!id || !dataUrl) return;
    memoryCache.set(id, dataUrl);

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({ id, dataUrl, updatedAt: Date.now() });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn("[NashrFileStore] IndexedDB saveFile fallback to memory only:", e);
    }
  }

  /**
   * Batch save multiple files
   */
  static async saveFiles(items: { id: string; url: string }[]): Promise<void> {
    if (!items || items.length === 0) return;
    items.forEach((it) => {
      if (it.id && it.url) memoryCache.set(it.id, it.url);
    });

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        for (const item of items) {
          if (item.id && item.url) {
            store.put({ id: item.id, dataUrl: item.url, updatedAt: Date.now() });
          }
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn("[NashrFileStore] IndexedDB saveFiles fallback to memory only:", e);
    }
  }

  /**
   * Retrieve a file by ID (from memory cache or IndexedDB)
   */
  static async getFile(id: string): Promise<string | null> {
    if (!id) return null;
    if (memoryCache.has(id)) {
      return memoryCache.get(id) || null;
    }

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          if (req.result?.dataUrl) {
            memoryCache.set(id, req.result.dataUrl);
            resolve(req.result.dataUrl);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("[NashrFileStore] IndexedDB getFile error:", e);
      return null;
    }
  }

  /**
   * Synchronously get from memory cache if already loaded
   */
  static getFileSync(id: string): string | null {
    return memoryCache.get(id) || null;
  }

  /**
   * Delete a file by ID
   */
  static async deleteFile(id: string): Promise<void> {
    if (!id) return;
    memoryCache.delete(id);

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn("[NashrFileStore] IndexedDB deleteFile error:", e);
    }
  }
}
