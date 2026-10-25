import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ApartmentContainer } from '@/components/modules/property-tax/ptis/apartment';
import { PtisLayoutWrapper } from '@/components/modules/property-tax/ptis/PtisLayoutWrapper';
import { getMediaPanelVisibleFromCookieStore } from '@/lib/utils/cookie';
import { BottomActionBar } from '@/components/layout/BottomActionBar';
import {
  PtisBackButton,
  PtisFooterDropdowns,
} from '@/components/modules/property-tax/ptis/PtisFooterControls';
import { PtisNavigationProvider } from '@/components/modules/property-tax/ptis/shared/PtisNavigationContext';
import { buildFooterActions } from '@/app/[locale]/property-tax/ptis/buildFooterActions';
import { getApartmentPageCopy } from './apartment-page-copy';
import { loadApartmentPageData } from './apartment-page-data';
import type { WingWiseDetailsItems } from '@/types/property-tax/apartment';

import { toSafeString } from '@/lib/utils/format';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<
    Record<string, string | string[] | undefined> & {
      wardNo?: string;
      propertyNo?: string;
      partitionNo?: string;
      propertyId?: string;
      wardId?: string;
    }
  >;
}

export default async function ApartmentPage({ params, searchParams }: PageProps) {
  const cookieStore = await cookies();
  const isMediaPanelVisible = getMediaPanelVisibleFromCookieStore(cookieStore);
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const { locale } = resolvedParams;

  const rawPartitionNo = toSafeString(resolvedSearchParams.partitionNo);
  const partitionNo = rawPartitionNo === '0' ? '' : rawPartitionNo;
  const hasPartition = partitionNo !== '' && partitionNo !== '0' && partitionNo !== '-';

  // Properties with a non-zero partition number are individual unit properties (flat/shop)
  if (hasPartition && (resolvedSearchParams.propertyId || (resolvedSearchParams.propertyNo && resolvedSearchParams.wardNo))) {
    const redirectParams = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([k, v]) => {
      if (typeof v === 'string') redirectParams.set(k, v);
    });
    redirectParams.set('category', '2');
    redirectParams.set('categoryLabel', 'Individual Property');
    redirectParams.delete('societyDetailId');
    redirectParams.delete('societydetailid');
    redirectParams.delete('societyId');
    redirectParams.delete('societyid');
    redirectParams.delete('societyMasterId');
    redirectParams.delete('societyMasterid');
    redirect(`/${locale}/property-tax/ptis/individual?${redirectParams.toString()}`);
  }

  const t = await getTranslations({ locale, namespace: 'ptisRedesign' });

  const data = await loadApartmentPageData(resolvedSearchParams, locale);
  const copy = getApartmentPageCopy(t);
  const footerActions = buildFooterActions();

  if (data.resolvedPropertyId && !data.isApartmentSocietyProperty) {
    const redirectParams = new URLSearchParams();
    if (resolvedSearchParams) {
      Object.entries(resolvedSearchParams).forEach(([k, v]) => {
        if (typeof v === 'string') redirectParams.set(k, v);
      });
    }
    redirectParams.set('category', data.currentCategoryId !== undefined ? String(data.currentCategoryId) : '2');
    redirectParams.set('categoryLabel', 'Individual Property');
    redirectParams.delete('societyDetailId');
    redirectParams.delete('societydetailid');
    redirectParams.delete('societyId');
    redirectParams.delete('societyid');
    redirectParams.delete('societyMasterId');
    redirectParams.delete('societyMasterid');
    redirectParams.delete('type');
    redirect(`/${locale}/property-tax/ptis/individual?${redirectParams.toString()}`);
  }

  const { pageData, kycDetails, tabHeaderInfo } = {
    pageData: data.pageData,
    kycDetails: data.pageData.kycDetails,
    tabHeaderInfo: data.pageData.tabHeaderInfo,
  };

  const ownerName =
    kycDetails?.propertyHolderName ||
    kycDetails?.propertyHolderNameMarathi ||
    kycDetails?.propertyHolderNameEnglish ||
    ((kycDetails as unknown) as Record<string, unknown>)?.ownerName as string ||
    tabHeaderInfo?.ownerName ||
    ((pageData.rawPropertyData as unknown) as Array<Record<string, unknown>>)?.find(
      (p) => p.propertyId === data.resolvedPropertyId || p.propertyNo === data.propertyNo
    )?.ownerName as string ||
    '';

  const propertyDescription =
    tabHeaderInfo?.description ||
    ((pageData.propertyDetailsResult?.propertyDetails as unknown) as { propertyDescription?: string })?.propertyDescription ||
    '';

  return (
    <PtisNavigationProvider properties={pageData.rawPropertyData}>
      <div className="flex flex-col gap-6 pb-24">
        <PtisLayoutWrapper
          wardNo={data.wardNo}
          propertyNo={data.propertyNo}
          partitionNo={data.partitionNo}
          propertyHolderName={kycDetails?.propertyHolderName || ''}
          propertyHolderNameMarathi={kycDetails?.propertyHolderNameMarathi || ''}
          isQCApproved={false}
          propertyId={data.resolvedPropertyId}
          isMainProperty={data.isMainProp}
          categoryId={data.currentCategoryId}
          propertyTypeId={data.currentPropertyTypeId}
          propertyDescription={propertyDescription}
          type={data.currentType}
          societyDetailId={data.currentSocietyDetailId}
          initialPhotoSlots={pageData.initialPhotoSlots}
          initialPhotos={pageData.initialPhotos}
          initialLatitude={pageData.latitude}
          initialLongitude={pageData.longitude}
          societyLatitude={data.societyLatitude ?? (data.initialPropertyMasterData?.latitude ? Number(data.initialPropertyMasterData.latitude) : undefined)}
          societyLongitude={data.societyLongitude ?? (data.initialPropertyMasterData?.longitude ? Number(data.initialPropertyMasterData.longitude) : undefined)}
          initialWaybackReleases={pageData.waybackReleases}
          initialVisible={isMediaPanelVisible}
          wings={data.rawData?.wings}
          societyBuildingPhotoGuid={data.initialPropertyMasterData?.societyBuildingPhotoGuid}
          societyPhotoUrl={data.initialPropertyMasterData?.imageUrl}
        >
          <ApartmentContainer
            copy={copy}
            initialData={data.initialData}
            initialWardId={pageData.resolvedWardId ?? null}
            rawData={data.rawData || ((pageData.wings && pageData.wings.length > 0) ? ({
              wardId: Number(data.wardId || pageData.resolvedWardId) || 0,
              wardNo: data.wardNo || '',
              propertyNo: data.propertyNo || '',
              wings: pageData.wings,
            } as unknown as WingWiseDetailsItems) : null)}
            initialPropertyMasterData={data.initialPropertyMasterData}
            initialQcTopSectionBelowFlex={data.initialQcTopSectionBelowFlex}
            initialApartmentTaxDetails={data.initialApartmentTaxDetails}
            initialCertificateGrid={data.initialCertificateGrid}
            initialMasterTypes={data.initialMasterTypes}
          />
        </PtisLayoutWrapper>

        <BottomActionBar
          actions={footerActions}
          properties={pageData.rawPropertyData}
          workflowStages={[]}
          currentWorkflowStageId={data.currentWorkflowStageId}
          leftContent={<PtisBackButton />}
          rightContent={
            <PtisFooterDropdowns
              key="footer-dropdowns"
              workflowStages={data.workflowStages}
              propertyId={data.resolvedPropertyId}
              currentWorkflowStageId={data.currentWorkflowStageId}
              propertyNo={data.propertyNo}
              ownerName={ownerName}
            />
          }
          categoryId={pageData.propertyDetailsResult?.propertyDetails?.categoryId}
          categoryName={tabHeaderInfo?.category || 'Apartment'}
          partitionNo={data.partitionNo}
          societyDetailId={pageData.societyDetails?.societyDetailId}
          isCombined={!!tabHeaderInfo?.isCombined}
        />
      </div>
    </PtisNavigationProvider>
  );
}
