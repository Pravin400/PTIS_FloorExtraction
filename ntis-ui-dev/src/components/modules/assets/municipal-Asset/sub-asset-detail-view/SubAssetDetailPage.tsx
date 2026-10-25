import React from 'react';
import { useTranslations } from 'next-intl';
import type { SubAssetDetailPageProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import { SubAssetHeaderSection } from './SubAssetHeaderSection';
import { RevenueCollectionSection } from './RevenueCollectionSection';
import { SubAssetBasicDetailsSection } from './SubAssetBasicDetailsSection';
import { LeaseRentDetailsSection, FinancialDetailsSection } from './LeaseAndFinancialSections';
import { YearWiseRentChartSection } from './YearWiseRentChartSection';
import { FloorWiseValuationSection } from './FloorWiseValuationSection';
import { SubAssetDocumentsSection } from './SubAssetDocumentsSection';
import { SubAssetMaintenanceSection, SubAssetEncroachmentSection } from './SubAssetStatusSections';
import { QuickActionsSection } from './QuickActionsSection';
import { SubAssetPhotosSection, UnitFloorPlanSection, SubAssetGisSection } from './SubAssetRightColumnSections';

export function SubAssetDetailPage({ apiData, subAssetIdNum }: SubAssetDetailPageProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');
  if (!apiData) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-50 p-8 text-slate-500">
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold mb-2">{t('dataUnavailable') || 'Data Unavailable'}</span>
          <span className="text-sm">{t('dataLoadError') || 'We could not load the details for this sub-asset.'}</span>
        </div>
      </div>
    );
  }

  const data = apiData;

  return (
    <div className="flex flex-col gap-1 px-2 pb-2 -mt-1 bg-slate-50 h-full">
      {/* Header */}
      <SubAssetHeaderSection data={data} />

      {/* Main 3/4 + 1/4 layout */}
      <div className="grid grid-cols-4 gap-1 items-start w-full">
        {/* Left column */}
        <div className="col-span-3 min-w-0 grid grid-cols-12 gap-1">
          {/* Revenue & Collection Strip */}
          <div className="col-span-12">
            <RevenueCollectionSection data={data} />
          </div>

          {/* Row 1: Basic Details (3), Lease (3), Financial (3), Rent Chart (3) */}
          <div className="col-span-3"><SubAssetBasicDetailsSection data={data} /></div>
          <div className="col-span-3"><LeaseRentDetailsSection data={data} /></div>
          <div className="col-span-3"><FinancialDetailsSection data={data} /></div>
          <div className="col-span-3"><YearWiseRentChartSection data={data} /></div>

          {/* Row 3: Floor-wise Valuation Table (12) */}
          <div className="col-span-12"><FloorWiseValuationSection data={data} /></div>

          {/* Row 5: Documents (5), Maintenance (3.5), Encroachment (3.5) */}
          <div className="col-span-5"><SubAssetDocumentsSection data={data} /></div>
          <div className="col-span-4"><SubAssetMaintenanceSection data={data} /></div>
          <div className="col-span-3"><SubAssetEncroachmentSection data={data} /></div>

          {/* Row 6: Quick Actions */}
          <div className="col-span-12"><QuickActionsSection subAssetId={subAssetIdNum ?? 0} rentFrequency={data.rentFrequency} /></div>
        </div>

        {/* Right column */}
        <div className="col-span-1 min-w-0 flex flex-col gap-1 sticky top-4">
          <SubAssetPhotosSection data={data} />
          <UnitFloorPlanSection data={data} />
          <SubAssetGisSection data={data} />
        </div>
      </div>
    </div>
  );
}

