'use client';

import { ICONS } from '@/lib/utils/asset-utils/asset-dashboard-helpers';
import type { AssetMasterDashboardProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import { useTranslations } from 'next-intl';
import { DashboardMap } from './DashboardMap';
import { EncroachmentModal } from './DashboardModals';
import { DashboardStats as StatsSection } from './DashboardStats';
import { DashboardLayout } from '../DashboardLayout';
import { DashboardFilters } from '../DashboardFilter';
import { useAssetMasterDashboard } from '@/hooks/assets/dashboard/master-dashboard/useAssetMasterDashboard';
import { useCallback } from 'react';

export function AssetMasterDashboard({ initialData, selectedDistrict }: AssetMasterDashboardProps) {
  const t = useTranslations('assetmasterdashboard');

  const {
    data, loading, activeZone, activeWard,
    zonesList, wardsList, visibleAssets, encroached,
    selectedAsset, setSelectedAsset, catFilters, setCatFilters,
    showEncroachment, setShowEncroachment,
    handleZoneChange, handleWardChange, handleStatsCategoryClick
  } = useAssetMasterDashboard(initialData);

  const handleMapCategoryClick = useCallback((cats: string[]) => {
    setCatFilters(cats);
    setSelectedAsset(null);
  }, [setCatFilters, setSelectedAsset]);

  return (
    <DashboardLayout
      loading={loading}
      filters={
        <DashboardFilters
          zonesList={zonesList}
          wardsList={wardsList}
          activeZone={activeZone}
          activeWard={activeWard}
          onZoneChange={handleZoneChange}
          onWardChange={handleWardChange}
          allZonesLabel={t('allZones')}
          allWardsLabel={t('allWards')}
          filtersLabel={t('filters')}
        />
      }
    >
      <StatsSection
        stats={data.stats}
        icons={ICONS}
        onCategoryClick={handleStatsCategoryClick}
      />

      <DashboardMap
        categories={data.categories}
        assets={visibleAssets}
        selectedAsset={selectedAsset}
        selectedDistrict={selectedDistrict}
        onCategoryClick={handleMapCategoryClick}
        onAssetClick={setSelectedAsset}
        activeFilters={catFilters}
        fetchedTypes={data.fetchedTypes}
        fetchedAssets={data.fetchedAssets}
      />

      {showEncroachment && (
        <EncroachmentModal assets={encroached} onClose={() => setShowEncroachment(false)} />
      )}
    </DashboardLayout>
  );
}
