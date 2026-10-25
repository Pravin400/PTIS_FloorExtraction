import L from 'leaflet';
import type { RenderableGeometry, RingPointArray, RingPixelCache } from '@/types/asset-gis.types';

export type { RenderableGeometry, RingPointArray, RingPixelCache };

export const lngLatToPixel = (lng: number, lat: number, coords: L.Coords, tileSize: L.Point, map?: L.Map) => {
    if (map) {
        const point = map.project(L.latLng(lat, lng), coords.z);
        return {
            x: point.x - coords.x * tileSize.x,
            y: point.y - coords.y * tileSize.y,
        };
    }

    const scale = Math.pow(2, coords.z);
    const tileX = (lng + 180) / 360 * scale;
    const latRad = lat * Math.PI / 180;
    const tileY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale;

    return {
        x: (tileX - coords.x) * tileSize.x,
        y: (tileY - coords.y) * tileSize.y,
    };
};

export const containsPoint = (geom: RenderableGeometry, latlng: L.LatLng, coords: L.Coords, tileSize: L.Point, map?: L.Map) => {
    // Fast Bounding Box Check (Pre-calculated or on-the-fly)
    if (!geom._bbox) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const processRing = (ring: RingPointArray) => {
            for (const pt of ring) {
                if (pt[0] < minX) minX = pt[0]; if (pt[0] > maxX) maxX = pt[0];
                if (pt[1] < minY) minY = pt[1]; if (pt[1] > maxY) maxY = pt[1];
            }
        };
        if (geom.type === 'Polygon') {
            processRing((geom.coordinates as number[][][])[0]);
        } else if (geom.type === 'MultiPolygon') {
            (geom.coordinates as number[][][][]).forEach((p) => processRing(p[0]));
        }
        geom._bbox = [minX, minY, maxX, maxY];
    }

    const [minX, minY, maxX, maxY] = geom._bbox;
    if (latlng.lng < minX || latlng.lng > maxX || latlng.lat < minY || latlng.lat > maxY) return false;

    // Detailed Point-in-Polygon
    const px = lngLatToPixel(latlng.lng, latlng.lat, coords, tileSize, map);
    const cacheKey = `_px_${coords.z}_${coords.x}_${coords.y}`;
    const checkRing = (ring: RingPointArray) => {
        const ringWithCache = ring as unknown as RingPixelCache;
        if (!ringWithCache[cacheKey]) {
            ringWithCache[cacheKey] = ring.map(pt => lngLatToPixel(pt[0], pt[1], coords, tileSize, map));
        }
        const pts = ringWithCache[cacheKey];
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i], xj = pts[j];
            const intersect = ((xi.y > px.y) !== (xj.y > px.y))
                && (px.x < (xj.x - xi.x) * (px.y - xi.y) / (xj.y - xi.y) + xi.x);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    if (geom.type === 'Polygon') return checkRing((geom.coordinates as number[][][])[0]);
    if (geom.type === 'MultiPolygon') return (geom.coordinates as number[][][][]).some((poly) => checkRing(poly[0]));
    return false;
};

export const drawRing = (ctx: CanvasRenderingContext2D, ring: RingPointArray, coords: L.Coords, tileSize: L.Point, map?: L.Map) => {
    if (!ring || ring.length < 2) return;
    const cacheKey = `_px_${coords.z}_${coords.x}_${coords.y}`;
    const ringWithCache = ring as unknown as RingPixelCache;
    if (!ringWithCache[cacheKey]) {
        ringWithCache[cacheKey] = ring.map(pt => lngLatToPixel(pt[0], pt[1], coords, tileSize, map));
    }
    const pts = ringWithCache[cacheKey];
    let started = false;
    for (const px of pts) {
        if (!started) { ctx.moveTo(px.x, px.y); started = true; }
        else ctx.lineTo(px.x, px.y);
    }
    ctx.closePath();
};

export const drawRings = (ctx: CanvasRenderingContext2D, rings: RingPointArray[], coords: L.Coords, tileSize: L.Point, map?: L.Map) => {
    for (const ring of rings) drawRing(ctx, ring, coords, tileSize, map);
};

export const renderGeometry = (ctx: CanvasRenderingContext2D, geom: RenderableGeometry, coords: L.Coords, tileSize: L.Point, map?: L.Map) => {
    if (geom.type === 'Polygon') drawRings(ctx, geom.coordinates as number[][][], coords, tileSize, map);
    else if (geom.type === 'MultiPolygon') (geom.coordinates as number[][][][]).forEach((poly) => drawRings(ctx, poly, coords, tileSize, map));
};

export const renderDraftBox = (ctx: CanvasRenderingContext2D, geom: RenderableGeometry, coords: L.Coords, tileSize: L.Point, map?: L.Map) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const processRing = (ring: RingPointArray) => {
        for (const pt of ring) {
            if (pt[0] < minX) minX = pt[0]; if (pt[0] > maxX) maxX = pt[0];
            if (pt[1] < minY) minY = pt[1]; if (pt[1] > maxY) maxY = pt[1];
        }
    };
    if (geom.type === 'Polygon') processRing((geom.coordinates as number[][][])[0]);
    else if (geom.type === 'MultiPolygon') (geom.coordinates as number[][][][]).forEach((p) => processRing(p[0]));
    if (minX === Infinity) return;
    const p1 = lngLatToPixel(minX, minY, coords, tileSize, map);
    const p2 = lngLatToPixel(maxX, maxY, coords, tileSize, map);
    ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
};

