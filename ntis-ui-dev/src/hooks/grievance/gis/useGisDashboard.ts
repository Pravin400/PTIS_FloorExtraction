import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchGrievanceGisKpisAction,
  fetchGrievanceGisFiltersAction,
  fetchGrievanceGisPopupDetailsAction,
  fetchGrievanceGisConfigAction,
  fetchGrievanceGisLayersAction,
} from '@/lib/actions/grievance/gis/grievance-gis.actions';
import { fetchPublicGrievancesAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { useAuth } from '@/hooks/grievance/shared';
import { filterGrievances } from '@/lib/utils/grievance/gis/gis-marker-utils';
import type {
  GisGrievanceKpiSummaryResponseDto,
  GisGrievanceFilterGroupDto,
  GisGrievancePopupDetailsDto,
  GisGrievanceQueryParameters,
  GisCorporationConfigDto,
  GisLayerItemDto,
} from '@/types/grievance/grievance-gis.types';
import type { PublicGrievanceApplication } from '@/types/grievance/public-dashboard.types';

export function useGisDashboard() {
  const { user, isAuthenticated } = useAuth();
  const isCitizen = isAuthenticated && user?.role === 'CITIZEN';
  const citizenMobile = user?.mobile || user?.phone;

  const [activeFilters, setActiveFilters] = useState<GisGrievanceQueryParameters>({});
  const [filterGroups, setFilterGroups] = useState<GisGrievanceFilterGroupDto[]>([]);
  const [kpiSummary, setKpiSummary] = useState<GisGrievanceKpiSummaryResponseDto | null>(null);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<number | undefined>(undefined);
  const [popupDetails, setPopupDetails] = useState<GisGrievancePopupDetailsDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [corpConfig, setCorpConfig] = useState<GisCorporationConfigDto | null>(null);
  const [gisLayers, setGisLayers] = useState<GisLayerItemDto[]>([]);
  const [allPublicGrievances, setAllPublicGrievances] = useState<PublicGrievanceApplication[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    fetchGrievanceGisConfigAction().then((res) => {
      if (!isCancelled && res.success && res.data) setCorpConfig(res.data);
    });
    fetchGrievanceGisLayersAction().then((res) => {
      if (!isCancelled && res.success && Array.isArray(res.data)) setGisLayers(res.data);
    });
    fetchPublicGrievancesAction().then((res) => {
      if (!isCancelled && res.success && Array.isArray(res.data)) setAllPublicGrievances(res.data);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter complaints based on user role: Citizens see only their own complaints
  const displayedGrievances = useMemo(() => {
    if (!isCitizen) return allPublicGrievances;
    const cleanMobile = citizenMobile ? citizenMobile.replace(/\D/g, '').slice(-4) : '';
    return allPublicGrievances.filter((g) => {
      if (user?.id && g.citizenId && String(g.citizenId) === String(user.id)) return true;
      if (cleanMobile && g.maskedMobileNo && g.maskedMobileNo.endsWith(cleanMobile)) return true;
      if (user?.name && g.citizenName && g.citizenName.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
      return false;
    });
  }, [isCitizen, citizenMobile, user, allPublicGrievances]);

  useEffect(() => {
    let isCancelled = false;
    fetchGrievanceGisFiltersAction(activeFilters.zoneId, activeFilters.grievanceDepartmentId).then((res) => {
      if (!isCancelled && res.success && Array.isArray(res.data)) setFilterGroups(res.data);
    });
    return () => {
      isCancelled = true;
    };
  }, [activeFilters.zoneId, activeFilters.grievanceDepartmentId]);

  useEffect(() => {
    let isCancelled = false;
    const { kpiCode: _ignored, ...filterContext } = activeFilters;
    fetchGrievanceGisKpisAction(filterContext).then((res) => {
      if (!isCancelled) {
        if (res.success && res.data) {
          setKpiSummary(res.data);
        }
        setIsKpiLoading(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [activeFilters]);

  // Compute personal KPIs for Citizen using DB card templates or return city-wide KPIs for Admin
  const effectiveKpiSummary = useMemo(() => {
    if (!isCitizen || !kpiSummary) return kpiSummary;

    // Apply active spatial and attribute filters (excluding kpiCode itself) to citizen's complaints
    const { kpiCode: _ignored, ...filterContext } = activeFilters;
    const contextualGrievances = filterGrievances(displayedGrievances, filterContext);
    const total = contextualGrievances.length;

    const cards = kpiSummary.cards.map((card) => {
      const code = card.kpiCode.toUpperCase();
      let count = 0;
      if (code.includes('TOTAL')) {
        count = total;
      } else if (code.includes('PENDING')) {
        count = contextualGrievances.filter((it) => {
          const s = String(it.currentStateName || '').toLowerCase();
          return !it.isResolved && !it.isClosed && (it.currentStateId === 1 || s.includes('pending') || s.includes('register') || s.includes('submit'));
        }).length;
      } else if (code.includes('PROGRESS')) {
        count = contextualGrievances.filter((it) => {
          const s = String(it.currentStateName || '').toLowerCase();
          return !it.isResolved && !it.isClosed && (it.currentStateId === 2 || it.currentStateId === 3 || s.includes('progress') || s.includes('review') || s.includes('assigned'));
        }).length;
      } else if (code.includes('RESOLV')) {
        count = contextualGrievances.filter((it) => {
          const s = String(it.currentStateName || '').toLowerCase();
          return Boolean(it.isResolved || it.isClosed || s.includes('resolved') || s.includes('closed'));
        }).length;
      }
      return {
        ...card,
        rawValue: count,
        count,
        formattedValue: count.toLocaleString(),
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        isSelected: activeFilters.kpiCode === card.kpiCode,
      };
    });

    return {
      ...kpiSummary,
      totalGrievances: total,
      cards,
      appliedFilters: activeFilters,
      generatedAtUtc: new Date().toISOString(),
    };
  }, [isCitizen, displayedGrievances, kpiSummary, activeFilters]);

  const handleSelectGrievance = useCallback(async (id: number) => {
    setSelectedGrievanceId(id);
    setIsDrawerOpen(true);
    setIsDetailsLoading(true);
    try {
      const res = await fetchGrievanceGisPopupDetailsAction(id);
      setPopupDetails(res.success && res.data ? res.data : null);
    } finally {
      setIsDetailsLoading(false);
    }
  }, []);

  const handleFilterChange = (
    key: keyof GisGrievanceQueryParameters,
    value: number | string | undefined
  ) => {
    setActiveFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'zoneId') {
        next.wardId = undefined;
      }
      return next;
    });
  };

  const handleSelectKpi = (kpiCode?: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      kpiCode: prev.kpiCode === kpiCode ? undefined : kpiCode,
    }));
  };

  const handleResetFilters = () => setActiveFilters({});

  const handleExportExcel = () => {
    setIsExporting(true);
    const searchParams = new URLSearchParams();
    Object.entries(activeFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString();
    const downloadUrl = `/api/gis/grievance/export-excel${qs ? `?${qs}` : ''}`;
    window.open(downloadUrl, '_blank');
    setTimeout(() => setIsExporting(false), 2000);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedGrievanceId(undefined);
  };

  return {
    activeFilters,
    filterGroups,
    kpiSummary: effectiveKpiSummary,
    isKpiLoading,
    selectedGrievanceId,
    popupDetails,
    isDrawerOpen,
    isDetailsLoading,
    corpConfig,
    gisLayers,
    publicGrievances: displayedGrievances,
    isCitizen,
    isExporting,
    handleSelectGrievance,
    handleFilterChange,
    handleSelectKpi,
    handleResetFilters,
    handleExportExcel,
    closeDrawer,
  };
}
