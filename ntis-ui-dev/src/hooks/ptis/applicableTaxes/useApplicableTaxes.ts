'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import { useConfirm } from '@/components/common';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getColumns } from '@/components/modules/property-tax/ptis/applicable-taxes/applicableTaxesColumns';
import { updateTaxApplicabilityAction } from '@/app/[locale]/property-tax/ptis/applicable-taxes/action';
import { useApplicableTaxesClose } from './useApplicableTaxesClose';
import { useApplicableTaxesCloseContext } from '@/components/modules/property-tax/ptis/applicable-taxes/ApplicableTaxesClientWrapper';
import type { ApplicableTaxesProps } from '@/types/applicable-taxes.types';

export function useApplicableTaxes({
  asseYearsResponse,
  useGroupsResponse,
  valuationTab,
  taxApplicabilityPagedResponse,
  taxApplicabilityPropertyData,
  initialAsseYear,
  initialTypeOfUse,
}: Omit<ApplicableTaxesProps, 'valuationTab'> & {
  valuationTab: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const t = useTranslations('applicableTaxes');
  const { confirm } = useConfirm();
  const locale = (params.locale as string) || 'en';

  const propertyId = searchParams.get('propertyId') || (params.propertyId as string) || '';
  const contextClose = useApplicableTaxesCloseContext();
  const { handleClose: defaultClose, markChangesSaved } = useApplicableTaxesClose(propertyId);
  const handleClose = contextClose || defaultClose;

  const wardNo = searchParams.get('wardNo') || '';
  const propertyNo = searchParams.get('propertyNo') || '';
  const partitionNo = searchParams.get('partitionNo') || '';
  const isValuationTab = !!valuationTab;

  const dynamicAsseYears = useMemo(() => {
    return (asseYearsResponse?.items || []).filter((item) => item.isActive);
  }, [asseYearsResponse]);

  const dynamicUseGroups = useMemo(() => {
    return (useGroupsResponse?.items || []).filter((item) => item.isActive);
  }, [useGroupsResponse]);

  const asseYearOptions = useMemo(() => {
    return dynamicAsseYears
      .map((item) => ({
        label: `${item.fromYear}-${item.toYear}`,
        value: String(item.id),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dynamicAsseYears]);

  const useTypeOptions = useMemo(() => {
    if (taxApplicabilityPropertyData?.length) {
      const seenIds = new Set<number>();
      return taxApplicabilityPropertyData
        .filter((prop) => !seenIds.has(prop.typeOfUseId) && seenIds.add(prop.typeOfUseId))
        .map((prop) => ({
          label: `${prop.typeOfUseCode} - ${prop.typeOfUseDescription}`,
          value: String(prop.typeOfUseId),
        }));
    }

    return dynamicUseGroups.map((group) => ({
      label: `${group.typeOfUseCode} - ${group.description}`,
      value: String(group.id),
    }));
  }, [dynamicUseGroups, taxApplicabilityPropertyData]);

  const asseYearParam = searchParams.get('asseYear');
  const selectedAsseYear = (asseYearParam && !isNaN(Number(asseYearParam)) && Number(asseYearParam) > 0)
    ? asseYearParam
    : (initialAsseYear || '');

  const typeOfUseParam = searchParams.get('typeOfUse');
  const selectedTypeOfUse = (typeOfUseParam && !isNaN(Number(typeOfUseParam)) && Number(typeOfUseParam) > 0)
    ? typeOfUseParam
    : (initialTypeOfUse || '');
  const searchQuery = searchParams.get('search') || '';
  const showInactiveParam = searchParams.get('showInactive');
  const showInactive = showInactiveParam === 'true';

  const items = useMemo(
    () => taxApplicabilityPagedResponse?.taxCalculations || [],
    [taxApplicabilityPagedResponse]
  );

  const summary = useMemo(() => taxApplicabilityPagedResponse?.summary || {
    totalTax: 0, residentialRV: 0, commercialRV: 0, area: 0, toilets: 0
  }, [taxApplicabilityPagedResponse]);

  const handleToggleStatus = useCallback((id: number, newStatus: boolean, taxHeadName: string) => {
    confirm({
      variant: 'update',
      title: t('title'),
      description: newStatus ? t('confirmActive') : t('confirmInactive'),
      meta: { name: taxHeadName },
      onConfirm: async () => {
        const propertyIdVal = Number(searchParams.get('propertyId') || '0');

        if (isNaN(propertyIdVal) || propertyIdVal <= 0) {
          toast.error(t('errors.missingRequiredPropertyId'));
          return;
        }

        try {
          const res = await updateTaxApplicabilityAction(locale, {
            propertyId: propertyIdVal,
            taxes: [
              {
                taxId: id,
                isApplicable: newStatus,
              }
            ],
            userId: 0,
          });

          if (res.success) {
            toast.success(t('success.updateTaxApplicability', { name: taxHeadName }));
            markChangesSaved();
            router.refresh();
          } else {
            toast.error(res.error || t('errors.updateTaxApplicability'));
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t('errors.unexpectedError'));
        }
      }
    });
  }, [confirm, searchParams, router, locale, t, markChangesSaved]);


  const handleParamChange = useCallback((key: string, val: string | boolean) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (typeof val === 'boolean') {
      newParams.set(key, String(val));
    } else {
      newParams.set(key, val);
    }
    
    if (key !== 'pageNumber') {
      newParams.set('pageNumber', '1');
    }
    if (!newParams.has('asseYear') && selectedAsseYear) {
      newParams.set('asseYear', selectedAsseYear);
    }
    if (!newParams.has('typeOfUse') && selectedTypeOfUse) {
      newParams.set('typeOfUse', selectedTypeOfUse);
    }
    router.replace(`${pathname}?${newParams.toString()}`);
  }, [searchParams, pathname, router, selectedAsseYear, selectedTypeOfUse]);

  const setPageNumber = useCallback((page: number) => {
    handleParamChange('pageNumber', String(page));
  }, [handleParamChange]);

  const filteredTaxes = useMemo(() => {
    return items.filter(item => {
      // Apply show inactive filter
      const isEffectiveActive = Boolean(item.isApplicable && item.isActive);
      if (!showInactive && !isEffectiveActive) return false;
      
      // Apply search filter
      if (searchQuery) {
        const matchesSearch = item.taxName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      }
      return true;
    });
  }, [items, searchQuery, showInactive]);

  const pageNumber = 1;
  const pageSize = filteredTaxes.length > 0 ? filteredTaxes.length : 10;
  const totalPages = 1;
  const totalCount = filteredTaxes.length;

  const paginatedData = useMemo(() => {
    return filteredTaxes;
  }, [filteredTaxes]);

  const columns = useMemo(() => getColumns(t, handleToggleStatus), [t, handleToggleStatus]);

  return {
    wardNo,
    propertyNo,
    partitionNo,
    isValuationTab,
    asseYearOptions,
    useTypeOptions,
    selectedAsseYear,
    selectedTypeOfUse,
    searchQuery,
    showInactive,
    summary,
    pageNumber,
    pageSize,
    totalPages,
    totalCount,
    setPageNumber,
    paginatedData,
    filteredTaxes,
    columns,
    handleClose,
    handleParamChange,
    t,
  };
}
