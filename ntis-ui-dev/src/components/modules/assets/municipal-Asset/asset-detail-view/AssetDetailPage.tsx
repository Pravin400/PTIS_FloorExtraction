import type { AssetDetailPageProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import type { AssetDetailData } from '@/types/asset/municipal-Asset/asset-detail.types';
import { getTranslations } from 'next-intl/server';
import { AssetHeaderSection } from './AssetHeaderSection';
import { BasicOwnershipSection } from './BasicOwnershipSection';
import { AreaStructureSection } from './AreaStructureSection';
import { InchargeAndUsageSection } from './InchargeAndUsageSection';
import { LeaseRentSection } from './LeaseRentSection';
import { RevenueSummarySection } from './RevenueSummarySection';
import { InventorySummarySection } from './InventorySummarySection';
import { AdditionalDetailsSection } from './AdditionalDetailsSection';
import { DocumentsSection } from './DocumentsSection';
import { MaintenanceSection } from './MaintenanceSection';
import { EncroachmentLegalSection } from './EncroachmentLegalSection';
import { AssetPhotosSection } from './AssetPhotosSection';
import { AssetPhotoPlanSection } from './AssetPhotoPlanSection';
import { GisLocationSection } from './AssetGisLocation';
import { UnitSummarySection } from './AssetUnitSummary';
import { AssetFloorSubmissionSection } from './AssetFloorSubmissionSection';
import { BottomActionBar } from './BottomActionBar';

/**
 * Top-level server orchestrator for the asset detail new page.
 */
export async function AssetDetailPage({ apiData, locale }: AssetDetailPageProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });

  if (!apiData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold mb-2">{t('dataUnavailable')}</span>
          <span className="text-sm">{t('cannotLoadDetails')}</span>
        </div>
      </div>
    );
  }

  const data = {
    ...(apiData.basicDetails || {}),
    floorSubmissions: apiData.floorSubmissions || [],
    shopUnits: apiData.shopUnits || [],
    totalShops: (apiData.shopUnits || []).length,
    detailedInventoryItems: apiData.inventory?.detailedInventoryItems || [],
    inventoryItems: apiData.inventory?.inventoryItems || [],
  } as AssetDetailData;

  return (
    <div className="flex flex-col gap-1.5 px-2 pb-2 pt-0 -mt-2 bg-slate-50 h-full">
      {/* Header */}
      <AssetHeaderSection data={data} />

      {/* Main content: left info grid + right media column */}
      <div className="grid grid-cols-4 gap-2 items-start w-full">
        {/* Left column � info sections in 12-column grid */}
        <div className="col-span-3 min-w-0 grid grid-cols-12 gap-2 mb-2">
          {/* Row 1: 4 equal columns (each 3/12) */}
          <div className="col-span-3"><BasicOwnershipSection data={data} locale={locale} /></div>
          <div className="col-span-3"><InchargeAndUsageSection data={data} locale={locale} /></div>
          <div className="col-span-3"><AreaStructureSection data={data} locale={locale} /></div>
          <div className="col-span-3"><LeaseRentSection data={data} locale={locale} /></div>

          {/* Row 2: Revenue (4/12), Inventory (5/12), Additional (3/12) */}
          <div className="col-span-4">
            <RevenueSummarySection data={data} locale={locale} />
          </div>
          <div className="col-span-5">
            <InventorySummarySection data={data} />
          </div>
          <div className="col-span-3">
            <AdditionalDetailsSection data={data} />
          </div>

          {/* Row 3: Unit/Sub-Asset Summary Table OR Floor Submission (12/12) */}
          <div className="col-span-12">
            {data.isSubUnit ? (
              <UnitSummarySection data={data} />
            ) : (
              <AssetFloorSubmissionSection data={data} />
            )}
          </div>

          {/* Row 4: Documents (6/12), Maintenance (3/12), Encroachment (3/12) */}
          <div className="col-span-6">
            <DocumentsSection data={data} />
          </div>
          <div className="col-span-3">
            <MaintenanceSection data={data} locale={locale} />
          </div>
          <div className="col-span-3">
            <EncroachmentLegalSection data={data} locale={locale} />
          </div>
        </div>

        {/* Right column � photos, approved plan, GIS, and actions */}
        <div className="col-span-1 min-w-0 flex flex-col gap-2 sticky top-4">
          <AssetPhotosSection data={data} />
          <AssetPhotoPlanSection data={data} />
          <GisLocationSection data={data} />
          <BottomActionBar data={data} />
        </div>
      </div>
    </div>
  );
}
