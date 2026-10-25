/**
 * GIS Property Tax Dashboard - Final Coordinator
 * Standard: Clean Architecture - Standardized Module
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AssetGisDashboardLayout } from './layout/AssetGisDashboardLayout';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { logoutAction } from '@/app/[locale]/login/actions';
import { clearAllAuthClientStorage } from '@/lib/utils/legacy-auth-storage';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import { useAssetGisSync } from '@/hooks/asset-gis/useAssetGisSync';
import type { AssetGisDashboardProps, GisPropertyDetail } from '@/types/asset-gis.types';

export type { AssetGisDashboardProps };

export function AssetGisDashboard({ initialData }: AssetGisDashboardProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const assetIdQuery = searchParams.get('assetId');

  const [sidebarTab, setSidebarTab] = useState<'filters' | 'layers'>('filters');
  const [isSwitchingModule, setIsSwitchingModule] = useState(false);
  const showLoadingIndicator = isSwitchingModule;
  const activeModule = useCouncilBoundaryStore((s) => s.activeModule);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const selectedZone = useCouncilBoundaryStore(s => s.selectedZone);
  const selectedWard = useCouncilBoundaryStore(s => s.selectedWard);
  const selectedBlock = useCouncilBoundaryStore(s => s.selectedBlock);
  const filters = useCouncilBoundaryStore(s => s.filters);
  const activeKpiFilter = useCouncilBoundaryStore(s => s.activeKpiCode);
  const assessmentSubCategory = useCouncilBoundaryStore(s => s.assessmentSubCategory);
  const documentSubmittedStatus = useCouncilBoundaryStore(s => s.documentSubmittedStatus);
  const taxStatus = useCouncilBoundaryStore(s => s.taxStatus);
  const storeKpiSummary = useCouncilBoundaryStore(s => s.kpiSummary);

  const hydrateFromSSR = useCouncilBoundaryStore(s => s.hydrateFromSSR);
  const loadAllGeoJsonLayers = useCouncilBoundaryStore(s => s.loadAllGeoJsonLayers);
  const selectedProperty = useCouncilBoundaryStore(s => s.selectedProperty) as (GisPropertyDetail & Record<string, unknown>) | null;
  const propertyDetail = useCouncilBoundaryStore(s => s.propertyDetail) as (GisPropertyDetail & Record<string, unknown>) | null;
  const setSelectedProperty = useCouncilBoundaryStore(s => s.setSelectedProperty);
  const setSelectedPropertyWithSource = useCouncilBoundaryStore(s => s.setSelectedPropertyWithSource);
  const setActiveKpiFilter = useCouncilBoundaryStore(s => s.setActiveKpiCode);
  const fetchError = ((useCouncilBoundaryStore(s => s) as unknown as Record<string, unknown>).fetchError as string | null) ?? null;

  const {
    tenantIds,
    currentTenantIdx,
    setCurrentTenantIdx,
    imageModalUrl,
    setImageModalUrl,
    carouselIndex,
    setCarouselIndex,
    failedImages,
    setFailedImages,
    realAssetPhotos,
    isLoadingRealPhotos,
    realAssetDocuments,
    isLoadingRealDocuments,
    hasRealAssetData,
    childAssets,
    isLoadingChildAssets,
    childAssetPhotoMap,
    childCarouselOverride,
    handleOpenChildImageModal,
    handleCloseImageModal,
  } = useAssetGisSync(initialData, assetIdQuery);

  const user = { username: 'Admin' };

  const storeLogout = async () => {
    useCouncilBoundaryStore.getState().logout();
    clearAllAuthClientStorage();
    await logoutAction(locale);
  };

  const dashboardFilters = useMemo(() => {
    const bId = (selectedBlock && selectedBlock.length > 0 && selectedBlock[0] !== 'all') ? selectedBlock.join(',') : undefined;
    const wNo = (selectedWard && selectedWard.length > 0 && selectedWard[0] !== 'all') ? selectedWard.join(',') : undefined;
    const tStatus = (taxStatus && taxStatus.length > 0 && taxStatus[0].toLowerCase() !== 'all') ? taxStatus[0] : undefined;

    return {
      category: filters.category || 'all',
      propertyTypeGroup: filters.propertyTypeGroup || undefined,
      zoneId: (selectedZone === 'all' || !selectedZone) ? undefined : selectedZone,
      wardNo: wNo,
      blockId: bId,
      propertyTypeId: filters.PropertyTypeID,
      PropertyTypeID: filters.PropertyTypeID,
      AssetTypeId: filters.PropertyTypeID,
      statusType: ((assessmentSubCategory && assessmentSubCategory !== 'all') || (documentSubmittedStatus && documentSubmittedStatus !== 'all'))
        ? undefined
        : (filters.statusType || activeKpiFilter || 'ALL'),
      searchTerm: filters.searchTerm || undefined,
      assessmentSubCategory: (!assessmentSubCategory || assessmentSubCategory === 'all') ? undefined : assessmentSubCategory,
      documentSubmittedStatus: (!documentSubmittedStatus || documentSubmittedStatus === 'all') ? undefined : documentSubmittedStatus,
      taxStatus: tStatus,
    };
  }, [filters.category, filters.propertyTypeGroup, filters.PropertyTypeID, filters.statusType, filters.searchTerm, selectedZone, selectedWard, selectedBlock, activeKpiFilter, assessmentSubCategory, documentSubmittedStatus, taxStatus]);

  useEffect(() => {
    const rawInit = (initialData?.initData ?? initialData) as Record<string, unknown> | undefined;
    if (rawInit && (rawInit.ssrSuccess || rawInit.success)) {
      hydrateFromSSR(rawInit);
    }
    loadAllGeoJsonLayers();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [hydrateFromSSR, initialData, loadAllGeoJsonLayers]);

  const prevModuleRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevModuleRef.current === null) {
      prevModuleRef.current = activeModule;
      return;
    }
    if (prevModuleRef.current !== activeModule) {
      prevModuleRef.current = activeModule;
      setIsSwitchingModule(true);
      setSelectedProperty(null);
      const timer = setTimeout(() => {
        setIsSwitchingModule(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeModule, setSelectedProperty]);

  const getImageProxyUrl = (path?: string) => {
    if (!path) return null;
    const cleanPath = String(path).trim();
    if (cleanPath === '' || cleanPath.toLowerCase() === 'null' || cleanPath.toLowerCase() === 'undefined') return null;

    if (
      cleanPath.startsWith('http://') ||
      cleanPath.startsWith('https://') ||
      cleanPath.startsWith('data:') ||
      cleanPath.startsWith('blob:') ||
      cleanPath.startsWith('/api/') ||
      cleanPath.startsWith('/')
    ) {
      return cleanPath;
    }

    return getViewDocumentUrl(cleanPath);
  };

  const carouselImages = useMemo(() => {
    const data = (propertyDetail || selectedProperty) as Record<string, unknown> | null;
    if (!data) return [];

    const isAsset = activeModule === 'ASSET';

    if (isAsset && hasRealAssetData && realAssetPhotos.length > 0) {
      return realAssetPhotos.map((p) => ({ url: p.url, label: p.label }));
    }

    const assetNo = data.assetNo || data.AssetNo || data.MPMS_ID || data.mpmsId || data.OwnerID || data.ownerID || data.ownerId || data.BuildingID || data.buildingID;
    const fallbackUrl = assetNo && String(assetNo).trim() !== '' && String(assetNo) !== 'N/A' ? `/api/documents/${String(assetNo).trim()}` : undefined;

    const photoA = data.PhotoA || data.photoA || data.Photo || data.photo || data.PhotoUrl || data.photoUrl || data.ASS_BuildingImageA || data.assBuildingImageA || data.photo_a || fallbackUrl;
    const photoB = data.PhotoB || data.photoB || data.ASS_BuildingImageB || data.assBuildingImageB || data.photo_b || data.dataB || data.data_b;
    const photoC = data.PhotoC || data.photoC || data.dataC || data.photo_c;
    const photoD = data.PhotoD || data.photoD || data.dataD || data.photo_d;
    const planUrl = data.PlanUrl || data.planUrl || data.PhotoPlan || data.photoPlan || data.plan || data.dataPlan || data.dataSLR;
    const signImage = data.SignImage || data.signImage || data.Sign || data.sign;

    const list = isAsset ? [
      { url: photoA, label: 'Asset Photo' },
      { url: planUrl, label: 'Asset Photo Plan' },
      { url: photoB, label: 'Asset Photo B' },
      { url: photoC, label: 'Asset Photo C' },
      { url: photoD, label: 'Asset Photo D' },
    ] : [
      { url: photoA, label: 'Property Photo' },
      { url: planUrl, label: 'House Plan' },
      { url: signImage, label: 'Signature' },
      { url: photoB, label: 'Property Photo B' }
    ];

    const isValidUrl = (url: unknown) => {
      if (!url) return false;
      const str = String(url).trim().toLowerCase();
      return str !== '' && str !== 'null' && str !== 'undefined' && str !== 'not_found';
    };

    const filtered = list.filter(f => isValidUrl(f.url));
    if (filtered.length === 0) {
      return [{ url: 'NOT_FOUND', label: 'Image Not Available' }];
    }

    return filtered.map(f => ({
      url: getImageProxyUrl(String(f.url)) || 'NOT_FOUND',
      label: f.label
    }));
  }, [selectedProperty, propertyDetail, activeModule, hasRealAssetData, realAssetPhotos]);

  const effectiveCarouselImages = childCarouselOverride ?? carouselImages;

  const handleOpenImageModal = (url: string | null) => {
    setImageModalUrl(url);
    if (url) {
      let idx = carouselImages.findIndex(img => img.url === url);
      if ((idx < 0 || failedImages[url]) && carouselImages.length > 0) {
        const firstValidIdx = carouselImages.findIndex(img => img.url && img.url !== 'NOT_FOUND' && !failedImages[img.url]);
        if (firstValidIdx >= 0) idx = firstValidIdx;
      }
      setCarouselIndex(idx >= 0 ? idx : 0);
    }
  };

  const handleSelectChildAsset = (assetIdOrNo: number | string) => {
    const clean = typeof assetIdOrNo === 'string' ? assetIdOrNo.trim() : String(assetIdOrNo);
    if (!clean) return;
    const numericId = Number(clean);
    const currentProp = selectedProperty || propertyDetail;
    const parentId = currentProp?.parentAssetId || currentProp?.assetId || currentProp?.id;
    const parentName = currentProp?.parentAssetName || currentProp?.assetName || currentProp?.assetRegionalName;
    const parentNo = currentProp?.parentAssetNo || currentProp?.assetNo;
    const parentLat = currentProp?.parentLatitude || currentProp?.latitude || currentProp?.centroidY || currentProp?.ASS_Latitude;
    const parentLng = currentProp?.parentLongitude || currentProp?.longitude || currentProp?.centroidX || currentProp?.ASS_Longitude;
    const parentAddr = currentProp?.parentAddress || currentProp?.address;
    const parentPlot = currentProp?.parentPlotNo || currentProp?.plotNo;
    const parentCsn = currentProp?.parentCitySurveyNo || currentProp?.citySurveyNo;
    const parentArea = currentProp?.parentPlotArea || currentProp?.plotAreaSqFt || currentProp?.totalAreaSqFeet;

    const matchingUnit = (childAssets || []).find((u: Record<string, unknown>) =>
      String(u.assetId || u.id || u.AssetId) === String(clean) ||
      String(u.assetNo || u.mpmsNo || u.unitNo || u.code || '').trim().toLowerCase() === clean.toLowerCase()
    );

    const payload = {
      id: Number.isFinite(numericId) && numericId > 0 ? numericId : clean,
      assetId: Number.isFinite(numericId) && numericId > 0 ? numericId : clean,
      assetNo: clean,
      mpmsId: clean,
      OwnerID: clean,
      ownerID: clean,
      MPMS_ID: clean,
      assetName: matchingUnit?.assetName || matchingUnit?.name || matchingUnit?.subUnitName || undefined,
      tenantName: matchingUnit?.tenantName || matchingUnit?.inChargeName || undefined,
      monthlyRent: matchingUnit?.monthlyRent || matchingUnit?.rentAmount || undefined,
      formattedMonthlyRent: matchingUnit?.formattedMonthlyRent || undefined,
      capitalValue: matchingUnit?.capitalValue ?? matchingUnit?.currentMarketValue ?? undefined,
      annualRevenue: matchingUnit?.annualRevenue ?? (matchingUnit?.monthlyRent ? Number(matchingUnit.monthlyRent) * 12 : undefined),
      parentAssetId: parentId,
      parentAssetName: parentName,
      parentAssetNo: parentNo,
      parentLatitude: parentLat,
      parentLongitude: parentLng,
      parentAddress: parentAddr,
      parentPlotNo: parentPlot,
      parentCitySurveyNo: parentCsn,
      parentPlotArea: parentArea,
      latitude: parentLat,
      longitude: parentLng,
      centroidY: parentLat,
      centroidX: parentLng,
      address: parentAddr,
      plotNo: parentPlot,
      citySurveyNo: parentCsn,
      geometry: currentProp?.geometry || currentProp?.Geometry,
      geoJson: currentProp?.geoJson,
      childAssets: (childAssets && childAssets.length > 0) ? childAssets : (currentProp?.childAssets || currentProp?.childShops || currentProp?.childUnits),
      childShops: (childAssets && childAssets.length > 0) ? childAssets : (currentProp?.childShops || currentProp?.childAssets),
      childUnits: (childAssets && childAssets.length > 0) ? childAssets : (currentProp?.childUnits || currentProp?.childAssets),
      isChildSwitch: true,
    };
    useCouncilBoundaryStore.setState({ polygonReady: true });
    setSelectedPropertyWithSource(payload, 'search');
  };

  const handleClosePanel = () => {
    setSelectedProperty(null);
    handleCloseImageModal();
  };

  return (
    <AssetGisDashboardLayout
      ulbData={initialData?.ulbData}
      user={user}
      logout={storeLogout}
      toggleFullscreen={() => isFullscreen ? document.exitFullscreen() : document.documentElement.requestFullscreen()}
      isFullscreen={isFullscreen}
      showSidebar={showSidebar}
      setShowSidebar={setShowSidebar}
      sidebarProps={{
        sidebarTab,
        setSidebarTab,
        theme: { primary: '#1D4ED8' },
        setShowSidebar,
        activeDropdown,
        setActiveDropdown,
        allWardSummaries: [],
        dashboardFilters,
        isLoading: false
      }}
      kpis={[]}
      activeKpiFilter={activeKpiFilter}
      setActiveKpiFilter={setActiveKpiFilter}
      kpiSummary={storeKpiSummary}
      fetchError={fetchError}
      showLoadingIndicator={showLoadingIndicator}
      selectedProperty={selectedProperty}
      propertyDetail={propertyDetail}
      onClosePanel={handleClosePanel}
      tenantIds={tenantIds}
      currentTenantIdx={currentTenantIdx}
      setCurrentTenantIdx={setCurrentTenantIdx}
      getImageProxyUrl={getImageProxyUrl}
      imageModalUrl={imageModalUrl}
      setImageModalUrl={handleOpenImageModal}
      carouselImages={effectiveCarouselImages}
      carouselIndex={carouselIndex}
      setCarouselIndex={setCarouselIndex}
      failedImages={failedImages}
      setFailedImages={setFailedImages}
      realAssetPhotos={realAssetPhotos}
      isLoadingRealPhotos={isLoadingRealPhotos}
      hasRealAssetData={hasRealAssetData}
      realAssetDocuments={realAssetDocuments}
      isLoadingRealDocuments={isLoadingRealDocuments}
      childAssets={childAssets}
      isLoadingChildAssets={isLoadingChildAssets}
      childAssetPhotoMap={childAssetPhotoMap}
      onOpenChildImageModal={handleOpenChildImageModal}
      onSelectChildAsset={handleSelectChildAsset}
    />
  );
}
