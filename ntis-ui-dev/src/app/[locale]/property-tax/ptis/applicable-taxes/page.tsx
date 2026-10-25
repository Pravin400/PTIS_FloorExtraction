import { ApplicableTaxes } from "@/components/modules/property-tax/ptis/applicable-taxes/ApplicableTaxes";
import { TaxCalculationResponse } from '@/types/applicable-taxes.types';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import {
  getAssessmentYearsAction,
  getTypeOfUseAction,
  getTaxCalculationAction,
  getTaxApplicabilityByPropertyIdAction
} from './action';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ApplicablePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("applicableTaxes");

  const searchParamsResolved = await searchParams;
  const valuationTab = typeof searchParamsResolved.valuationTab === 'string' ? searchParamsResolved.valuationTab : '';
  const propertyIdStr = typeof searchParamsResolved.propertyId === 'string' ? searchParamsResolved.propertyId : '';
  const propertyId = propertyIdStr ? Number(propertyIdStr) : NaN;

  const asseYearParam = typeof searchParamsResolved.asseYear === 'string' ? searchParamsResolved.asseYear : '';
  const selectedAsseYear = (asseYearParam && !isNaN(Number(asseYearParam)) && Number(asseYearParam) > 0) ? asseYearParam : '';

  const typeOfUseParam = typeof searchParamsResolved.typeOfUse === 'string' ? searchParamsResolved.typeOfUse : '';
  const selectedTypeOfUse = (typeOfUseParam && !isNaN(Number(typeOfUseParam)) && Number(typeOfUseParam) > 0) ? typeOfUseParam : '';

  // const pageNumber = typeof searchParamsResolved.pageNumber === 'string' ? Number(searchParamsResolved.pageNumber) : 1;
  // const pageSize = typeof searchParamsResolved.pageSize === 'string' ? Number(searchParamsResolved.pageSize) : 10;

  const [asseYearsResponse, useGroupsResponse, propertyDataResult] = await Promise.all([
    getAssessmentYearsAction(valuationTab, 1, -1),
    getTypeOfUseAction(1, -1),
    propertyId ? getTaxApplicabilityByPropertyIdAction(propertyId) : Promise.resolve(null),
  ]);


  if (!asseYearsResponse.success) {
    throw new Error(asseYearsResponse.error || t("errors.fetchAssessmentYears"));
  }
  if (!useGroupsResponse.success) {
    throw new Error(useGroupsResponse.error || t("errors.fetchUseGroups"));
  }

  const taxApplicabilityPropertyData = propertyDataResult?.success ? (propertyDataResult.data ?? null) : null;

  let finalAsseYear = selectedAsseYear;
  let finalTypeOfUse = selectedTypeOfUse;

  const propertyData = taxApplicabilityPropertyData?.[0];

  if (!finalAsseYear && propertyData) {
    const startYear = parseInt(propertyData.financeYear?.split('-')[0] || '', 10);
    const matchedAsseYear = asseYearsResponse.data?.items.find(
      (ay) => ay.fromYear <= startYear && ay.toYear >= startYear
    );

    finalAsseYear = matchedAsseYear ? String(matchedAsseYear.id) : String(propertyData.financeYearId);
  }

  if (!finalTypeOfUse && propertyData?.typeOfUseId) {
    finalTypeOfUse = String(propertyData.typeOfUseId);
  }

  const financialYearId = finalAsseYear && finalAsseYear !== 'undefined' && !isNaN(Number(finalAsseYear))
    ? Number(finalAsseYear)
    : undefined;

  // const typeOfUseId = finalTypeOfUse && finalTypeOfUse !== 'undefined' && !isNaN(Number(finalTypeOfUse))
  //   ? Number(finalTypeOfUse)
  //   : undefined;

  // const rvOrCv = valuationTab === 'capital' ? 'CV' : 'RV';

  let taxApplicabilityResponse: TaxCalculationResponse | null = null;
  if (propertyId && financialYearId) {
    const taxCalculationResult = await getTaxCalculationAction(propertyId, financialYearId);
    if (!taxCalculationResult.success) {
      throw new Error(taxCalculationResult.error || t("errors.fetchTaxCalculation"));
    }
    taxApplicabilityResponse = taxCalculationResult.data || null;
  }

  return (
    <ApplicableTaxes
      asseYearsResponse={asseYearsResponse.data ?? null}
      useGroupsResponse={useGroupsResponse.data ?? null}
      valuationTab={valuationTab}
      taxApplicabilityPagedResponse={taxApplicabilityResponse}
      taxApplicabilityPropertyData={taxApplicabilityPropertyData}
      initialAsseYear={finalAsseYear}
      initialTypeOfUse={finalTypeOfUse}
    />
  );
}
