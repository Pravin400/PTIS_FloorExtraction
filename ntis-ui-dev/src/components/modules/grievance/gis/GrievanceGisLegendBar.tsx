'use client';
import { useMemo } from 'react';
import { Map } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  GisCorporationConfigDto,
  GisLayerItemDto,
  GisGrievanceFilterGroupDto,
} from '@/types/grievance/grievance-gis.types';

interface GrievanceGisLegendBarProps {
  config?: GisCorporationConfigDto | null;
  layers?: GisLayerItemDto[];
  filterGroups?: GisGrievanceFilterGroupDto[];
}

export function GrievanceGisLegendBar({ layers, filterGroups }: GrievanceGisLegendBarProps) {
  const t = useTranslations('grievance');
  const dynamicZones = useMemo(() => {
    const zoneGroup = filterGroups?.find(
      (g) => g.filterKey?.toLowerCase() === 'zoneid' || g.filterKey?.toLowerCase() === 'zone'
    );
    if (zoneGroup?.options && zoneGroup.options.length > 0) {
      return zoneGroup.options.map((opt) => {
        const match = opt.name?.match(/Zone\s*([A-Za-z0-9])/i) || opt.code?.match(/Zone\s*([A-Za-z0-9])/i);
        const letter = match ? match[1].toUpperCase() : (opt.code || opt.name?.split(/[\s-]+/)[0]?.trim().toUpperCase());
        const displayName = opt.name ? opt.name.split('-')[0].trim() : `Zone ${letter}`;
        return {
          id: opt.id,
          name: displayName,
          color: opt.colorCode || '',
        };
      });
    }

    const zoneLayer = layers?.find(
      (l) => l.layerCode === 'ZONE_BOUNDARY_LAYER' || l.layerName?.toLowerCase().includes('municipal')
    );
    if (zoneLayer?.styleConfigJson) {
      try {
        const s = JSON.parse(zoneLayer.styleConfigJson);
        if (s.zoneColors && typeof s.zoneColors === 'object') {
          return Object.entries(s.zoneColors).map(([letter, color]) => ({
            id: letter,
            name: `Zone ${letter}`,
            color: String(color),
          }));
        }
      } catch {}
    }
    return [];
  }, [filterGroups, layers]);

  const wardColor = useMemo(() => {
    const wardLayer = layers?.find(
      (l) => l.layerCode === 'WARD_BOUNDARY_LAYER' || l.layerName?.toLowerCase().includes('ward')
    );
    if (wardLayer?.styleConfigJson) {
      try {
        const s = JSON.parse(wardLayer.styleConfigJson);
        return s.strokeColor || s.borderColor || '';
      } catch {}
    }
    return '';
  }, [layers]);

  const statusItems = useMemo(() => {
    const statusGroup = filterGroups?.find(
      (g) => g.filterKey?.toLowerCase().includes('state') || g.filterKey?.toLowerCase().includes('status')
    );
    const pendingColor =
      statusGroup?.options?.find((o) => o.name?.toLowerCase().includes('pending'))?.colorCode || '#EF4444';
    const inProgressColor =
      statusGroup?.options?.find(
        (o) =>
          o.name?.toLowerCase().includes('progress') ||
          o.name?.toLowerCase().includes('assigned') ||
          o.name?.toLowerCase().includes('review')
      )?.colorCode || '#EAB308';
    const resolvedColor =
      statusGroup?.options?.find((o) => o.name?.toLowerCase().includes('resolved'))?.colorCode || '#10B981';

    return [
      { name: 'Pending', color: pendingColor },
      { name: 'In Progress', color: inProgressColor },
      { name: 'Resolved', color: resolvedColor },
    ];
  }, [filterGroups]);

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/70 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-bold text-slate-300 uppercase tracking-wider text-[11px]">
        <Map className="w-3.5 h-3.5 text-slate-400" />
        <span>{t('gisMapLegend')}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 text-slate-200">
        {/* Dynamic Status Pins from DB */}
        {statusItems.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20" style={{ backgroundColor: s.color }} />
            <span className="font-medium text-[11px] text-slate-200">{s.name}</span>
          </div>
        ))}

        {/* Dynamic 5 Zone Boundaries from DB */}
        {dynamicZones.map((z) => (
          <div key={String(z.id)} className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: z.color }} />
            <span className="font-medium text-[11px] text-slate-200">{z.name}</span>
          </div>
        ))}

        {/* Dynamic Ward Boundary from DB */}
        {wardColor ? (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: wardColor }} />
            <span className="font-medium text-[11px] text-slate-200">{t('gisWardBoundary')}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
