/**
 * Leaflet Patches
 * Standard: Stability patches to prevent crashes in React/Next.js environments.
 */

import L from 'leaflet';
import type { PatchedFunction, CanvasInternalProto, MapInternal } from '@/types/asset-gis.types';

export type { PatchedFunction, CanvasInternalProto, MapInternal };

export const applyLeafletPatches = () => {
    if (typeof window === 'undefined') return;

    // GLOBAL PATCH: Guard ALL Canvas renderer methods against destroyed context.
    if (L.Canvas && L.Canvas.prototype) {
        const proto = L.Canvas.prototype as unknown as CanvasInternalProto;
        ['_clear', '_draw', '_redraw', '_update', '_updateStyle', '_fillStroke'].forEach(method => {
            const orig = proto[method] as PatchedFunction | undefined;
            if (typeof orig === 'function' && !orig.__patched) {
                const patched: PatchedFunction = function (this: CanvasInternalProto, ...args: unknown[]) {
                    if (!this._ctx) return;
                    return orig.apply(this, args);
                };
                patched.__patched = true;
                proto[method] = patched;
            }
        });
    }

    // RADICAL STABILITY PATCH: Guard Map against "offsetWidth of null" and detached containers.
    if (L.Map && L.Map.prototype) {
        const MapProto = L.Map.prototype as unknown as Record<string, unknown>;

        // Patch invalidateSize to fail silently if container is gone
        const origInvalidateSize = MapProto.invalidateSize as PatchedFunction | undefined;
        if (origInvalidateSize && !origInvalidateSize.__patched) {
            const patchedInvalidateSize: PatchedFunction = function (this: MapInternal, ...args: unknown[]) {
                if (!this._container) return this;
                try {
                    return origInvalidateSize.apply(this, args);
                } catch (_e) {
                    return this;
                }
            };
            patchedInvalidateSize.__patched = true;
            MapProto.invalidateSize = patchedInvalidateSize;
        }

        // Patch getSize to return 0,0 instead of crashing on offsetWidth
        const origGetSize = MapProto.getSize as PatchedFunction | undefined;
        if (origGetSize && !origGetSize.__patched) {
            const patchedGetSize: PatchedFunction = function (this: MapInternal, ...args: unknown[]) {
                if (!this._container) return new L.Point(0, 0);
                try {
                    return origGetSize.apply(this, args);
                } catch (_e) {
                    return new L.Point(0, 0);
                }
            };
            patchedGetSize.__patched = true;
            MapProto.getSize = patchedGetSize;
        }
    }

    // DOM STABILITY PATCH: Guard L.DomUtil.remove against "removeChild of null"
    // This prevents the crash when React and Leaflet clash during unmounting.
    if (L.DomUtil) {
        const patchedRemove: ((el: HTMLElement | null) => void) & { __patched?: boolean } = function (el: HTMLElement | null) {
            if (!el) return;
            try {
                const parent = el.parentNode;
                if (parent && typeof parent.removeChild === 'function') {
                    parent.removeChild(el);
                }
            } catch (_e) {
                // Silently swallow removeChild errors during unmounting race conditions
            }
        };
        patchedRemove.__patched = true;
        L.DomUtil.remove = patchedRemove;
    }

    // EXTRA PATCH: Guard Canvas Renderer _updateStyle which often crashes during unmount
    if (L.Canvas && L.Canvas.prototype) {
        const proto = L.Canvas.prototype as unknown as CanvasInternalProto;
        const origUpdateStyle = proto._updateStyle;
        if (origUpdateStyle && !origUpdateStyle.__patched) {
            const patchedUpdateStyle: PatchedFunction = function (this: CanvasInternalProto, layer: unknown) {
                const layerObj = layer as { _map?: unknown };
                if (!this._ctx || !layer || !layerObj._map) return;
                try {
                    return origUpdateStyle.call(this, layer);
                } catch (_e) {
                    return;
                }
            };
            patchedUpdateStyle.__patched = true;
            proto._updateStyle = patchedUpdateStyle;
        }
    }
};

