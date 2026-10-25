import type {
  GisGrievanceQueryParameters,
  GisGrievanceFilterGroupDto,
} from '@/types/grievance/grievance-gis.types';
import type { PublicGrievanceApplication } from '@/types/grievance/public-dashboard.types';

export function filterGrievances(
  list: PublicGrievanceApplication[],
  filters: GisGrievanceQueryParameters
): PublicGrievanceApplication[] {
  return list.filter((item) => {
    if (filters.zoneId && Number(item.zoneId) !== Number(filters.zoneId)) return false;
    if (filters.wardId && Number(item.wardId) !== Number(filters.wardId)) return false;
    if (filters.grievanceDepartmentId && Number(item.grievanceDepartmentId) !== Number(filters.grievanceDepartmentId)) return false;
    if (filters.grievanceTypeId && Number(item.grievanceTypeId) !== Number(filters.grievanceTypeId)) return false;
    if (filters.currentStateId && Number(item.currentStateId) !== Number(filters.currentStateId)) return false;
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.trim().toLowerCase();
      const matchNo = item.grievanceNo?.toLowerCase().includes(term);
      const matchDesc = item.description?.toLowerCase().includes(term);
      const matchCitizen = item.citizenName?.toLowerCase().includes(term);
      const matchDept = item.departmentName?.toLowerCase().includes(term);
      if (!matchNo && !matchDesc && !matchCitizen && !matchDept) return false;
    }

    if (filters.kpiCode) {
      const kpi = filters.kpiCode.toUpperCase();
      if (kpi.includes('TOTAL')) return true;

      const isResolved = Boolean(
        item.isResolved ||
        item.isClosed ||
        item.resolvedDate ||
        item.closedDate ||
        (item.currentStateName && (
          item.currentStateName.toLowerCase().includes('resolved') ||
          item.currentStateName.toLowerCase().includes('closed')
        ))
      );

      const isPending = Boolean(
        !isResolved && (
          item.currentStateId === 1 ||
          (item.currentStateName && (
            item.currentStateName.toLowerCase() === 'pending' ||
            item.currentStateName.toLowerCase().includes('register') ||
            item.currentStateName.toLowerCase().includes('submit')
          ))
        )
      );

      const isInProgress = Boolean(
        !isResolved && !isPending && (
          item.currentStateId === 2 ||
          item.currentStateId === 3 ||
          (item.currentStateName && (
            item.currentStateName.toLowerCase().includes('progress') ||
            item.currentStateName.toLowerCase().includes('review') ||
            item.currentStateName.toLowerCase().includes('assigned') ||
            item.currentStateName.toLowerCase().includes('investigat')
          ))
        )
      );

      if (kpi.includes('PENDING') && !isPending) return false;
      if (kpi.includes('PROGRESS') && !isInProgress) return false;
      if (kpi.includes('RESOLV') && !isResolved) return false;
      if ((kpi.includes('ESCALAT') || kpi.includes('OVERDUE')) && !item.isEscalated) return false;
    }
    return true;
  });
}

export function computeDispersedPositions<
  T extends { latitude?: number | string | null; longitude?: number | string | null }
>(items: T[]): { item: T; lat: number; lng: number }[] {
  const coordCountMap: Record<string, number> = {};
  const coordIndexMap: Record<string, number> = {};

  items.forEach((item) => {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;
    const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
    coordCountMap[key] = (coordCountMap[key] || 0) + 1;
  });

  const dispersed: { item: T; lat: number; lng: number }[] = [];

  items.forEach((item) => {
    const rawLat = Number(item.latitude);
    const rawLng = Number(item.longitude);
    if (isNaN(rawLat) || isNaN(rawLng) || rawLat === 0 || rawLng === 0) return;

    const key = `${rawLat.toFixed(5)}_${rawLng.toFixed(5)}`;
    const totalAtCoord = coordCountMap[key] || 1;
    let lat = rawLat;
    let lng = rawLng;

    if (totalAtCoord > 1) {
      const idx = coordIndexMap[key] || 0;
      coordIndexMap[key] = idx + 1;
      const angle = (idx / totalAtCoord) * 2 * Math.PI;
      const radius = 0.00035 * Math.sqrt((idx + 1) / totalAtCoord) + 0.00018;
      lat = rawLat + radius * Math.cos(angle);
      lng = rawLng + (radius * Math.sin(angle)) / Math.cos((rawLat * Math.PI) / 180);
    }

    dispersed.push({ item, lat, lng });
  });

  return dispersed;
}

export function resolveMarkerStatus(
  item: PublicGrievanceApplication,
  _filterGroups?: GisGrievanceFilterGroupDto[]
) {
  const dept = item.departmentName || 'General';
  const gtype = item.grievanceType || 'Complaint';
  const status = item.currentStateName || 'Pending';
  const s = status.toLowerCase();

  const isResolved = Boolean(
    item.isResolved ||
    item.isClosed ||
    item.resolvedDate ||
    item.closedDate ||
    s.includes('resolved') ||
    s.includes('closed')
  );

  const isPending = Boolean(
    !isResolved && (
      item.currentStateId === 1 ||
      s === 'pending' ||
      s.includes('register') ||
      s.includes('submit')
    )
  );

  const isInProgress = Boolean(!isResolved && !isPending);

  // Status Color Standard:
  // Pending = Red (#EF4444)
  // In Progress = Yellow (#EAB308)
  // Resolved = Green (#10B981)
  const statusColor = isResolved
    ? '#10B981'
    : isInProgress
    ? '#EAB308'
    : '#EF4444';

  return { dynamicStatusColor: statusColor, statusColor, dept, gtype, status, isResolved };
}

export function buildMarkerTooltipHtml(
  item: PublicGrievanceApplication,
  statusColor: string,
  dept: string,
  gtype: string,
  status: string
): string {
  return `<div class="p-1 text-xs text-slate-800">
    <div class="font-extrabold text-slate-900 text-[12px] tracking-tight leading-snug">${item.grievanceNo || 'Complaint'}</div>
    <div class="text-slate-700 font-semibold text-[11px] mt-0.5">${gtype}</div>
    <div class="text-slate-500 text-[10px] mt-1.5 flex items-center gap-1.5 flex-wrap">
      <span class="font-medium text-slate-700">${dept}</span>
      <span>•</span>
      <span style="color: ${statusColor}; font-weight: 800;" class="uppercase text-[10px]">${status}</span>
    </div>
    ${item.citizenName ? `<div class="text-slate-600 text-[10px] mt-1 flex items-center gap-1 font-medium"><span>👤</span><span>${item.citizenName}</span></div>` : ''}
    <div class="text-blue-600 text-[10px] mt-2 font-bold flex items-center gap-1">👉 Click to view details</div>
  </div>`;
}
