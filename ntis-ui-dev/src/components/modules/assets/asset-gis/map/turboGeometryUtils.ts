import L from 'leaflet';
import { MUNICIPAL_ASSET_TYPE_COLORS } from '@/hooks/asset-gis-map';
import type { GeoJsonGeometry, TurboFeature } from '@/types/asset-gis.types';

export function lngLatToPixel(lng: number, lat: number, coords: L.Coords, tileSize: L.Point) {
    const scale = Math.pow(2, coords.z);
    const tileX = (lng + 180) / 360 * scale;
    const latRad = lat * Math.PI / 180;
    const tileY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale;
    return {
        x: (tileX - coords.x) * tileSize.x,
        y: (tileY - coords.y) * tileSize.y,
    };
}

export function drawRing(ctx: CanvasRenderingContext2D, ring: number[][], coords: L.Coords, tileSize: L.Point, scale: number) {
    if (!ring || ring.length < 2) return;
    let started = false;

    const pi = Math.PI;
    const width = tileSize.x;
    const height = tileSize.y;
    const cx = coords.x;
    const cy = coords.y;

    for (let i = 0; i < ring.length; i++) {
        const pt = ring[i];
        const lng = pt[0];
        const lat = pt[1];

        const tileX = (lng + 180) / 360 * scale;
        const latRad = lat * pi / 180;
        const tileY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / pi) / 2 * scale;

        const px = (tileX - cx) * width;
        const py = (tileY - cy) * height;

        if (!started) {
            ctx.moveTo(px, py);
            started = true;
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
}

export function drawRings(ctx: CanvasRenderingContext2D, rings: number[][][], coords: L.Coords, tileSize: L.Point, scale: number) {
    for (const ring of rings) {
        drawRing(ctx, ring, coords, tileSize, scale);
    }
}

export function renderGeometry(ctx: CanvasRenderingContext2D, geom: GeoJsonGeometry, coords: L.Coords, tileSize: L.Point) {
    const scale = Math.pow(2, coords.z);
    if (geom.type === 'Polygon') {
        drawRings(ctx, geom.coordinates as number[][][], coords, tileSize, scale);
    } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates as number[][][][]) {
            drawRings(ctx, poly, coords, tileSize, scale);
        }
    }
}

export function containsPoint(geom: GeoJsonGeometry, latlng: L.LatLng, coords: L.Coords, tileSize: L.Point) {
    const px = lngLatToPixel(latlng.lng, latlng.lat, coords, tileSize);

    const checkRing = (ring: number[][]) => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = lngLatToPixel(ring[i][0], ring[i][1], coords, tileSize);
            const xj = lngLatToPixel(ring[j][0], ring[j][1], coords, tileSize);

            const intersect = ((xi.y > px.y) !== (xj.y > px.y))
                && (px.x < (xj.x - xi.x) * (px.y - xi.y) / (xj.y - xi.y) + xi.x);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    if (geom.type === 'Polygon') {
        return checkRing((geom.coordinates as number[][][])[0]);
    } else if (geom.type === 'MultiPolygon') {
        return (geom.coordinates as number[][][][]).some((poly) => checkRing(poly[0]));
    }
    return false;
}

