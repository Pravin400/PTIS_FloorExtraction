'use client';

import { useState, useMemo } from 'react';
import {
  MapPin,
  Layers,
  Building2,
  Rotate3D,
  ClipboardCheck,
  Filter,
  LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FilterDropdown } from '../sidebar/FilterDropdown';
import { AssetGisFilterBadges } from '../sidebar/AssetGisFilterBadges';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { AssetGisSearchSection } from '../sidebar/AssetGisSearchSection';
import { Button } from '@/components/common';
import {
  useAssetGisFilters,
  useGisCorporationConfig,
  useGisDepartmentFilterMappings,
} from '@/hooks/asset-gis-api/useAssetGisQueries';
import type { AssetFiltersProps } from '@/types/asset-gis.types';

export type { AssetFiltersProps };

const FILTER_ICON_MAP: Record<string, LucideIcon> = {
  zoneid: MapPin,
  zone: MapPin,
  wardid: Layers,
  ward: Layers,
  wardno: Layers,
  assetcategoryid: ClipboardCheck,
  category: ClipboardCheck,
  assetcategory: ClipboardCheck,
  assettypeid: Building2,
  type: Building2,
  assettype: Building2,
};

export function AssetFilters({ isLoading }: AssetFiltersProps) {
  const t = useTranslations('assetGis');
  const storeZone = useCouncilBoundaryStore((s) => s.selectedZone);
  const storeBlock = useCouncilBoundaryStore((s) => s.selectedBlock);
  const setStoreZone = useCouncilBoundaryStore((s) => s.setSelectedZone);
  const setStoreBlock = useCouncilBoundaryStore((s) => s.setSelectedBlock);
  const resetStoreFilters = useCouncilBoundaryStore((s) => s.resetFilters);
  const setSelectedPropertyWithSource = useCouncilBoundaryStore((s) => s.setSelectedPropertyWithSource);

  const storeCategory = useCouncilBoundaryStore((s) => s.documentSubmittedStatus);
  const setStoreCategory = useCouncilBoundaryStore((s) => s.setDocumentSubmittedStatus);

  const storePropertyTypeId = useCouncilBoundaryStore((s) => s.selectedPropertyTypeId);
  const setStorePropertyTypeId = useCouncilBoundaryStore((s) => s.setSelectedPropertyTypeId);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // 1. Dynamic Corporation & Department Discovery from Database
  const { data: corpConfig } = useGisCorporationConfig();
  const departmentId = corpConfig?.defaultDepartmentId || 3;

  // 2. Master Filter Mappings from DB (/api/GisDepartmentFilterMapping?DepartmentId={id})
  const { data: masterFilters = [] } = useGisDepartmentFilterMappings(departmentId);

  // 3. Dynamic cascading filters from /api/gis/asset/filters (Zone -> Ward, Category -> Type)
  const activeZoneId = storeZone && storeZone !== 'all' ? Number(storeZone) || storeZone : null;
  const activeCategoryId = storeCategory && storeCategory !== 'all' ? Number(storeCategory) || storeCategory : null;

  const { data: dynamicFilterGroups = [], isLoading: loadingFilters } = useAssetGisFilters(
    activeZoneId,
    activeCategoryId
  );

  const geoJsonLayers = useCouncilBoundaryStore((s) => s.geoJsonLayers);

  // Extract valid ZoneNos and WardNos present in the active GeoJSON boundaries
  const availableGeoJsonZones = useMemo(() => {
    const zoneData = (geoJsonLayers?.zone || geoJsonLayers?.['ZONE_BOUNDARY_LAYER'] || geoJsonLayers?.['1']) as GeoJSON.FeatureCollection | undefined;
    if (!zoneData?.features?.length) return null;
    const set = new Set<string>();
    zoneData.features.forEach((f: GeoJSON.Feature) => {
      const p = (f.properties || {}) as Record<string, unknown>;
      let raw = String(p.ZONE || p.ZONE_NO_ || p.Zone || p.ZoneCode || p.ZoneName || p.Name || '').trim();
      if (!raw && p.OBJECTID === 9) raw = 'ZONE D';
      if (raw) {
        set.add(raw.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const letter = raw.match(/ZONE\s+([A-Z0-9]+)/i)?.[1];
        if (letter) {
          set.add(letter.toLowerCase().replace(/[^a-z0-9]/g, ''));
          set.add(`zone${letter.toLowerCase()}`);
        }
      }
    });
    // Ensure standard Akola zones are always present
    set.add('a'); set.add('b'); set.add('c'); set.add('d');
    set.add('zonea'); set.add('zoneb'); set.add('zonec'); set.add('zoned');
    return set;
  }, [geoJsonLayers]);

  const availableGeoJsonWards = useMemo(() => {
    const wardData = (geoJsonLayers?.ward || geoJsonLayers?.['WARD_BOUNDARY_LAYER'] || geoJsonLayers?.['6'] || geoJsonLayers?.['5'] || geoJsonLayers?.['2'] || geoJsonLayers?.block) as GeoJSON.FeatureCollection | undefined;
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
        const parts = raw.split(/[\s\-_/]+/).filter(Boolean);
        parts.forEach(part => set.add(part.toLowerCase().replace(/[^a-z0-9]/g, '')));
      }
    });
    return set;
  }, [geoJsonLayers]);

  // 4. Merge Master Filter Definitions with Dynamic Cascading Lookup Options (GeoJSON Intersected)
  const renderedFilterGroups = useMemo(() => {
    const filterOptionsByGeoJson = (keyLower: string, options: Array<{ id: string; label: string; parentId?: string }>) => {
      if ((keyLower === 'zoneid' || keyLower === 'zone') && availableGeoJsonZones && availableGeoJsonZones.size > 0) {
        return options.filter((o) => {
          const raw = String(o.label || o.id).trim();
          const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
          const code = (raw.match(/^([A-Z0-9]+)\s*[-_]/i)?.[1] || raw.split(' ')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return availableGeoJsonZones.has(clean) || (code && availableGeoJsonZones.has(code));
        });
      }

      if ((keyLower === 'wardid' || keyLower === 'ward' || keyLower === 'wardno') && availableGeoJsonWards && availableGeoJsonWards.size > 0) {
        return options.filter((o) => {
          const raw = String(o.label || o.id).trim();
          const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
          const code = (raw.match(/^([A-Z0-9]+)\s*[-_]/i)?.[1] || raw.split(' ')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return availableGeoJsonWards.has(clean) || (code && availableGeoJsonWards.has(code));
        });
      }

      return options;
    };

    // If master filters table has active mappings, order and label by master table
    if (Array.isArray(masterFilters) && masterFilters.length > 0) {
      const activeMasters = masterFilters
        .filter((m) => m.isActive !== false)
        .sort((a, b) => Number(a.displayOrder || (a as Record<string, unknown>).DisplayOrder || 0) - Number(b.displayOrder || (b as Record<string, unknown>).DisplayOrder || 0));

      return activeMasters.map((master) => {
        const rawKey = String(master.filterKey || (master as Record<string, unknown>).FilterKey || '').trim();
        const keyLower = rawKey.toLowerCase();
        const label = String(
          master.customLabel ||
          (master as Record<string, unknown>).CustomLabel ||
          master.filterLabel ||
          (master as Record<string, unknown>).FilterLabel ||
          (master as Record<string, unknown>).defaultLabel ||
          rawKey || ''
        );

        const matchedDynamicGroup = dynamicFilterGroups.find(
          (g) => g.filterKey.toLowerCase() === keyLower
        );

        let options: Array<{ id: string; label: string; parentId?: string }> = (matchedDynamicGroup?.options || []).map((o) => ({
          id: String(o.id),
          label: o.name,
          parentId: o.parentId ? String(o.parentId) : undefined,
        }));

        options = filterOptionsByGeoJson(keyLower, options);

        return {
          key: rawKey,
          keyLower,
          label,
          displayOrder: Number(master.displayOrder || (master as Record<string, unknown>).DisplayOrder || 0),
          options,
        };
      });
    }

    // Direct binding to dynamic API filter groups
    return dynamicFilterGroups
      .map((g) => {
        const keyLower = g.filterKey.toLowerCase();
        let options: Array<{ id: string; label: string; parentId?: string }> = (g.options || []).map((o) => ({
          id: String(o.id),
          label: o.name,
          parentId: o.parentId ? String(o.parentId) : undefined,
        }));

        options = filterOptionsByGeoJson(keyLower, options);

        return {
          key: g.filterKey,
          keyLower,
          label: String(g.filterLabel || ''),
          displayOrder: Number(g.displayOrder || 0),
          options,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [masterFilters, dynamicFilterGroups, availableGeoJsonZones, availableGeoJsonWards]);

  // Handle Dynamic Value Resolution
  const getFilterSelectedValue = (keyLower: string): string => {
    switch (keyLower) {
      case 'zoneid':
      case 'zone':
        return storeZone || 'all';
      case 'wardid':
      case 'ward':
      case 'wardno':
        return storeBlock && storeBlock.length > 0 ? String(storeBlock[0]) : 'all';
      case 'assetcategoryid':
      case 'category':
      case 'assetcategory':
        return storeCategory || 'all';
      case 'assettypeid':
      case 'type':
      case 'assettype':
        return storePropertyTypeId ? String(storePropertyTypeId) : 'all';
      default:
        return 'all';
    }
  };

  // Handle Dynamic Selection Change
  const handleFilterSelect = (keyLower: string, value: string) => {
    switch (keyLower) {
      case 'zoneid':
      case 'zone': {
        const group = renderedFilterGroups.find(g => g.keyLower === 'zoneid' || g.keyLower === 'zone');
        const opt = group?.options.find(o => o.id === value);
        const zoneLabel = opt ? opt.label : (value === 'all' ? 'all' : null);
        const zoneNo = opt ? (opt.label.match(/^([A-Z0-9]+)\s*[-_]/i)?.[1] || opt.label.split(' ')[0] || value) : (value === 'all' ? 'all' : value);
        setStoreZone(value === 'all' ? 'all' : value, zoneLabel, zoneNo);
        setStoreBlock([], null, []); // Reset cascading wards on zone change
        break;
      }
      case 'wardid':
      case 'ward':
      case 'wardno': {
        const group = renderedFilterGroups.find(g => g.keyLower === 'wardid' || g.keyLower === 'ward' || g.keyLower === 'wardno');
        const opt = group?.options.find(o => o.id === value);
        const wardLabel = opt ? opt.label : (value === 'all' ? 'all' : null);
        const wardCode = opt ? (opt.label.match(/^([A-Z0-9]+)\s*[-_]/i)?.[1] || opt.label.split(' ')[0] || value) : (value === 'all' ? 'all' : value);
        setStoreBlock(value === 'all' ? [] : [value], wardLabel, wardCode && wardCode !== 'all' ? [wardCode] : []);
        break;
      }
      case 'assetcategoryid':
      case 'category':
      case 'assetcategory':
        setStoreCategory(value === 'all' ? null : value);
        setStorePropertyTypeId(null); // Reset cascading asset types on category change
        break;
      case 'assettypeid':
      case 'type':
      case 'assettype':
        setStorePropertyTypeId(value === 'all' ? null : Number(value));
        break;
      default:
        break;
    }
  };

  const handleReset = () => {
    resetStoreFilters();
    setStoreCategory('all');
    setStorePropertyTypeId(null);
    setActiveDropdown(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Section with suggestions dropdown */}
      <AssetGisSearchSection onSelectProperty={(item) => setSelectedPropertyWithSource(item, 'search')} />

      {/* Active Filters Badges Section */}
      <AssetGisFilterBadges />

      {/* Database-Driven Dynamic Filters List */}
      <div className="flex flex-col gap-3">
        {renderedFilterGroups.map((group) => {
          const IconComponent = FILTER_ICON_MAP[group.keyLower] || Filter;
          const selectedValue = getFilterSelectedValue(group.keyLower);

          return (
            <FilterDropdown
              key={group.key}
              label={group.label}
              icon={IconComponent}
              options={[
                { id: 'all', label: `All ${group.label}`, icon: IconComponent },
                ...group.options,
              ]}
              selectedValue={selectedValue}
              onSelect={(val) => handleFilterSelect(group.keyLower, String(val))}
              isOpen={activeDropdown === group.keyLower}
              setIsOpen={(open) => setActiveDropdown(open ? group.keyLower : null)}
              searchable
              isLoading={isLoading || loadingFilters}
            />
          );
        })}

        {/* Reset Button */}
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleReset}
            icon={Rotate3D}
            className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm p-3 flex items-center justify-center transition-all duration-300 hover:shadow-md hover:border-slate-300/80 group text-slate-600 hover:text-slate-800 font-bold text-[13px] tracking-wide"
          >
            {t('sidebar.resetFilters')}
          </Button>
        </div>
      </div>
    </div>
  );
}
