import { useMemo } from 'react';
import { Building2, Trees, Activity, Box, TrendingUp } from 'lucide-react';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';

const formatNum = (num?: number) => (num || 0).toLocaleString('en-IN');
const formatCurrency = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined) return '₹0';
  if (typeof val === 'string' && val.trim().startsWith('₹')) return val.trim();
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Computes the 6 top-bar KPI cards from the backend kpiSummary stored in
 * useCouncilBoundaryStore. Falls back to local GeoJSON counting only when
 * the backend data hasn't arrived yet.
 */
export function useAssetGisDashboardKpis() {
  // Primary: backend API data hydrated into store
  const storeKpiSummary = useCouncilBoundaryStore((s) => s.kpiSummary) as Record<string, unknown> | null;

  // Fallback: local GeoJSON feature counting (used until API responds)
  const selectedZone = useCouncilBoundaryStore((s) => s.selectedZone);
  const selectedWard = useCouncilBoundaryStore((s) => s.selectedWard);
  const geoJsonLayers = useCouncilBoundaryStore((s) => s.geoJsonLayers) as Record<string, unknown> | undefined;

  const mpmsFeatures = useMemo(() => {
    const mpms = geoJsonLayers?.mpms as { features?: Array<{ properties?: Record<string, unknown> }> } | undefined;
    return mpms?.features || [];
  }, [geoJsonLayers]);

  const zoneId = (selectedZone && selectedZone !== 'all') ? String(selectedZone) : undefined;
  const wardId = (Array.isArray(selectedWard) && selectedWard.length > 0 && selectedWard[0] !== 'all')
    ? String(selectedWard[0])
    : (!Array.isArray(selectedWard) && selectedWard && selectedWard !== 'all')
      ? String(selectedWard)
      : undefined;

  const localData = useMemo(() => {
    if (!mpmsFeatures.length) return { totalAssets: 0, buildingCount: 0, landCount: 0, infrastructureCount: 0, movableCount: 0 };
    let buildingCount = 0, landCount = 0, infrastructureCount = 0, movableCount = 0, totalAssets = 0;

    mpmsFeatures.forEach((feature) => {
      const props = feature.properties || {};
      if (zoneId && String(props.ZONE_NO || props.Zone || '').trim() !== zoneId) return;
      if (wardId && String(props.WARD_NO || props.Ward || '').trim() !== wardId) return;

      const cate = String(props.MPMS__CATE || props.PropertyDe || '');
      if (cate.includes('जागा') || cate.includes('बगिचे') || cate.includes('उद्यान')) { landCount++; }
      else if (cate.includes('कार्यालये') || cate.includes('इमारती') || cate.includes('शाळा') || cate.includes('दवाखाने') || cate.includes('मंदिर') || cate.includes('प्रार्थनास्थळ')) { buildingCount++; }
      else if (cate.includes('स्मारक') || cate.includes('पुतळे')) { movableCount++; }
      else { infrastructureCount++; }
      totalAssets++;
    });
    return { totalAssets, buildingCount, landCount, infrastructureCount, movableCount };
  }, [mpmsFeatures, zoneId, wardId]);

  // Resolve values: backend KPI takes priority; fallback to local GeoJSON counts
  const kpiRaw = storeKpiSummary;
  const kpi = (kpiRaw && typeof kpiRaw === 'object' && 'data' in kpiRaw && kpiRaw.data ? kpiRaw.data : kpiRaw) as Record<string, unknown> | null;
  const totalAssets = Number(kpi?.totalCount ?? kpi?.TotalCount ?? localData.totalAssets);
  const buildingCount = Number(kpi?.totalBuildingCount ?? kpi?.TotalBuildingCount ?? localData.buildingCount);
  const landCount = Number(kpi?.assessedCount ?? kpi?.AssessedCount ?? localData.landCount);   // best proxy for land is location-assessed
  const infraCount = Number(kpi?.internalSurveyCount ?? kpi?.InternalSurveyCount ?? localData.infrastructureCount);
  const movableCount = localData.movableCount;
  const valuation = (kpi?.assetValuation ?? kpi?.AssetValuation ?? kpi?.totalValuation ?? kpi?.TotalValuation ?? kpi?.valuation ?? kpi?.Valuation ?? kpi?.totalAssetValuation ?? kpi?.TotalAssetValuation ?? 0) as number | string;

  return useMemo(() => [
    {
      id: 'TOTAL_ASSETS',
      label: 'Total Assets',
      value: formatNum(totalAssets),
      color: { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', text: '#0369a1', accent: '#0284c7', iconBg: 'rgba(255, 255, 255, 0.4)' },
      icon: Building2
    },
    {
      id: 'BUILDING_ASSETS',
      label: 'Building Assets',
      value: formatNum(buildingCount),
      color: { bg: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)', text: '#0f766e', accent: '#0d9488', iconBg: 'rgba(255, 255, 255, 0.4)' },
      icon: Building2
    },
    {
      id: 'LAND_ASSETS',
      label: 'Land Assets',
      value: formatNum(landCount),
      color: { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', text: '#047857', accent: '#059669', iconBg: 'rgba(255, 255, 255, 0.4)' },
      icon: Trees
    },
    {
      id: 'INFRASTRUCTURE_ASSET',
      label: 'Infrastructure Assets',
      value: formatNum(infraCount),
      color: { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', text: '#c2410c', accent: '#ea580c', iconBg: 'rgba(255, 255, 255, 0.4)' },
      icon: Activity
    },
    {
      id: 'MOVABLE_ASSETS',
      label: 'Movable Assets',
      value: formatNum(movableCount),
      color: { bg: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)', text: '#a16207', accent: '#ca8a04', iconBg: 'rgba(255, 255, 255, 0.4)' },
      icon: Box
    },
    {
      id: 'ASSET_VALUATION',
      label: 'Asset Valuation',
      value: formatCurrency(valuation),
      color: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', text: '#b91c1c', accent: '#dc2626', iconBg: 'rgba(255, 255, 255, 0.4)' },
      icon: TrendingUp
    }
  ], [totalAssets, buildingCount, landCount, infraCount, movableCount, valuation]);
}
