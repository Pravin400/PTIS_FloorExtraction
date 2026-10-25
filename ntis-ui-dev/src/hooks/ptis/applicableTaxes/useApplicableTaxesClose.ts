'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

import { useApplicableTaxesCloseContext } from '@/components/modules/property-tax/ptis/applicable-taxes/ApplicableTaxesClientWrapper';

export function useApplicableTaxesClose(overridePropertyId?: string | number | null) {
  const contextClose = useApplicableTaxesCloseContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const propertyId = overridePropertyId || searchParams.get('propertyId') || (params.propertyId as string) || '';
  const wardNo = searchParams.get('wardNo') || '';
  const propertyNo = searchParams.get('propertyNo') || '';
  const returnTab = searchParams.get('returnTab') || '';
  const parentPropertyId = searchParams.get('parentPropertyId') || '';
  const societyDetailId = searchParams.get('societyDetailId') || searchParams.get('societyId');
  const wingDetailId = searchParams.get('wingDetailId');
  const wingName = searchParams.get('wingName');
  const categoryIdParam = searchParams.get('categoryId');
  const categoryId = categoryIdParam ? Number(categoryIdParam) : undefined;

  const { hasSavedChanges, resetSavedChanges, markChangesSaved } = useQdeSaveTracker(propertyId);

  const doClose = () => {
    resetSavedChanges();
    const qParams = new URLSearchParams(searchParams.toString());

    const cleanPropertyNo =
      wardNo && propertyNo && propertyNo.startsWith(`${wardNo}-`)
        ? propertyNo.slice(wardNo.length + 1)
        : propertyNo;

    if (cleanPropertyNo) qParams.set('propertyNo', cleanPropertyNo);
    if (propertyId) qParams.set('propertyId', String(propertyId));

    const isExplicitApartment = returnTab === 'apartment' || searchParams.get('from') === 'apartment';
    const isApartment =
      isExplicitApartment ||
      (!returnTab &&
        typeof window !== 'undefined' &&
        sessionStorage.getItem('qde_is_apartment') === 'true');

    const isCategoryIndividual =
      categoryId === 2 ||
      (categoryId !== undefined && categoryId !== null && categoryId !== 1) ||
      searchParams.get('categoryId') === '2';

    const isExplicitIndividual =
      returnTab === 'individual' ||
      searchParams.get('from') === 'individual' ||
      isCategoryIndividual;
    const isIndividual =
      isExplicitIndividual ||
      (!returnTab &&
        typeof window !== 'undefined' &&
        sessionStorage.getItem('qde_is_individual') === 'true');

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qde_is_apartment');
      sessionStorage.removeItem('qde_is_individual');
    }

    if (isApartment) {
      const societyId = searchParams.get('societyId') || searchParams.get('societyDetailId') || societyDetailId;
      const wingId = searchParams.get('wingId');
      const resolvedParentPropId =
        parentPropertyId ||
        searchParams.get('parentPropertyId') ||
        searchParams.get('parentpropertyid');

      if (resolvedParentPropId) {
        qParams.set('propertyId', String(resolvedParentPropId));
      } else if (propertyId) {
        qParams.set('propertyId', String(propertyId));
      }
      qParams.delete('partitionNo');
      if (societyId) qParams.set('societyId', String(societyId));
      if (wingId) qParams.set('wingId', String(wingId));
      if (wingDetailId) qParams.set('wingDetailId', String(wingDetailId));
      if (wingName) qParams.set('wingName', String(wingName));

      qParams.delete('from');
      qParams.delete('returnTab');
      qParams.delete('parentPropertyId');

      router.push(`/${locale}/property-tax/ptis/apartment?${qParams.toString()}`);
    } else if (isIndividual) {
      qParams.delete('from');
      qParams.delete('returnTab');
      qParams.delete('parentPropertyId');
      qParams.delete('categoryId');

      router.push(`/${locale}/property-tax/ptis/individual?${qParams.toString()}`);
    } else {
      router.push(`/${locale}/property-tax/ptis?${qParams.toString()}`);
    }
  };

  const closeImmediately = () => {
    resetSavedChanges();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      doClose();
    }
  };

  const handleClose = () => {
    if (contextClose) {
      contextClose();
      return;
    }
    if (hasSavedChanges()) {
      doClose();
    } else {
      closeImmediately();
    }
  };

  return {
    handleClose,
    closeImmediately,
    doClose,
    hasSavedChanges,
    resetSavedChanges,
    markChangesSaved,
  };
}
