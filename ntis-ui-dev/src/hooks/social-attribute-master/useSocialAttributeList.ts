'use client';

import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { deleteSocialAttributeAction } from '@/app/[locale]/property-tax/social-attribute-master/action';
import type { SocialAttribute } from '@/types/social-attribute.types';
import React from 'react';

interface UseSocialAttributeListOptions {
  data: SocialAttribute[];
  dataTypeFilterProp?: string;
  attributeTypeFilterProp?: string;
  currentSearchTerm?: string;
}

export function useSocialAttributeList({
  data,
  dataTypeFilterProp,
  attributeTypeFilterProp,
  currentSearchTerm,
}: UseSocialAttributeListOptions) {
  const router = useRouter();
  const t = useTranslations('socialAttribute');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { confirm } = useConfirm();
  const [, startTransition] = React.useTransition();

  // Filter states
  const [searchQueryState, setSearchQueryState] = useState(currentSearchTerm || '');
  const [dataTypeFilter, setDataTypeFilter] = useState(dataTypeFilterProp || 'ALL');
  const [attributeFilter, setAttributeFilter] = useState(attributeTypeFilterProp || 'ALL');
  const [urlTimeoutId, setUrlTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const updateURL = useCallback(
    (search: string, dataType: string, attribute: string) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (dataType && dataType !== 'ALL') params.set('dataType', dataType);
      if (attribute && attribute !== 'ALL') params.set('attributeType', attribute);
      router.replace(`/${locale}/property-tax/social-attribute-master?${params.toString()}`);
    },
    [router, locale]
  );

  const handleSearchChange = (val: string) => {
    setSearchQueryState(val);
    if (urlTimeoutId) clearTimeout(urlTimeoutId);
    const timeout = setTimeout(() => updateURL(val, dataTypeFilter, attributeFilter), 400);
    setUrlTimeoutId(timeout);
  };

  const handleDataTypeChange = (val: string) => {
    setDataTypeFilter(val);
    updateURL(searchQueryState, val, attributeFilter);
  };

  const handleAttributeFilterChange = (val: string) => {
    setAttributeFilter(val);
    updateURL(searchQueryState, dataTypeFilter, val);
  };

  React.useEffect(() => {
    return () => {
      if (urlTimeoutId) clearTimeout(urlTimeoutId);
    };
  }, [urlTimeoutId]);

  const hasActiveFilters = useMemo(
    () => searchQueryState.trim() !== '' || dataTypeFilter !== 'ALL' || attributeFilter !== 'ALL',
    [searchQueryState, dataTypeFilter, attributeFilter]
  );

  const handleResetFilters = useCallback(() => {
    if (urlTimeoutId) clearTimeout(urlTimeoutId);
    setSearchQueryState('');
    setDataTypeFilter('ALL');
    setAttributeFilter('ALL');
    updateURL('', 'ALL', 'ALL');
  }, [urlTimeoutId, updateURL]);

  const handleEdit = useCallback(
    (row: SocialAttribute) => {
      startTransition(() => {
        router.push(`/${locale}/property-tax/social-attribute-master/edit/${row.id}`);
      });
    },
    [router, locale]
  );

  const handleDelete = useCallback(
    (row: SocialAttribute) => {
      confirm({
        variant: 'delete',
        title: `${t('list.table.socialAttributeCode')}: ${row.socialAttributeCode}`,
        description: `${t('delete.confirmDescription')}`,
        meta: { name: row.socialAttributeName },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append('id', String(row.id));
          const result = await deleteSocialAttributeAction(fd);
          if (result.success) {
            toast.success(t('success.deleted', { code: row.socialAttributeCode }));
            startTransition(() => router.refresh());
          } else {
            let errorMessage = tCommon('errors.deleteError');
            if (result.statusCode === 409) {
              if (result.messageKey === 'hasChildren') {
                errorMessage = t('apiErrors.hasChildren');
              } else {
                errorMessage = t('apiErrors.inUse');
              }
            } else if (result.statusCode === 400) errorMessage = t('apiErrors.validationError');
            else if (result.statusCode === 404) errorMessage = t('apiErrors.notFound');
            else if (result.message) errorMessage = result.message;
            toast.error(errorMessage);
          }
        },
      });
    },
    [confirm, router, t, tCommon]
  );

  // Client-side filtering
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchQueryState.trim()) {
        const q = searchQueryState.trim().toLowerCase();
        const codeMatch = item.socialAttributeCode.toLowerCase().includes(q);
        const nameMatch = item.socialAttributeName.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) {
          const hasMatchingChild =
            item.parentAttributeId === null &&
            data.some(
              (c) =>
                c.parentAttributeId === item.id &&
                (c.socialAttributeCode.toLowerCase().includes(q) ||
                  c.socialAttributeName.toLowerCase().includes(q))
            );
          const hasMatchingParent =
            item.parentAttributeId !== null &&
            data.some(
              (p) =>
                p.id === item.parentAttributeId &&
                (p.socialAttributeCode.toLowerCase().includes(q) ||
                  p.socialAttributeName.toLowerCase().includes(q))
            );
          if (!hasMatchingChild && !hasMatchingParent) return false;
        }
      }
      if (dataTypeFilter && dataTypeFilter !== 'ALL') {
        const itemType = item.dataType.toUpperCase();
        const filterType = dataTypeFilter.toUpperCase();
        if (filterType === 'INTEGER') {
          if (itemType !== 'INTEGER' && itemType !== 'INT') return false;
        } else {
          if (itemType !== filterType) return false;
        }
      }
      if (attributeFilter && attributeFilter !== 'ALL') {
        if (attributeFilter === 'PARENT_ONLY' && item.parentAttributeId !== null) return false;
        if (attributeFilter === 'CHILD_ONLY' && item.parentAttributeId === null) return false;
        if (attributeFilter === 'DISCOUNT' && !item.isDiscountApplicable) return false;
      }
      return true;
    });
  }, [data, searchQueryState, dataTypeFilter, attributeFilter]);

  // Flat hierarchical tree (parent → children)
  const parentItems = useMemo(() => {
    const treeItemsMap = new Map<number, SocialAttribute>();
    filteredData.forEach((item) => {
      treeItemsMap.set(item.id, item);
      if (item.parentAttributeId !== null) {
        const parent = data.find((p) => p.id === item.parentAttributeId);
        if (parent) treeItemsMap.set(parent.id, parent);
      }
    });
    const parents = Array.from(treeItemsMap.values()).filter(
      (item) => item.parentAttributeId === null
    );
    return parents.map((parent) => ({
      parent,
      children: filteredData.filter((item) => item.parentAttributeId === parent.id),
    }));
  }, [filteredData, data]);

  return {
    // filter state
    searchQueryState,
    dataTypeFilter,
    attributeFilter,
    hasActiveFilters,
    // filter handlers
    handleSearchChange,
    handleDataTypeChange,
    handleAttributeFilterChange,
    handleResetFilters,
    // row actions
    handleEdit,
    handleDelete,
    // computed tree
    parentItems,
    // nav helper
    startTransition,
  };
}
