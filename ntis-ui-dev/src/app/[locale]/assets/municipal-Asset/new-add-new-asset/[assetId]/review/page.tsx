import { setRequestLocale } from 'next-intl/server';
import { NewAddNewAssetPage } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NewAddNewAssetPage';
import { NAAssetFormHydrator } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormHydrator";
import { loadBasicInfoPageData } from "@/lib/utils/asset-utils/new-add-new-asset/basic-info/basic-info-page-data.utils";
import { getNewAssetValuationDataAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action';

export const dynamic = 'force-dynamic';

import type { AssetStepPageProps, ValuationResponse } from "@/types/asset/municipal-Asset/new-add-new-asset";

export default async function ReviewStepPage({ params, searchParams }: AssetStepPageProps) {
  const { locale, assetId: rawAssetId } = await params;
  setRequestLocale(locale);

  const search = await searchParams;
  const assetId = Number(rawAssetId || search.assetId || search.id || 0);
  const parentAssetIdParam = search.parentAssetId ? Number(search.parentAssetId) : null;
  const categoryId = Number(search.categoryId || 0);
  const typeId = Number(search.typeId || 0);
  const categoryStr = String(search.category || "");
  const assetTypeStr = String(search.assetType || "");
  const zoneIdParam = search.zoneId ? String(search.zoneId) : null;
  const moujaIdParam = search.moujaId ? String(search.moujaId) : null;
  const departmentIdParam = search.departmentId ? String(search.departmentId) : null;
  const typeOfUseIdParam = search.typeOfUseId ? Number(search.typeOfUseId) : null;
  const isLandCategory = categoryId === 2 || /land|plot|जमीन|भूखंड/i.test(categoryStr);
  const isMovable = categoryId === 3 || /movable|vehicle|equipment|furniture|जंगम|वाहन|उपकरण/i.test(categoryStr);
  const isBuilding = !isMovable && !isLandCategory;

  const [pageDataResult, valuationResult] = await Promise.all([
    loadBasicInfoPageData({
      categoryId,
      typeId,
      assetId,
      categoryStr,
      assetTypeStr,
      zoneIdParam,
      moujaIdParam,
      departmentIdParam,
      typeOfUseIdParam,
      parentAssetIdParam,
      isLandCategory,
    }),
    assetId > 0
      ? getNewAssetValuationDataAction(assetId, isBuilding)
          .then((res) => {
            if (!res?.success) {
              console.error(`[ReviewStepPage] Valuation prefetch error for assetId=${assetId}:`, res?.error);
            }
            return res;
          })
          .catch((err) => {
            console.error(`[ReviewStepPage] Valuation prefetch failed for assetId=${assetId}:`, err);
            return null;
          })
      : Promise.resolve(null),
  ]);

  const initialValuationData =
    valuationResult && (valuationResult as ValuationResponse).success
      ? (valuationResult as ValuationResponse)
      : null;

  return (
    <>
      <NAAssetFormHydrator initialData={pageDataResult.initialWizardData} />
      <NewAddNewAssetPage
        activeStepKey="review"
        parentAssetId={parentAssetIdParam}
        wards={pageDataResult.wards}
        zones={pageDataResult.zones}
        departments={pageDataResult.departments}
        moujas={pageDataResult.moujas}
        designations={pageDataResult.designations}
        ownershipTypes={pageDataResult.ownershipTypes}
        subzones={pageDataResult.subzones}
        assetConditions={pageDataResult.assetConditions}
        initialParentAsset={pageDataResult.initialParentAsset}
        initialParentFloors={pageDataResult.initialParentFloors}
        initialParentSubunits={pageDataResult.initialParentSubunits}
        initialWizardData={pageDataResult.initialWizardData}
        prefetchedFields={pageDataResult.prefetchedFields}
        initialValuationData={initialValuationData}
      />
    </>
  );
}
