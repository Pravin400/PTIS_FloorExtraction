import { getNetworkConcurrency, TILE_RENDER_FRAME_BUDGET_MS } from './MapConstants';
import { logger } from '@/lib/utils/logger';

export class TileRenderQueue {
    private tasks: (() => void)[] = [];
    private running = false;

    add(task: () => void) {
        this.tasks.push(task);
        this.schedule();
    }

    private schedule() {
        if (this.running || this.tasks.length === 0) return;
        this.running = true;

        requestAnimationFrame(() => {
            const start = performance.now();
            const FRAME_BUDGET_MS = TILE_RENDER_FRAME_BUDGET_MS;

            while (this.tasks.length > 0 && (performance.now() - start) < FRAME_BUDGET_MS) {
                const task = this.tasks.shift();
                if (task) {
                    try {
                        task();
                    } catch (err) {
                        logger.error('[TileRenderQueue] Task failed:', { error: err as Error });
                    }
                }
            }

            this.running = false;
            if (this.tasks.length > 0) {
                this.schedule();
            }
        });
    }

    clear() {
        this.tasks = [];
    }
}

export const globalTileRenderQueue = new TileRenderQueue();

export class RequestQueue {
    private activeCount = 0;
    private maxConcurrency = getNetworkConcurrency();
    private queue: (() => void)[] = [];

    async run<T>(fn: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        if (this.activeCount >= this.maxConcurrency) {
            await new Promise<void>((resolve, reject) => {
                const onAbort = () => {
                    const index = this.queue.indexOf(resolve);
                    if (index !== -1) {
                        this.queue.splice(index, 1);
                    }
                    reject(new DOMException('Aborted', 'AbortError'));
                };
                if (signal) {
                    signal.addEventListener('abort', onAbort);
                }
                this.queue.push(() => {
                    if (signal) {
                        signal.removeEventListener('abort', onAbort);
                    }
                    resolve();
                });
            });
        }

        this.activeCount++;
        try {
            return await fn(signal);
        } finally {
            this.activeCount--;
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                if (next) next();
            }
        }
    }
}

export const globalGisRequestQueue = new RequestQueue();

export const getDeviceCapabilities = () => {
    if (typeof window === 'undefined') return { isLowEnd: false };
    const concurrency = navigator.hardwareConcurrency || 4;
    const navWithMemory = navigator as unknown as { deviceMemory?: number };
    const memory = navWithMemory.deviceMemory || 4;
    return {
        isLowEnd: concurrency <= 4 || memory <= 4
    };
};

/**
 * ARCHITECTURAL EXCEPTION: Low-level Vector Tile Network Fetcher
 */
export const fetchWithRetry = async (url: string, signal?: AbortSignal, retries = 2, delay = 500): Promise<unknown> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

        const onAbort = () => controller.abort();
        if (signal) {
            signal.addEventListener('abort', onAbort);
        }

        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/geo+json, application/json, */*'
                }
            });
            clearTimeout(timeoutId);
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }

            if (res.status === 204 || res.status === 404) return null;
            if (!res.ok) {
                if (attempt < retries && (res.status >= 500 || res.status === 429)) {
                    await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
                    continue;
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('mapbox-vector-tile') || contentType.includes('x-protobuf') || contentType.includes('octet-stream')) {
                return { type: 'FeatureCollection', features: [] };
            }

            const text = await res.text();
            if (!text || text.trim().length === 0) return null;

            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    return { type: 'FeatureCollection', features: parsed };
                }
                if (parsed && typeof parsed === 'object') {
                    if ('features' in parsed) return parsed;
                    if ('data' in parsed && Array.isArray((parsed as { data: unknown }).data)) {
                        return { type: 'FeatureCollection', features: (parsed as { data: unknown[] }).data };
                    }
                }
                return parsed;
            } catch {
                return { type: 'FeatureCollection', features: [] };
            }
        } catch (err: unknown) {
            clearTimeout(timeoutId);
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }

            const errorObj = err as Error;
            const isAbort = errorObj?.name === 'AbortError' || signal?.aborted;
            if (isAbort) {
                throw new DOMException('Aborted', 'AbortError');
            }

            if (attempt < retries) {
                logger.warn(`[GisTile fetch] Attempt ${attempt + 1} failed. Retrying...`, { error: err as Error });
                await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
                continue;
            }
            throw err;
        }
    }
};
