import { AssetRegisterFilters } from '@/components/modules/assets/municipal-Asset/asset-register/AssetRegisterFilters';
import { AssetRegisterExportButton } from '@/components/modules/assets/municipal-Asset/asset-register/AssetRegisterExportButton';
import type { AssetRegisterControlsProps } from '@/types/asset/asset-register/municipal-asset-register.types';

export function AssetRegisterControls({
  categoryId,
  search,
  searchField,
  AssetNo,
  AssetTypeId,
  ZoneId,
  WardId,
  DepartmentId,
  ownershipType,
  encroachmentStatus,
  assetTypeOptions,
  zoneOptions,
  wardOptions,
  owningDepartmentOptions,
  ownershipOptions,
  categoryOptions,
}: AssetRegisterControlsProps) {
  return (
    <div className="w-full">
      <AssetRegisterFilters
        search={search}
        searchField={searchField}
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
        categoryId={categoryId}
        categoryOptions={categoryOptions}
        exportButton={
          <AssetRegisterExportButton
            categoryId={categoryId}
            search={search}
            searchField={searchField}
            AssetNo={AssetNo}
            AssetTypeId={AssetTypeId}
            ZoneId={ZoneId}
            WardId={WardId}
            DepartmentId={DepartmentId}
            ownershipType={ownershipType}
            encroachmentStatus={encroachmentStatus}
          />
        }
      />
    </div>
  );
}
