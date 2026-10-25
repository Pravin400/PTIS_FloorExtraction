'use client';

import { useMemo } from 'react';
import { MapPin, Layers, Rotate3D } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { normalizeId } from '@/lib/utils/asset-gis-utils';
import { Button } from '@/components/common';
import { FilterDropdown } from './FilterDropdown';
import type { AssetGisFilterListProps } from '@/types/asset-gis.types';

export type { AssetGisFilterListProps };

export function AssetGisFilterList({ allWardSummaries, activeDropdown, setActiveDropdown, isLoading }: AssetGisFilterListProps) {
  const t = useTranslations('assetGis');
  const selectedZone = useCouncilBoundaryStore(state => state.selectedZone);
  const setSelectedZone = useCouncilBoundaryStore(state => state.setSelectedZone);
  const zones = useCouncilBoundaryStore(state => (state as unknown as Record<string, unknown>).zones) as Array<{ id: string | number; label?: string; name?: string; code?: string; zoneNo?: string }> | undefined;
  const blocks = useCouncilBoundaryStore(state => (state as unknown as Record<string, unknown>).blocks) as Array<{ id: string | number; label?: string; name?: string; code?: string; wardNo?: string; nodeId?: string; nodeID?: string }> | undefined;
  const selectedBlock = useCouncilBoundaryStore(state => state.selectedBlock);
  const setSelectedBlock = useCouncilBoundaryStore(state => state.setSelectedBlock);
  const resetFilters = useCouncilBoundaryStore(state => state.resetFilters);
  const geoJsonLayers = useCouncilBoundaryStore(state => state.geoJsonLayers);

  // Extract valid ZoneNos and WardNos present in the active GeoJSON boundaries
  const availableGeoJsonZones = useMemo(() => {
    const zoneData = (geoJsonLayers?.zone || geoJsonLayers?.['ZONE_BOUNDARY_LAYER'] || geoJsonLayers?.['1']) as GeoJSON.FeatureCollection | undefined;
    if (!zoneData?.features?.length) return null;
    const set = new Set<string>();
    zoneData.features.forEach((f: GeoJSON.Feature) => {
      const p = (f.properties || {}) as Record<string, unknown>;
      const raw = String(p.ZONE || p.ZONE_NO_ || p.Zone || p.ZoneCode || p.ZoneName || p.Name || '').trim();
      if (raw) {
        set.add(raw.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const letter = raw.match(/ZONE\s+([A-Z0-9]+)/i)?.[1];
        if (letter) set.add(letter.toLowerCase().replace(/[^a-z0-9]/g, ''));
      }
    });
    return set;
  }, [geoJsonLayers]);

  const availableGeoJsonWards = useMemo(() => {
    const wardData = (geoJsonLayers?.ward || geoJsonLayers?.['WARD_BOUNDARY_LAYER'] || geoJsonLayers?.['5'] || geoJsonLayers?.['2'] || geoJsonLayers?.block) as GeoJSON.FeatureCollection | undefined;
    if (!wardData?.features?.length) return null;
    const set = new Set<string>();
    wardData.features.forEach((f: GeoJSON.Feature) => {
      const p = (f.properties || {}) as Record<string, unknown>;
      const raw = String(p.WARD_NO || p.WardNo || p.Ward_No || p.NewWardNo || p.Short_ID || p.name || p.WardName || '').trim();
      if (raw) {
        const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
        set.add(clean);
        const stripped = clean.replace(/ward/i, '');
        if (stripped) set.add(stripped);
      }
    });
    return set;
  }, [geoJsonLayers]);

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Dynamic Zone Filter */}
      <FilterDropdown
        label={t('sidebar.zone')}
        icon={MapPin}
        options={[
          { id: 'all', label: t('sidebar.allZone'), icon: MapPin },
          ...(Array.isArray(zones)
            ? zones
              .filter((z: { id: string | number; label?: string; name?: string }) => {
                if (!availableGeoJsonZones || availableGeoJsonZones.size === 0) return true;
                const raw = String(z.label || z.name || z.id || '').trim();
                const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
                const code = (raw.match(/^([A-Z0-9]+)\s*[-_]/i)?.[1] || raw.split(' ')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return availableGeoJsonZones.has(clean) || (code && availableGeoJsonZones.has(code));
              })
              .map((z: { id: string | number; label?: string; name?: string; code?: string; zoneNo?: string }) => {
                const fullName = z.label || z.name || String(z.id);

                const zoneBlocks = (Array.isArray(allWardSummaries) ? allWardSummaries : []).filter((w: { zoneNo?: string }) => {
                  const zoneNo = normalizeId(w.zoneNo || '');
                  const zIdNorm = normalizeId(String(z.id));
                  const zNoNorm = normalizeId(z.code || z.zoneNo || z.label || '');
                  return zoneNo === zIdNorm || zoneNo === zNoNorm;
                });

                const count = zoneBlocks.reduce((acc: number, curr: { totalCount?: number }) => acc + (curr.totalCount || 0), 0);
                return {
                  id: String(z.id),
                  label: fullName,
                  count: count > 0 ? count : null,
                  color: '#3b82f6'
                };
              })
            : [])
        ]}
        selectedValue={selectedZone || 'all'}
        onSelect={(id) => {
          if (id === 'all') {
            setSelectedZone(null);
          } else {
            const zObj = zones?.find((z: { id: string | number; label?: string; code?: string; zoneNo?: string }) => String(z.id) === String(id));
            const zoneLabel = zObj ? zObj.label : null;
            const zoneNo = zObj ? (zObj.code || zObj.zoneNo || zObj.label) : String(id);
            setSelectedZone(String(id), zoneLabel, zoneNo);
          }
        }}
        isOpen={activeDropdown === 'zone'}
        setIsOpen={(open) => setActiveDropdown(open ? 'zone' : null)}
        searchable
        isLoading={isLoading}
      />

      {/* 2. Dynamic Ward Filter */}
      <FilterDropdown
        label={t('sidebar.ward')}
        icon={Layers}
        options={[
          { id: 'all', label: t('sidebar.allWard'), icon: Layers },
          ...(Array.isArray(blocks)
            ? blocks
              .filter((b: { id: string | number; label?: string; name?: string; nodeId?: string; nodeID?: string }) => {
                if (selectedZone && selectedZone !== 'all') {
                  const zIdNorm = normalizeId(selectedZone);
                  const bNodeIdNorm = normalizeId(b.nodeId || b.nodeID || '');
                  if (bNodeIdNorm !== zIdNorm) return false;
                }
                if (availableGeoJsonWards && availableGeoJsonWards.size > 0) {
                  const raw = String(b.label || b.name || b.id || '').trim();
                  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const code = (raw.match(/^([A-Z0-9]+)\s*[-_]/i)?.[1] || raw.split(' ')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  return availableGeoJsonWards.has(clean) || (code && availableGeoJsonWards.has(code));
                }
                return true;
              })
              .map((b: { id: string | number; label?: string; name?: string }) => {
                const wardSummary = (Array.isArray(allWardSummaries) ? allWardSummaries : []).find(
                  (w: { newWardNo?: string; wardNo?: string }) => normalizeId(w.newWardNo || w.wardNo || '') === normalizeId(String(b.label))
                );
                const count = wardSummary ? wardSummary.totalCount : null;

                return {
                  id: String(b.id),
                  label: `Ward ${b.label}`,
                  count: count && count > 0 ? count : null,
                  color: '#ff9900'
                };
              })
            : [])
        ]}
        selectedValue={selectedBlock && selectedBlock.length > 0 ? selectedBlock[0] : 'all'}
        onSelect={(id) => {
          if (id === 'all') {
            setSelectedBlock([]);
          } else {
            const bObj = blocks?.find((b: { id: string | number; label?: string; code?: string; wardNo?: string }) => String(b.id) === String(id));
            const wardLabel = bObj ? bObj.label : null;
            const wardNo = bObj ? (bObj.label || bObj.code || bObj.wardNo) : String(id);
            setSelectedBlock([String(id)], wardLabel, wardNo ? [wardNo] : []);
          }
        }}
        isOpen={activeDropdown === 'ward'}
        setIsOpen={(open) => setActiveDropdown(open ? 'ward' : null)}
        searchable
        isLoading={isLoading}
      />

      {/* 3. Reset All Filters */}
      <div className="mt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={resetFilters}
          icon={Rotate3D}
          className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm p-3 flex items-center justify-center transition-all duration-300 hover:shadow-md hover:border-slate-300/80 group text-slate-600 hover:text-slate-800 font-bold text-[13px] tracking-wide"
        >
          {t('sidebar.resetFilters')}
        </Button>
      </div>
    </div>
  );
}