export function getGeometryCentroid(geom: GeoJsonGeometry, coords: L.Coords, tileSize: L.Point) {
    let ring: number[][] | null = null;
    if (geom.type === 'Polygon' && (geom.coordinates as number[][][])?.[0]) {
        ring = (geom.coordinates as number[][][])[0];
    } else if (geom.type === 'MultiPolygon' && (geom.coordinates as number[][][][])?.[0]?.[0]) {
        ring = (geom.coordinates as number[][][][])[0][0];
    }
    if (!ring || ring.length === 0) return null;

    const ringPx: { x: number, y: number }[] = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    for (let i = 0; i < ring.length; i++) {
        const px = lngLatToPixel(ring[i][0], ring[i][1], coords, tileSize);
        ringPx.push(px);

        if (px.x < minX) minX = px.x;
        if (px.x > maxX) maxX = px.x;
        if (px.y < minY) minY = px.y;
        if (px.y > maxY) maxY = px.y;

        sumX += px.x;
        sumY += px.y;
    }

    const centroid = { x: sumX / ring.length, y: sumY / ring.length };

    const isPointInPoly = (p: { x: number, y: number }) => {
        let inside = false;
        for (let i = 0, j = ringPx.length - 1; i < ringPx.length; j = i++) {
            const xi = ringPx[i].x, yi = ringPx[i].y;
            const xj = ringPx[j].x, yj = ringPx[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y))
                && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    if (isPointInPoly(centroid)) {
        return centroid;
    }

    const candidates = [
        { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        { x: minX + 0.3 * (maxX - minX), y: minY + 0.5 * (maxY - minY) },
        { x: minX + 0.7 * (maxX - minX), y: minY + 0.5 * (maxY - minY) },
        { x: minX + 0.5 * (maxX - minX), y: minY + 0.3 * (maxY - minY) },
        { x: minX + 0.5 * (maxX - minX), y: minY + 0.7 * (maxY - minY) },
        ringPx[0]
    ];

    for (const cand of candidates) {
        if (isPointInPoly(cand)) {
            return cand;
        }
    }

    return ringPx[0];
}

export function getFeatureLatLngCentroid(geom: GeoJsonGeometry) {
    let ring: number[][] | null = null;
    if (geom.type === 'Polygon' && (geom.coordinates as number[][][])?.[0]) {
        ring = (geom.coordinates as number[][][])[0];
    } else if (geom.type === 'MultiPolygon' && (geom.coordinates as number[][][][])?.[0]?.[0]) {
        ring = (geom.coordinates as number[][][][])[0][0];
    }
    if (!ring || ring.length === 0) return null;

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    let sumLat = 0, sumLng = 0;

    for (let i = 0; i < ring.length; i++) {
        const lng = ring[i][0];
        const lat = ring[i][1];

        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;

        sumLat += lat;
        sumLng += lng;
    }

    const avgLat = sumLat / ring.length;
    const avgLng = sumLng / ring.length;

    const isLatLngInPoly = (lat: number, lng: number) => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            const intersect = ((yi > lat) !== (yj > lat))
                && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    if (isLatLngInPoly(avgLat, avgLng)) {
        return L.latLng(avgLat, avgLng);
    }

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    if (isLatLngInPoly(centerLat, centerLng)) {
        return L.latLng(centerLat, centerLng);
    }

    return L.latLng(ring[0][1], ring[0][0]);
}

export function drawAssetBeaconPins(
    ctx: CanvasRenderingContext2D,
    features: TurboFeature[],
    coords: L.Coords,
    size: L.Point,
    activeTypeId: string,
    getFeatureStyle: (f: TurboFeature, type: string) => L.PathOptions | undefined
) {
    const currentZoom = coords.z;
    for (const f of features) {
        const style = getFeatureStyle(f, 'footprints');
        if (!style || (style.fill === false && style.stroke === false)) continue;

        const centroid = getGeometryCentroid(f.geometry, coords, size);
        if (!centroid) continue;
        if (centroid.x < -40 || centroid.x > size.x + 40 || centroid.y < -40 || centroid.y > size.y + 40) continue;

        const props = f.properties || {};
        const featTypeId = String(props.AssetTypeId || props.assetTypeId || props.PropertyTypeID || props.PropertyTypeId || props.typeId || props.TypeId || '').trim();
        const featMpms = String(props.MPMS_ID || props.mpmsId || props.assetNo || props.AssetNo || '').toUpperCase();

        let isHighlighted = false;
        const expectedConfig = MUNICIPAL_ASSET_TYPE_COLORS[activeTypeId];
        if (featTypeId === activeTypeId) {
            isHighlighted = true;
        } else if (expectedConfig?.mpmsCode && featMpms.startsWith(expectedConfig.mpmsCode)) {
            isHighlighted = true;
        } else if (!featTypeId && expectedConfig?.label) {
            const nameStr = String(props.AssetName || props.assetName || props.TypeName || props.typeName || props.PropertyDescription || '');
            if (nameStr.includes(expectedConfig.label.split(' ')[0])) isHighlighted = true;
        }

        if (!isHighlighted) continue;

        ctx.save();
        const outerR = Math.min(28, Math.max(16, currentZoom >= 16 ? 24 : 20));
        const midR = Math.min(15, Math.max(10, currentZoom >= 16 ? 14 : 12));
        const coreR = Math.min(9, Math.max(6, currentZoom >= 16 ? 8.5 : 7.5));

        const glowGrad = ctx.createRadialGradient(centroid.x, centroid.y, coreR, centroid.x, centroid.y, outerR);
        glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.75)');
        glowGrad.addColorStop(0.45, 'rgba(244, 63, 94, 0.38)');
        glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, outerR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, midR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, coreR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export function drawTileLabels(
    ctx: CanvasRenderingContext2D,
    features: TurboFeature[],
    coords: L.Coords,
    size: L.Point,
    isAssetDept: boolean,
    getFeatureStyle: (f: TurboFeature, type: string) => L.PathOptions | undefined
) {
    const currentZoom = coords.z;
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const drawnLabelBoxes: { x1: number; y1: number; x2: number; y2: number }[] = [];

    const checkCollision = (newBox: typeof drawnLabelBoxes[0]) => {
        for (const box of drawnLabelBoxes) {
            if (newBox.x1 < box.x2 && newBox.x2 > box.x1 &&
                newBox.y1 < box.y2 && newBox.y2 > box.y1) {
                return true;
            }
        }
        return false;
    };

    const fontScale = isAssetDept ? 1.0 : 0.85;

    let bFont = `900 ${Math.round(11.5 * fontScale)}px "Inter", "Outfit", sans-serif`;
    let sFont = `800 ${Math.round(9.5 * fontScale)}px "Noto Sans Devanagari", "Inter", sans-serif`;
    let bHeight = 11.5 * fontScale;
    let sHeight = 9.5 * fontScale;
    let showSociety = true;
    let yOffset = 5.5 * fontScale;

    if (currentZoom <= 13) {
        bFont = `900 ${Math.round(9.5 * fontScale)}px "Inter", sans-serif`;
        sFont = `800 ${Math.round(8.5 * fontScale)}px "Noto Sans Devanagari", "Inter", sans-serif`;
        bHeight = 9.5 * fontScale;
        sHeight = 8.5 * fontScale;
        yOffset = 4.5 * fontScale;
        showSociety = true;
    } else if (currentZoom <= 15) {
        bFont = `900 ${Math.round(11 * fontScale)}px "Inter", sans-serif`;
        sFont = `800 ${Math.round(9.5 * fontScale)}px "Noto Sans Devanagari", "Inter", sans-serif`;
        bHeight = 11 * fontScale;
        sHeight = 9.5 * fontScale;
        yOffset = 5.5 * fontScale;
        showSociety = true;
    } else if (currentZoom <= 17) {
        bFont = `900 ${Math.round(12.5 * fontScale)}px "Inter", sans-serif`;
        sFont = `800 ${Math.round(10.5 * fontScale)}px "Noto Sans Devanagari", "Inter", sans-serif`;
        bHeight = 12.5 * fontScale;
        sHeight = 10.5 * fontScale;
        yOffset = 6.5 * fontScale;
        showSociety = true;
    } else if (currentZoom >= 18) {
        bFont = `900 ${Math.round(14 * fontScale)}px "Inter", sans-serif`;
        sFont = `800 ${Math.round(12 * fontScale)}px "Noto Sans Devanagari", "Inter", sans-serif`;
        bHeight = 14 * fontScale;
        sHeight = 12 * fontScale;
        yOffset = 7.5 * fontScale;
        showSociety = true;
    }

    const drawTextWithHalo = (text: string, x: number, y: number, font: string, fillStyle: string) => {
        ctx.font = font;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = fillStyle;
        ctx.fillText(text, x, y);
    };

    for (const f of features) {
        const style = getFeatureStyle(f, 'footprints');
        if (!style || (style.fill === false && style.stroke === false)) continue;

        const featId = f.properties?._normalizedOwnerId || '';
        const props = f.properties || {};
        const buildingId = String(
            props.MPMS_ID ||
            props.mpmsId ||
            props.AssetNo ||
            props.assetNo ||
            props.OwnerID ||
            props.ownerID ||
            props.Buil_ID ||
            props.buil_id ||
            featId ||
            ''
        ).trim();

        const rawMarathiSocietyName = String(
            props.AssetName ||
            props.assetName ||
            props.MarathiOwn ||
            props.marathiOwn ||
            props.MarathiOwnerPatta ||
            props.marathiOwnerPatta ||
            props.MarathiSocietyName ||
            props.marathiSocietyName ||
            props.PropertyDe ||
            props.propertyDe ||
            props.PropertyDescription ||
            props.Address ||
            props.address ||
            props.TypeName ||
            props.typeName ||
            props.SocietyName ||
            ''
        ).trim();

        const isNaValue = (val: string) => {
            const u = val.toUpperCase().trim();
            return !val || u === 'NA' || u === 'N/A' || u === 'NULL' || u === '-' || u === '--' || u === buildingId.toUpperCase();
        };
        const marathiSocietyName = showSociety && !isNaValue(rawMarathiSocietyName) ? rawMarathiSocietyName : '';

        if (!buildingId && !marathiSocietyName) continue;

        const centroid = getGeometryCentroid(f.geometry, coords, size);
        if (!centroid) continue;

        if (centroid.x < -30 || centroid.x > size.x + 30 || centroid.y < -30 || centroid.y > size.y + 30) {
            continue;
        }

        ctx.font = bFont;
        const bWidth = buildingId ? ctx.measureText(buildingId).width : 0;
        ctx.font = sFont;
        const sWidth = marathiSocietyName ? ctx.measureText(marathiSocietyName).width : 0;
        const maxW = Math.max(bWidth, sWidth);

        const padX = 3;
        const padY = 2;
        let box: typeof drawnLabelBoxes[0];

        if (buildingId && marathiSocietyName) {
            box = {
                x1: centroid.x - maxW / 2 - padX,
                y1: centroid.y - yOffset - bHeight / 2 - padY,
                x2: centroid.x + maxW / 2 + padX,
                y2: centroid.y + yOffset + sHeight / 2 + padY
            };
        } else if (buildingId) {
            box = {
                x1: centroid.x - bWidth / 2 - padX,
                y1: centroid.y - bHeight / 2 - padY,
                x2: centroid.x + bWidth / 2 + padX,
                y2: centroid.y + bHeight / 2 + padY
            };
        } else {
            box = {
                x1: centroid.x - sWidth / 2 - padX,
                y1: centroid.y - sHeight / 2 - padY,
                x2: centroid.x + sWidth / 2 + padX,
                y2: centroid.y + sHeight / 2 + padY
            };
        }

        if (checkCollision(box)) continue;

        drawnLabelBoxes.push(box);

        if (buildingId && marathiSocietyName) {
            drawTextWithHalo(buildingId, centroid.x, centroid.y - yOffset, bFont, '#000000');
            drawTextWithHalo(marathiSocietyName, centroid.x, centroid.y + yOffset, sFont, '#1E293B');
        } else if (buildingId) {
            drawTextWithHalo(buildingId, centroid.x, centroid.y, bFont, '#000000');
        } else if (marathiSocietyName) {
            drawTextWithHalo(marathiSocietyName, centroid.x, centroid.y, sFont, '#1E293B');
        }
    }
}
