import { Button } from '@/components/common/ActionButton';
import { ValueDisplay } from './components/ValueDisplay';
import FieldShell from '@/components/common/FieldShell';
import { MasterTable, Column } from '@/components/common/MasterTable';
import type {
  OldFloorDetailsData,
  OldDetailsData,
  OldTaxesData,
  MappedPropertyItem,
} from '@/types/ptis.types';
import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OldTaxDetailsTable } from './OldTaxDetailsTable';
import { Tooltip } from '@/components/common/Tooltip';

export interface OldDetailsTabProps {
  showOldFloorInfo: boolean;
  setShowOldFloorInfo: (value: boolean) => void;
  showOldTaxInfo: boolean;
  setShowOldTaxInfo: (value: boolean) => void;
  showOldMapInfo: boolean;
  setShowOldMapInfo: (value: boolean) => void;
  oldFloorTableData: OldFloorDetailsData[];
  oldDetailsData?: OldDetailsData;
  oldTaxesData?: OldTaxesData | null;
  mappedPropertiesData?: MappedPropertyItem[];
}

const OldDetailsTab: React.FC<OldDetailsTabProps> = ({
  showOldFloorInfo,
  setShowOldFloorInfo,
  showOldTaxInfo,
  setShowOldTaxInfo,
  showOldMapInfo,
  setShowOldMapInfo,
  oldFloorTableData,
  oldDetailsData,
  oldTaxesData,
  mappedPropertiesData = [],
}) => {
  const t = useTranslations('ptis');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId') || '';
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'en';

  React.useEffect(() => {
    if (typeof router?.prefetch === 'function') {
      router.prefetch(`/${locale}/property-tax/property-mapping`);
    }
  }, [router, locale]);

  // ✅ Check if we have data in oldDetailsData that should be shown in the table if table is empty
  const tableData = React.useMemo(() => {
    const floors = Array.isArray(oldFloorTableData) ? oldFloorTableData : [];
    if (floors.length > 0) return floors;

    // Fallback to single row from oldDetailsData if available
    if (oldDetailsData?.oldConstructionYear || oldDetailsData?.oldCarpetAreaSqMeter) {
      return [
        {
          wardPropPartNo: '',
          floor: '0',
          subFloor: '',
          assessmentYear: '',
          year: oldDetailsData.oldConstructionYear || '',
          constructionType: oldDetailsData.oldConstructionTypeId || '',
          typeOfUse: oldDetailsData.oldTypeOfUseId || '',
          subType: '',
          carpetArea: `${oldDetailsData.oldCarpetAreaSqFeet || 0} / ${oldDetailsData.oldCarpetAreaSqMeter || 0}`,
          builtupArea: `${oldDetailsData.oldBuiltupAreaSqFeet || 0} / ${oldDetailsData.oldBuiltupAreaSqMeter || 0}`,
        },
      ];
    }
    return [];
  }, [oldFloorTableData, oldDetailsData]);

  // ✅ SOLUTION: Define columns inside component to access handlers via closure
  const oldFloorColumns: Column<Record<string, unknown>>[] = [
    { key: 'wardPropPartNo', label: t('fields.wardPropPartNo') },
    { key: 'floor', label: t('fields.floor') },
    { key: 'subFloor', label: t('fields.subFloor') },
    { key: 'assessmentYear', label: t('fields.assmtYear') },
    { key: 'year', label: t('fields.constYear') },
    { key: 'constructionType', label: t('fields.constType') },
    { key: 'typeOfUse', label: t('fields.typeOfUse') },
    { key: 'subType', label: t('fields.subType') },
    {
      key: 'carpetArea',
      label: t('fields.carpetAreaSqFtMtr'),
    },
    {
      key: 'builtupArea',
      label: t('fields.builtupAreaSqFtMtr'),
    },
  ];

  const oldMapTableData = React.useMemo(() => {
    return (mappedPropertiesData || []).filter(Boolean).map((item) => {
      const oldPropPartNo = `${item.oldPropertyNo || ''}${item.oldPartitionNo ? ` - ${item.oldPartitionNo}` : ''}`;
      const oldWardPropPartNo = [item.oldWardNo, oldPropPartNo].filter(Boolean).join(' - ');
      return {
        ...item,
        oldWardPropPartNo,
      };
    });
  }, [mappedPropertiesData]);

  const oldMapColumns: Column<Record<string, unknown>>[] = [
    { key: 'mappingCategory', label: t('fields.mappingCategory') },
    { key: 'oldZoneNo', label: t('fields.oldZoneName') },
    { key: 'oldWardPropPartNo', label: t('fields.oldWardPropPartNo') },
    { key: 'oldEgovNo', label: t('fields.oldEGovNo') },
    { key: 'oldPlotArea', label: t('fields.oldPlotAreaSqMtr') },
    { key: 'oldPlotNo', label: t('fields.oldPlotNo') },
    { key: 'oldConstructionArea', label: t('fields.oldConstAreaSqMtr') },
    { key: 'oldALV', label: t('fields.oldALV') },
    { key: 'oldRV', label: t('fields.oldRV') },
    { key: 'oldGeneralTax', label: t('fields.oldPropTax') },
    { key: 'oldTotalTax', label: t('fields.oldTotalTax') },
  ];

  return (
    <div className="bg-white rounded p-0.5 shadow-inner">
      <div className="space-y-0.5">
        <div className="w-full">
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-purple-50 rounded p-0.5 shadow-sm">
            {/* Old details fields — same responsive grid as Society/Property/KYC tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-0.5">
              <FieldShell
                id="oldZoneName"
                label={t('fields.oldZoneName')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldZoneName || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldZoneName || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldWardNo"
                label={t('fields.oldWardNo')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-1 2xl:col-span-1"
              >
                <Tooltip content={oldDetailsData?.oldWardNo || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldWardNo || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldPropertyNo"
                label={t('fields.oldPropertyNo')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldPropertyNo || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldPropertyNo || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldPartitionNo"
                label={t('fields.oldPartitionNo')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldPartitionNo || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldPartitionNo || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldEGovNo"
                label={t('fields.oldEGovNo')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldEGovernanceNo || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldEGovernanceNo || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldPlotArea"
                label={t('fields.oldPlotAreaWithUnit')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldPlotArea || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldPlotArea || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldPlotNo"
                label={t('fields.oldPlotNo')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-1 2xl:col-span-1"
              >
                <Tooltip content={oldDetailsData?.oldPlotNo || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldPlotNo || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldConstructionArea"
                label={t('fields.oldConstructionAreaWithUnit')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldConstructionArea || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldConstructionArea || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldALV"
                label={t('fields.oldALV')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-1 2xl:col-span-1"
              >
                <Tooltip content={oldDetailsData?.oldALV || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldALV || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldRV"
                label={t('fields.oldRV')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-1 2xl:col-span-1"
              >
                <Tooltip content={oldDetailsData?.oldRV || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldRV || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldPropTax"
                label={t('fields.oldPropTax')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldPropertyTax || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldPropertyTax || ''} title="" />
                </Tooltip>
              </FieldShell>

              <FieldShell
                id="oldTotalTax"
                label={t('fields.oldTotalTax')}
                className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2"
              >
                <Tooltip content={oldDetailsData?.oldTotalTax || ''} placement="bottom">
                  <ValueDisplay value={oldDetailsData?.oldTotalTax || ''} title="" />
                </Tooltip>
              </FieldShell>

              <div className="col-span-2 sm:col-span-4 md:col-span-6 lg:col-span-4 2xl:col-span-4 flex items-end gap-0.5">
                <Button
                  size="sm"
                  onClick={() => setShowOldMapInfo(!showOldMapInfo)}
                  className="h-5 min-h-[20px] max-h-[35px] px-1 mb-3 text-xs bg-teal-600 hover:bg-teal-700 leading-none flex-1 min-w-0 whitespace-nowrap"
                >
                  {showOldMapInfo ? t('actions.hideMapDetails') : t('actions.showMapDetails')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowOldFloorInfo(!showOldFloorInfo)}
                  className="h-5 min-h-[20px] max-h-[35px] px-1 mb-3 text-xs bg-indigo-600 hover:bg-indigo-700 leading-none flex-1 min-w-0 whitespace-nowrap"
                >
                  {showOldFloorInfo ? t('actions.hideFloorDetails') : t('actions.showFloorDetails')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowOldTaxInfo(!showOldTaxInfo)}
                  className="h-5 min-h-[20px] max-h-[35px] px-1 mb-3 text-xs bg-orange-600 hover:bg-orange-700 leading-none flex-1 min-w-0 whitespace-nowrap"
                >
                  {showOldTaxInfo ? t('actions.hideOldTax') : t('actions.showOldTax')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const currentWardNo = searchParams.get('wardNo') || '';
                    const currentPropertyNo = searchParams.get('propertyNo') || '';
                    const currentPartitionNo = searchParams.get('partitionNo') || '';
                    const currentWardId = searchParams.get('wardId') || '';

                    const params = new URLSearchParams({
                      propertyId: String(propertyId || ''),
                      wardNo: String(currentWardNo),
                      propertyNo: String(currentPropertyNo),
                      partitionNo: String(currentPartitionNo),
                      wardId: String(currentWardId),
                      from: 'ptis',
                      returnUrl: `/${locale}/property-tax/ptis`,
                      propNo: String(oldDetailsData?.oldPropertyNo || ''),
                      zone: String(oldDetailsData?.oldZoneName || ''),
                      ward: String(oldDetailsData?.oldWardNo || ''),
                      area: String(oldDetailsData?.oldPlotArea || ''),
                      tax: String(oldDetailsData?.oldTotalTax || ''),
                      rv: String(oldDetailsData?.oldRV || ''),
                      cv: String(oldDetailsData?.oldCV || ''),
                      floors: String(oldDetailsData?.oldConstructionArea || ''),
                    }).toString();
                    router.push(`/${locale}/property-tax/property-mapping?${params}`);
                  }}
                  className="h-5 min-h-[20px] max-h-[35px] px-1 mb-3 text-xs bg-purple-600 hover:bg-purple-700 leading-none flex-1 min-w-0 whitespace-nowrap"
                >
                  {t('actions.propertyMapping')}
                </Button>
              </div>
            </div>

            {/* Dynamic Tax Details Section */}
            <div className="overflow-x-auto">
              <OldTaxDetailsTable oldTaxesData={oldTaxesData} showOldTaxInfo={showOldTaxInfo} />
            </div>
          </div>
        </div>

        {showOldMapInfo && (
          <div className="w-full">
            <div className="bg-gradient-to-br from-sky-50 via-sky-50 to-blue-50 rounded p-0.5 shadow-md">
              <div className="rounded overflow-x-auto shadow-sm">
                <MasterTable<Record<string, unknown>>
                  data={oldMapTableData as unknown as Record<string, unknown>[]}
                  columns={oldMapColumns}
                  emptyText={t('fields.noMapDetails')}
                  paginationConfig={{ enabled: false }}
                  maxBodyHeightClassName="max-h-[150px] xl:max-h-[220px]"
                />
              </div>
            </div>
          </div>
        )}

        {showOldFloorInfo && (
          <div className="w-full">
            <div className="bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50 rounded p-0.5 shadow-md">
              <div className="rounded overflow-x-auto shadow-sm">
                <MasterTable<Record<string, unknown>>
                  data={tableData as unknown as Record<string, unknown>[]}
                  columns={oldFloorColumns}
                  emptyText={t('fields.noFloorDetails')}
                  paginationConfig={{ enabled: false }}
                  maxBodyHeightClassName="max-h-[150px] xl:max-h-[220px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OldDetailsTab;
