import { getTranslations } from 'next-intl/server';
import { mapAssetToRow } from '@/components/modules/assets/municipal-Asset/asset-register/registerMappers';
import type { AssetRegisterViewProps } from '@/types/asset/asset-register/municipal-asset-register.types';
import type { AssetRegisterApiRecord } from '@/types/asset/asset-register/municipal-asset-service.types';
import { PageContainer } from '@/components/common';
import { AssetRegisterControls } from './AssetRegisterControls';
import { AssetRegisterHeaderSummary } from './AssetRegisterHeaderSummary';
import { AssetRegisterTable } from './AssetRegisterTable';

export async function AssetRegisterView({
  locale,
  categoryId,
  categoryName,
  safeSearch,
  safeSearchField,
  AssetNo,
  AssetTypeId,
  ZoneId,
  WardId,
  DepartmentId,
  ownershipType,
  encroachmentStatus,
  safePageSize,
  finalPage,
  totalPages,
  assetsResult,
  typesResult,
  zonesResult,
  wardsResult,
  departmentsResult,
  ownershipResult = [],
  updatedDate: _updatedDate,
  categoryOptions = [],
  initialSubunitData = null,
}: AssetRegisterViewProps) {
  let t: (key: string) => string;
  try {
    const translations = await getTranslations({ locale, namespace: 'assetRegister' });
    t = (key: string) => translations(key);
  } catch {
    t = (key: string) => {
      const fallback: Record<string, string> = {
        MUNICIPAL_CORPORATION_ASSET_REGISTER: 'MUNICIPAL CORPORATION ASSET REGISTER',
        All_Asset_Types: 'All Asset Types',
        All_Zones: 'All Zones',
        All_Wards: 'All Wards',
        All_Departments: 'All Departments',
        All_Asset_Categories: 'All Asset Categories',
        Asset_Register: 'Asset Register',
        Register_of: 'Register of',
        Private_municipal_asset_register: 'Private municipal asset register',
      };
      return fallback[key] || key;
    };
  }

  const mappedAssets = assetsResult.items.map((item: AssetRegisterApiRecord) =>
    mapAssetToRow(item, categoryName || 'Asset Register')
  );

  const assetTypeOptions = typesResult.map((type) => ({
    value: String(type.id),
    label: type.label,
  }));

  const zoneOptions = zonesResult.map((zone) => ({
    label: zone.label,
    value: String(zone.id),
  }));

  const wardOptions = wardsResult
    .filter((ward) => ZoneId === 'all' || ward.zoneId == null || String(ward.zoneId) === ZoneId)
    .map((ward) => ({ label: ward.label, value: String(ward.id) }));

  const owningDepartmentOptions = [
    { label: t('All_Departments'), value: 'all' },
    ...departmentsResult.map((dept) => ({ label: dept.label, value: String(dept.id) })),
  ];

  const ownershipOptions = ownershipResult.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const mappedCategoryOptions = categoryOptions.map((cat) => ({
    label: cat.label,
    value: String(cat.id),
  }));

  const resolvedCategoryName = categoryName || t('Asset_Register');

  return (
    <PageContainer className="p-0">
      <div className="flex w-full flex-col gap-2.5">
        <AssetRegisterHeaderSummary
          summary={assetsResult.summary ?? {
            totalParentAssets: assetsResult.totalCount,
            activeParentAssets: assetsResult.activeAssetsCount ?? 0,
            totalSubUnits: 0,
            activeSubUnits: 0,
            totalCapitalValue: assetsResult.totalCapitalValue ?? 0,
            totalAnnualRevenue: 0,
            totalOutstanding: 0,
            encroachedAssets: 0,
          }}
          translate={t}
        />

        <AssetRegisterTable
          assets={mappedAssets}
          totalCount={assetsResult.totalCount}
          pageNumber={finalPage}
          pageSize={safePageSize}
          totalPages={totalPages}
          initialSubunitData={initialSubunitData}
          controls={
            <AssetRegisterControls
              categoryId={categoryId}
              categoryName={resolvedCategoryName}
              search={safeSearch}
              searchField={safeSearchField}
              AssetNo={AssetNo}
              AssetTypeId={AssetTypeId}
              ZoneId={ZoneId}
              WardId={WardId}
              DepartmentId={DepartmentId}
              ownershipType={ownershipType}
              encroachmentStatus={encroachmentStatus}
              assetTypeOptions={assetTypeOptions}
              zoneOptions={zoneOptions}
              wardOptions={wardOptions}
              owningDepartmentOptions={owningDepartmentOptions}
              ownershipOptions={ownershipOptions}
              categoryOptions={mappedCategoryOptions}
            />
          }
        />
      </div>
    </PageContainer>
  );
}
