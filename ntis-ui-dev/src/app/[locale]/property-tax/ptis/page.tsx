import { redirect } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { parsePtisSearchParams } from '@/lib/utils/params';
import { toSafeString } from '@/lib/utils/format';
import { getPtisUserSafeErrorMessage } from '@/components/modules/property-tax/ptis/shared/valuation-fetch';

import { BottomActionBar } from '@/components/layout/BottomActionBar';
import {
  PtisBackButton,
  PtisFooterDropdowns,
} from '@/components/modules/property-tax/ptis/PtisFooterControls';
import PtisMainScreen from '@/components/modules/property-tax/ptis/PtisMainScreen';
import PropertyTabSection from '@/components/modules/property-tax/ptis/PropertyTabSection';
import { PtisLayoutWrapper } from '@/components/modules/property-tax/ptis/PtisLayoutWrapper';

import { fetchPtisPageData } from './ptis-fetch.service';
import { PtisNavigationProvider } from '@/components/modules/property-tax/ptis/shared/PtisNavigationContext';
import { getWorkflowStagesAction, getCurrentWorkflowDetailAction } from './workflowStageActions';
import { PtisInitialData } from '@/types/ptis.types';
import ReassessmentPage from './reassesment/page';
import { PtisValuationSections } from './PtisValuationSections';
import { buildFooterActions } from './buildFooterActions';

interface PtisPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      wardNo?: string;
      propertyNo?: string;
      partitionNo?: string;
      propertyId?: string;
      wardId?: string;
      tab?: string;
      valuationTab?: string;
      showFloor?: string;
      showOldTax?: string;
    }
  >;
}

import { cookies } from 'next/headers';
import { getMediaPanelVisibleFromCookieStore } from '@/lib/utils/cookie';

