import { CACHE_STORE_NAME, CACHE_MAX_KEYS, clearGisTileCache, getTileCacheDbName } from './MapConstants';
import { logger } from '@/lib/utils/logger';

export class TileCacheDB {
    private get dbName(): string {
        return getTileCacheDbName();
    }
    private storeName = CACHE_STORE_NAME;
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    init(): Promise<void> {
        if (this.initPromise) return this.initPromise;
        this.initPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }
            try {
                const request = window.indexedDB.open(this.dbName, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
                request.onsuccess = () => {
                    this.db = request.result;
                    this.db.onclose = () => {
                        this.closeDb();
                    };
                    this.db.onversionchange = () => {
                        this.closeDb();
                    };
                    resolve();
                };
                request.onerror = () => {
                    reject(request.error);
                };
            } catch (err) {
                reject(err);
            }
        });
        return this.initPromise;
    }

    private closeDb() {
        if (this.db) {
            try {
                this.db.close();
            } catch { }
            this.db = null;
        }
        this.initPromise = null;
    }

    async get(key: string): Promise<unknown> {
        try {
            await this.init();
            if (!this.db) return null;
            return await new Promise((resolve, reject) => {
                try {
                    const transaction = this.db!.transaction(this.storeName, 'readonly');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result || null);
                    request.onerror = () => resolve(null);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (err: unknown) {
            logger.warn('[TileCacheDB] get error, retrying:', { error: err as Error });
            this.closeDb();
            try {
                await this.init();
                if (!this.db) return null;
                return await new Promise((resolve) => {
                    try {
                        const transaction = this.db!.transaction(this.storeName, 'readonly');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.get(key);
                        request.onsuccess = () => resolve(request.result || null);
                        request.onerror = () => resolve(null);
                    } catch {
                        resolve(null);
                    }
                });
            } catch {
                return null;
            }
        }
    }

    async set(key: string, value: unknown): Promise<void> {
        try {
            await this.init();
            if (!this.db) return;

            const count = await this.countKeys();
            if (count > CACHE_MAX_KEYS) {
                await this.clear();
            }

            return await new Promise((resolve, reject) => {
                try {
                    const transaction = this.db!.transaction(this.storeName, 'readwrite');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.put(value, key);
                    request.onsuccess = () => resolve();
                    request.onerror = () => resolve();
                } catch (e) {
                    reject(e);
                }
            });
        } catch (err: unknown) {
            logger.warn('[TileCacheDB] set error, retrying:', { error: err as Error });
            this.closeDb();
            try {
                await this.init();
                if (!this.db) return;
                return await new Promise((resolve) => {
                    try {
                        const transaction = this.db!.transaction(this.storeName, 'readwrite');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.put(value, key);
                        request.onsuccess = () => resolve();
                        request.onerror = () => resolve();
                    } catch {
                        resolve();
                    }
                });
            } catch {
                // Ignore
            }
        }
    }

    private countKeys(): Promise<number> {
        return new Promise((resolve) => {
            if (!this.db) return resolve(0);
            try {
                const transaction = this.db.transaction(this.storeName, 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.count();
                request.onsuccess = () => resolve(request.result || 0);
                request.onerror = () => resolve(0);
            } catch (err) {
                logger.warn('[TileCacheDB] countKeys error:', { error: err as Error });
                resolve(0);
            }
        });
    }

    async clear(): Promise<void> {
        try {
            await this.init();
            if (!this.db) return;
            return await new Promise((resolve, reject) => {
                try {
                    const transaction = this.db!.transaction(this.storeName, 'readwrite');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => resolve();
                } catch (e) {
                    reject(e);
                }
            });
        } catch (err: unknown) {
            logger.warn('[TileCacheDB] clear error, retrying:', { error: err as Error });
            this.closeDb();
            try {
                await this.init();
                if (!this.db) return;
                return await new Promise((resolve) => {
                    try {
                        const transaction = this.db!.transaction(this.storeName, 'readwrite');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.clear();
                        request.onsuccess = () => resolve();
                        request.onerror = () => resolve();
                    } catch {
                        resolve();
                    }
                });
            } catch {
                // Ignore
            }
        }
    }
}

export const globalGisTileCache = new TileCacheDB();
export { clearGisTileCache };
