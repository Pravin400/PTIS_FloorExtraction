'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryTransition } from '@/hooks/useQueryTransition';
import {
  normalizeSearchField,
  sanitizeFilterInput,
  type AssetRegisterSearchField,
} from '@/lib/utils/asset-utils/asset-register-filters';

type UseAssetRegisterFiltersParams = {
  search?: string;
  searchField?: string;
  assetNo?: string;
};

export function useAssetRegisterFilters({
  search,
  searchField: searchFieldProp,
  assetNo,
}: UseAssetRegisterFiltersParams) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { updateQueries } = useQueryTransition();

  const [searchValue, setSearchValue] = useState(search || '');
  const [assetNoSearch, setAssetNoSearch] = useState(assetNo || '');
  const [searchField, setSearchField] = useState<AssetRegisterSearchField>(
    normalizeSearchField(searchFieldProp)
  );
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);

  const debouncedMainSearch = useDebounce(searchValue, 500);
  const debouncedAssetNoSearch = useDebounce(assetNoSearch, 500);

  useEffect(() => {
    queueMicrotask(() => {
      setSearchValue(search || '');
    });
  }, [search]);

  useEffect(() => {
    const normalizedField = normalizeSearchField(searchFieldProp);
    queueMicrotask(() => {
      setSearchField(normalizedField);
    });
  }, [searchFieldProp]);

  useEffect(() => {
    queueMicrotask(() => {
      setAssetNoSearch(assetNo || '');
    });
  }, [assetNo]);

  useEffect(() => {
    const trimmed = debouncedMainSearch.trim();
    if (trimmed !== (search || '').trim()) {
      updateQueries({ search: trimmed || null, page: '1' });
    }
  }, [debouncedMainSearch, search, updateQueries]);

  useEffect(() => {
    const trimmed = debouncedAssetNoSearch.trim();
    if (trimmed !== (assetNo || '').trim()) {
      updateQueries({ AssetNo: trimmed || null, page: '1' });
    }
  }, [debouncedAssetNoSearch, assetNo, updateQueries]);

  const handleSearchChange = (val: string) => {
    setSearchValue(sanitizeFilterInput(val));
  };

  const handleAssetNoSearchChange = (val: string) => {
    setAssetNoSearch(sanitizeFilterInput(val));
  };

  const handleSearchFieldChange = (value: AssetRegisterSearchField) => {
    setSearchField(value);
    updateQueries({ searchField: value === 'all' ? null : value, page: '1' });
  };

  const handleAssetTypeChange = (selected: string[]) => {
    const value = selected.length === 0 ? null : selected.join(',');
    updateQueries({ AssetTypeId: value, page: '1' });
  };

  const handleZoneChange = (newZone: string) => {
    updateQueries({ ZoneId: newZone === 'all' ? null : newZone, WardId: null, page: '1' });
  };

  const handleWardChange = (newWard: string) => {
    updateQueries({ WardId: newWard === 'all' ? null : newWard, page: '1' });
  };

  const handleOwningDepartmentChange = (newDept: string) => {
    updateQueries({ DepartmentId: newDept === 'all' ? null : newDept, page: '1' });
  };

  const handleOwnershipTypeChange = (newOwnership: string) => {
    updateQueries({ ownershipType: newOwnership === 'all' ? null : newOwnership, page: '1' });
  };

  const handleEncroachmentStatusChange = (newStatus: string) => {
    updateQueries({ encroachmentStatus: newStatus === 'all' ? null : newStatus, page: '1' });
  };

  const handleAssetCategoryChange = (newCategory: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] || 'en';

    let newPath = `/${locale}/assets/municipal-Asset/asset-register`;
    if (newCategory !== 'all') {
      newPath += `/${newCategory}`;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('AssetTypeId');
    params.delete('page');

    const queryString = params.toString();
    const nextUrl = queryString ? `${newPath}?${queryString}` : newPath;

    router.push(nextUrl, { scroll: false });
  };

  const handleFiltersPanelToggle = () => {
    setShowFiltersPanel((prev) => !prev);
  };

  const handleResetFilters = () => {
    const segments = pathname.split('/').filter(Boolean);
    const registerIndex = segments.indexOf('asset-register');
    const registerPath = registerIndex >= 0
      ? `/${segments.slice(0, registerIndex + 1).join('/')}`
      : pathname;
    setSearchValue('');
    setAssetNoSearch('');
    setSearchField('all');
    router.push(registerPath, { scroll: false });
  };

  return {
    searchValue,
    assetNoSearch,
    searchField,
    showFiltersPanel,
    handleSearchChange,
    handleAssetNoSearchChange,
    handleSearchFieldChange,
    handleAssetTypeChange,
    handleZoneChange,
    handleWardChange,
    handleOwningDepartmentChange,
    handleOwnershipTypeChange,
    handleEncroachmentStatusChange,
    handleAssetCategoryChange,
    handleFiltersPanelToggle,
    handleResetFilters,
  };
}