export default async function PtisPage({ params, searchParams }: PtisPageProps) {
  const cookieStore = await cookies();
  const isMediaPanelVisible = getMediaPanelVisibleFromCookieStore(cookieStore);
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { locale } = resolvedParams;
  const t = await getTranslations({ locale, namespace: 'ptis' });

  // 1. Fetch all data concurrently on the server — no sequential waterfalls.
  const propertyIdRaw = resolvedSearchParams?.propertyId
    ? parseInt(resolvedSearchParams.propertyId as string, 10)
    : NaN;

  const [pageData, workflowStagesResult, currentWorkflow] = await Promise.all([
    fetchPtisPageData(resolvedSearchParams, locale),
    getWorkflowStagesAction(),
    Number.isFinite(propertyIdRaw) ? getCurrentWorkflowDetailAction(propertyIdRaw) : Promise.resolve(null),
  ]);
  const workflowStages = workflowStagesResult?.success ? workflowStagesResult.data || [] : [];
  if (pageData.shouldRedirect && pageData.redirectUrl) redirect(pageData.redirectUrl);
  const {
    criticalError, resolvedPropertyId, resolvedWardId,
    propertyDetailsResult, rawPropertyData, propertyOptions, wardOptions,
    kycDetails, societyDetails, buildingPermission, oldDetails, oldFloorTableData,
    oldTaxesData, discountDetails, socialDetails, apartmentData, rateableResult, capitalResult, comparisonResult,
    dualSectionData, initialPhotoSlots, initialPhotos, showFloorParam,
    showOldTaxParam, showMapDetailsParam, showDetailsParam, rateableTaxDetails, capitalTaxDetails,
    rateableTaxError, capitalTaxError, activeTab, hasAppliedRules,
    appliedRulesList, latitude, longitude, societyLatitude, societyLongitude, waybackReleases, tabHeaderInfo,
    mappedPropertiesData, wings,
  } = pageData;
  const ptisParams = parsePtisSearchParams(resolvedSearchParams);
  const valuationTab = ptisParams.tab;
  const wardNo = toSafeString(resolvedSearchParams?.wardNo);
  const propertyNo = toSafeString(resolvedSearchParams?.propertyNo);
  const rawPartitionNo = toSafeString(resolvedSearchParams?.partitionNo);
  const partitionNo = rawPartitionNo === '0' ? '' : rawPartitionNo;
  const initialError = (!propertyDetailsResult.success && propertyDetailsResult.error) || undefined;
  const sanitizedInitialError = propertyDetailsResult.error
    ? getPtisUserSafeErrorMessage(propertyDetailsResult.error, undefined, t('error.generic'), t)
    : undefined;
  const initialData: PtisInitialData = {
    propertyDetails: propertyDetailsResult.propertyDetails,
    kycDetails, societyDetails, buildingPermission, wardOptions,
    propertyOptions, rawPropertyData, oldDetails, oldFloorTableData,
    showOldFloorInfo: showFloorParam, oldTaxesData,
    showOldTaxInfo: showOldTaxParam, showOldMapInfo: showMapDetailsParam, discountDetails, socialDetails, tabHeaderInfo,
    mappedPropertiesData,
  };
  const footerActions = buildFooterActions();
  const valuationSections = PtisValuationSections({
    valuationTab,
    locale,
    propertyId: resolvedPropertyId,
    searchParams: resolvedSearchParams as Record<string, string | string[] | undefined>,
    rateableResult,
    capitalResult,
    comparisonResult,
    dualSectionData,
    initialData,
    rateableTaxDetails,
    rateableTaxError,
    capitalTaxDetails,
    capitalTaxError,
    showDetailsParam,
  });

  // Only fetch reassessment data when the reassessment tab is active
  const isReassessmentTabActive = valuationTab === 'reassessment';
  const reassessmentSection = isReassessmentTabActive ? (
    <ReassessmentPage
      params={params}
      wardId={resolvedWardId}
      propertyNo={propertyNo}
      partitionNo={partitionNo}
    />
  ) : null;

  const currentCategoryId = propertyDetailsResult?.propertyDetails?.categoryId ?? undefined;
  const currentCategoryName = tabHeaderInfo?.category ?? '';
  const isIndividual = currentCategoryId === 2 || String(currentCategoryName).toLowerCase().includes('individual');
  const isApartment = currentCategoryId === 1 || currentCategoryId === 0 || String(currentCategoryName).toLowerCase().includes('apartment') || (!isIndividual && Boolean(societyDetails?.societyDetailId));
  const isMainProp = isApartment && (!partitionNo || partitionNo === '0' || partitionNo.trim() === '' || partitionNo.trim() === '-');
  const currentPropertyTypeId =
    (propertyDetailsResult?.propertyDetails as unknown as { propertyTypeId?: number })?.propertyTypeId ?? undefined;
  const currentType =
    tabHeaderInfo?.type ??
    (propertyDetailsResult?.propertyDetails as unknown as { type?: string; Type?: string })?.type ??
    (propertyDetailsResult?.propertyDetails as unknown as { type?: string; Type?: string })?.Type ??
    null;
  const currentPropertyDescription =
    tabHeaderInfo?.description ??
    (propertyDetailsResult?.propertyDetails as unknown as { propertyDescription?: string })?.propertyDescription ??
    '';
  const currentSocietyDetailId = societyDetails?.societyDetailId ?? undefined;

  const isApartmentSocietyProperty =
    isMainProp ||
    currentCategoryId === 0 ||
    String(currentCategoryName).toLowerCase() === 'apartment society property';

  if (resolvedPropertyId) {
    const redirectParams = new URLSearchParams();
    if (resolvedSearchParams) {
      Object.entries(resolvedSearchParams).forEach(([k, v]) => {
        if (typeof v === 'string') redirectParams.set(k, v);
      });
    }
    if (isApartmentSocietyProperty) {
      redirectParams.set('category', currentCategoryId !== undefined ? String(currentCategoryId) : '0');
      redirectParams.set('categoryLabel', currentCategoryName || 'Apartment Society Property');
      if (currentSocietyDetailId) {
        redirectParams.set('societyDetailId', String(currentSocietyDetailId));
      }
      redirectParams.delete('wingDetailId');
      redirectParams.delete('wingdetailid');
      redirectParams.delete('wingId');
      redirectParams.delete('wingid');
      redirectParams.delete('wingName');
      redirectParams.delete('wingname');
      redirect(`/${locale}/property-tax/ptis/apartment?${redirectParams.toString()}`);
    } else {
      redirectParams.set('category', currentCategoryId !== undefined ? String(currentCategoryId) : '2');
      redirectParams.set('categoryLabel', currentCategoryName || 'Individual Property');
      redirectParams.delete('societyDetailId');
      redirectParams.delete('societydetailid');
      redirectParams.delete('societyId');
      redirectParams.delete('societyid');
      redirectParams.delete('societyMasterId');
      redirectParams.delete('societyMasterid');
      redirect(`/${locale}/property-tax/ptis/individual?${redirectParams.toString()}`);
    }
  }

  return (
    <PtisNavigationProvider properties={rawPropertyData}>
      <div className="flex flex-col gap-6 pb-24">
        {criticalError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold">{t('error.networkError.title')}</p>
              <p className="text-sm mt-0.5">{criticalError}</p>
            </div>
          </div>
        )}
        <PtisLayoutWrapper
          wardNo={wardNo}
          propertyNo={propertyNo}
          partitionNo={partitionNo}
          propertyHolderName={kycDetails.propertyHolderName || ''}
          propertyHolderNameMarathi={kycDetails.propertyHolderNameMarathi || ''}
          isQCApproved={false}
          propertyId={resolvedPropertyId}
          isMainProperty={isMainProp}
          categoryId={currentCategoryId}
          propertyTypeId={currentPropertyTypeId}
          propertyDescription={currentPropertyDescription}
          type={currentType}
          societyDetailId={currentSocietyDetailId}
          initialPhotoSlots={initialPhotoSlots}
          initialPhotos={initialPhotos}
          initialLatitude={latitude}
          initialLongitude={longitude}
          societyLatitude={societyLatitude}
          societyLongitude={societyLongitude}
          initialWaybackReleases={waybackReleases}
          initialVisible={isMediaPanelVisible}
          wings={wings}
        >
          <div className="flex flex-col gap-2 w-full">
            <PropertyTabSection
              initialData={initialData}
              initialWardId={resolvedWardId}
              initialTab={ptisParams.tab === 'apartment' ? 'societydetails' : activeTab}
              initialError={initialError}
            />
            <PtisMainScreen
              locale={locale}
              propertyId={resolvedPropertyId}
              categoryId={propertyDetailsResult.propertyDetails.categoryId}
              ptisParams={ptisParams}
              resolvedSearchParams={resolvedSearchParams}
              error={sanitizedInitialError}
              initialApartmentData={apartmentData}
              initialDualSectionData={dualSectionData}
              wardId={resolvedWardId}
              propertyNo={propertyNo}
              partitionNo={partitionNo}
              hasAppliedRules={hasAppliedRules || false}
              appliedRules={appliedRulesList || []}
              rateableSection={valuationSections.rateableSection}
              capitalSection={valuationSections.capitalSection}
              dualRateableSection={valuationSections.dualRateableSection}
              dualCapitalSection={valuationSections.dualCapitalSection}
              reassessmentSection={reassessmentSection}
            />
          </div>
        </PtisLayoutWrapper>
        <BottomActionBar
          actions={footerActions}
          properties={rawPropertyData}
          workflowStages={workflowStages}
          currentWorkflowStageId={
            currentWorkflow?.success ? currentWorkflow.data?.workflowStageId : undefined
          }
          leftContent={<PtisBackButton />}
          rightContent={
            <PtisFooterDropdowns
              key="footer-dropdowns"
              workflowStages={workflowStages}
              propertyId={resolvedPropertyId}
              currentWorkflowStageId={
                currentWorkflow?.success ? currentWorkflow.data?.workflowStageId : undefined
              }
              propertyNo={propertyNo}
              ownerName={
                kycDetails?.propertyHolderName ||
                kycDetails?.propertyHolderNameMarathi ||
                kycDetails?.propertyHolderNameEnglish ||
                ((kycDetails as unknown) as Record<string, unknown>)?.ownerName as string ||
                tabHeaderInfo?.ownerName ||
                ((rawPropertyData as unknown) as Array<Record<string, unknown>>)?.find((p) => p.propertyId === resolvedPropertyId || p.propertyNo === propertyNo)?.ownerName as string ||
                ''
              }
            />
          }
          // categoryId={propertyDetailsResult.propertyDetails.categoryId}
          categoryName={currentCategoryName}
          partitionNo={partitionNo}
          // societyDetailId={societyDetails.societyDetailId}
          categoryId={currentCategoryId}
          societyDetailId={!isIndividual && isApartment ? societyDetails.societyDetailId : undefined}
          wingDetailId={
            !isIndividual && isApartment && Boolean(partitionNo && partitionNo !== '0' && partitionNo.trim() !== '')
              ? (societyDetails.wingDetailId
                  ? Number(societyDetails.wingDetailId)
                  : (resolvedSearchParams?.wingDetailId ? Number(resolvedSearchParams.wingDetailId) : undefined))
              : undefined
          }
          isCombined={!!tabHeaderInfo?.isCombined}
        />
      </div>
    </PtisNavigationProvider>
  );
}
