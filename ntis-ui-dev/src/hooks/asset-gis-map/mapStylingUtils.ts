import { normalizeId } from '@/lib/utils/asset-gis-utils';

export function resolveTargetWardNos(
    selectedWardNo: string[],
    selectedBlock: string[],
    blocksMetadata: Array<{ id: string | number; label?: string }>,
    isAllBlock: boolean
): string[] {
    if (isAllBlock) return [];
    return Array.from(new Set([
        ...selectedWardNo.filter((w: string) => w && w !== 'all').flatMap((w: string) => {
            const norm = normalizeId(w);
            const parts = String(w).split(/[\s\-_/]+/).filter(Boolean).map(p => normalizeId(p));
            return [norm, ...parts];
        }),
        ...selectedBlock.filter((b: string) => b && b !== 'all').flatMap((id: string) => {
            const normId = normalizeId(id);
            const blockMeta = (blocksMetadata || []).find(b => normalizeId(b.id) === normId);
            const label = blockMeta && blockMeta.label ? blockMeta.label : id;
            const parts = String(label).split(/[\s\-_/]+/).filter(Boolean).map(p => normalizeId(p));
            return [normId, normalizeId(label), ...parts];
        })
    ]));
}

export function findSelectedZoneFeature(
    zoneData: GeoJSON.FeatureCollection | undefined,
    isAllZone: boolean,
    targetZone: string,
    targetZoneNo: string,
    targetZoneLabel: string
): GeoJSON.Feature | null {
    if (isAllZone || !zoneData?.features) return null;
    return zoneData.features.find((f: GeoJSON.Feature) => {
        const props = (f.properties || {}) as Record<string, unknown>;
        const rawName = String(props.ZONE || props.ZONE_NO_ || props.Zone || props.Name || props.ZoneName || props.label || '');
        const fName = normalizeId(rawName);
        const fCode = normalizeId(String(props.ZoneCode || props.zone_code || ''));
        const fId = normalizeId(String(props.ZoneID || props.id || props.OBJECTID || ''));
        const fLetter = rawName.match(/ZONE\s+([A-D0-9]+)/i)?.[1]?.toLowerCase() || '';
        return (targetZoneNo && (fName === targetZoneNo || fCode === targetZoneNo || fLetter === targetZoneNo || fName.includes(targetZoneNo))) ||
            (targetZoneLabel && (fName === targetZoneLabel || fName.includes(targetZoneLabel))) ||
            (targetZone && (fName === targetZone || fCode === targetZone || fId === targetZone));
    }) || null;
}

export function findSelectedWardFeature(
    wardData: GeoJSON.FeatureCollection | undefined,
    isAllBlock: boolean,
    targetWardNos: string[]
): GeoJSON.Feature | null {
    if (isAllBlock || !wardData?.features || targetWardNos.length === 0) return null;
    return wardData.features.find((f: GeoJSON.Feature) => {
        const p = (f.properties || {}) as Record<string, unknown>;
        const rawWard = String(p.WARD_NO || p.WardNo || p.Ward_No || p.NewWardNo || p.Short_ID || p.ShortID || p.WardName || p.name || '').trim();
        const normWardNo = normalizeId(rawWard);
        const strippedWardNo = normWardNo.replace(/^ward/i, '');
        const dbId = normalizeId(String(p.id || p.ID || p.OBJECTID || p.WardID || p.Ward_Id || ''));
        const parts = rawWard.split(/[\s\-_/]+/).filter(Boolean).map(x => normalizeId(x));

        return targetWardNos.some(t => {
            const strippedTarget = t.replace(/^ward/i, '');
            return normWardNo === t || strippedWardNo === strippedTarget || normWardNo === strippedTarget || strippedWardNo === t || dbId === t || parts.includes(t);
        });
    }) || null;
}
