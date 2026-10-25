import L from 'leaflet';
import type {
  GisCorporationConfigDto,
  GisGrievanceFilterGroupDto,
  GisGrievanceQueryParameters,
} from '@/types/grievance/grievance-gis.types';

export function extractWardCode(props?: Record<string, unknown> | null): string {
  if (!props) return '';
  const val = (props.NEW_WARD_N ?? props.WardNo ?? props.wardNo ?? props.WARD_NO ?? props.WardName ?? '') as string | number;
  return String(val).trim().toUpperCase();
}

export function createZoneLabelIcon(zoneName: string): L.DivIcon {
  return L.divIcon({
    className: 'gis-zone-map-label',
    html: `<div style="font-family:system-ui,sans-serif;font-size:13px;font-weight:900;letter-spacing:0.08em;color:#0f172a;text-shadow:-2px -2px 0 #fff,2px -2px 0 #fff,-2px 2px 0 #fff,2px 2px 0 #fff,0 2px 4px rgba(0,0,0,0.5);white-space:nowrap;pointer-events:none;line-height:1;text-align:center;">${zoneName}</div>`,
    iconSize: [120, 22],
    iconAnchor: [60, 11],
  });
}

export function resolveZoneColor(
  featureProps?: Record<string, unknown> | null,
  filterGroups?: GisGrievanceFilterGroupDto[]
): string {
  if (!featureProps) return '';
  const zoneGroup = filterGroups?.find(
    (g) => g.filterKey?.toLowerCase() === 'zoneid' || g.filterKey?.toLowerCase() === 'zone'
  );
  if (!zoneGroup?.options) return '';

  const zid = featureProps.zoneId ?? featureProps.ZoneId ?? featureProps.id;
  if (zid !== undefined && zid !== null) {
    const opt = zoneGroup.options.find((o) => Number(o.id) === Number(zid));
    if (opt?.colorCode) return opt.colorCode;
  }

  const raw = String(
    featureProps.zoneNo || featureProps.ZoneNo || featureProps.name || featureProps.ZoneName || featureProps.Zone || ''
  ).trim().toLowerCase();

  if (raw) {
    const opt = zoneGroup.options.find(
      (o) => o.name?.toLowerCase().includes(raw) || (o.code && raw.includes(o.code.toLowerCase()))
    );
    if (opt?.colorCode) return opt.colorCode;
  }
  return '';
}

export function isWardInZone(
  wardCode: string,
  targetZoneId: number,
  filterGroups?: GisGrievanceFilterGroupDto[]
): boolean {
  if (!wardCode || !targetZoneId) return false;
  const wardGroup = filterGroups?.find(
    (g) => g.filterKey?.toLowerCase() === 'wardid' || g.filterKey?.toLowerCase() === 'ward'
  );
  if (!wardGroup?.options) return false;

  const opt = wardGroup.options.find((w) => {
    const code = w.code || w.name?.split(/[\s-]+/)[0]?.trim().toUpperCase();
    return code === wardCode.toUpperCase();
  });

  return opt?.parentId !== undefined && Number(opt.parentId) === Number(targetZoneId);
}

export function resolveTargetFilters(
  filters: GisGrievanceQueryParameters,
  filterGroups?: GisGrievanceFilterGroupDto[]
) {
  const targetZoneId = filters.zoneId ? Number(filters.zoneId) : undefined;
  const targetWardId = filters.wardId ? Number(filters.wardId) : undefined;

  let targetWardCode: string | undefined;
  let targetWardParentZoneId: number | undefined;

  if (targetWardId) {
    const wardGroup = filterGroups?.find(
      (g) => g.filterKey?.toLowerCase() === 'wardid' || g.filterKey?.toLowerCase() === 'ward'
    );
    const opt = wardGroup?.options?.find((o) => Number(o.id) === targetWardId);
    if (opt) {
      targetWardCode = opt.code || opt.name?.split(/[\s-]+/)[0]?.trim().toUpperCase();
      if (opt.parentId !== undefined && opt.parentId !== null) {
        targetWardParentZoneId = Number(opt.parentId);
      }
    }
  }

  return { targetZoneId, targetWardId, targetWardCode, targetWardParentZoneId };
}

export function computeZoneStyle(
  feature?: GeoJSON.Feature | null,
  filterGroups?: GisGrievanceFilterGroupDto[],
  isSelected = false
): L.PathOptions {
  const color = resolveZoneColor(feature?.properties, filterGroups);
  return {
    color,
    weight: isSelected ? 4.5 : 3.6,
    opacity: 1.0,
    fill: false,
    fillOpacity: 0,
    lineCap: 'round',
    lineJoin: 'round',
  };
}

export function computeWardStyle(
  style: Record<string, unknown>,
  isSelected = false
): L.PathOptions {
  const color = (style.strokeColor || style.borderColor || '') as string;
  return {
    color,
    weight: isSelected ? 3.0 : 1.8,
    opacity: 0.9,
    fill: false,
    fillOpacity: 0,
    lineCap: 'round',
    lineJoin: 'round',
  };
}

export function fitBoundaryView(
  map: L.Map | null,
  hasWardFilter: boolean,
  hasZoneFilter: boolean,
  wardBounds: L.LatLngBounds,
  zoneBounds: L.LatLngBounds,
  hadFilter: boolean,
  config?: GisCorporationConfigDto | null
) {
  if (!map) return;
  if (hasWardFilter && wardBounds.isValid()) {
    map.fitBounds(wardBounds, { padding: [80, 80], maxZoom: 16, animate: true });
  } else if (hasZoneFilter && zoneBounds.isValid()) {
    map.fitBounds(zoneBounds, { padding: [50, 50], maxZoom: 15, animate: true });
  } else if (!hasWardFilter && !hasZoneFilter && hadFilter && config?.defaultCenterLat && config?.defaultCenterLng) {
    map.setView([Number(config.defaultCenterLat), Number(config.defaultCenterLng)], Number(config.defaultZoom), { animate: true });
  }
}
