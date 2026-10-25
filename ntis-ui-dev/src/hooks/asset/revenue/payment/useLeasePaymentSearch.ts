import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAssetAction } from '@/app/[locale]/assets/revenue/payment/actions';
import type { LeaseRentPaymentDetail, AssetCounterPaymentSearchItem } from '@/types/asset/revenue/payment/leaseRentPayment.types';

export interface UseLeasePaymentSearchReturn {
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  hasSearched: boolean;
  setHasSearched: React.Dispatch<React.SetStateAction<boolean>>;
  showSuggestions: boolean;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  searchResults: AssetCounterPaymentSearchItem[];
  isSearching: boolean;
  assetCategoryId: string;
  setAssetCategoryId: React.Dispatch<React.SetStateAction<string>>;
  assetTypeId: string;
  setAssetTypeId: React.Dispatch<React.SetStateAction<string>>;
  zoneId: string;
  setZoneId: React.Dispatch<React.SetStateAction<string>>;
  wardId: string;
  setWardId: React.Dispatch<React.SetStateAction<string>>;
  parentAssetId: string;
  setParentAssetId: React.Dispatch<React.SetStateAction<string>>;
  assetId: string;
  setAssetId: React.Dispatch<React.SetStateAction<string>>;
}

export function useLeasePaymentSearch(record: LeaseRentPaymentDetail): UseLeasePaymentSearchReturn {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');

  const [searchValue, setSearchValue] = useState(q || record.assetNo);
  const [hasSearched, setHasSearched] = useState(Boolean(q));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<AssetCounterPaymentSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [assetCategoryId, setAssetCategoryId] = useState('');
  const [assetTypeId, setAssetTypeId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [wardId, setWardId] = useState('');
  const [parentAssetId, setParentAssetId] = useState('');
  const [assetId, setAssetId] = useState('');

  useEffect(() => {
    if (!q) {
      Promise.resolve().then(() => setHasSearched(false));
    } else {
      Promise.resolve().then(() => setHasSearched(true));
    }
  }, [q]);

  const debouncedSearchValue = useDebounce(searchValue, 400);

  useEffect(() => {
    if (!showSuggestions || !debouncedSearchValue || debouncedSearchValue.length < 3) {
      Promise.resolve().then(() => {
        setIsSearching(false);
        if (!showSuggestions) setSearchResults([]);
      });
      return;
    }

    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) setIsSearching(true);
    });

    searchAssetAction(
      debouncedSearchValue,
      assetCategoryId,
      assetTypeId,
      zoneId,
      wardId,
      parentAssetId,
      assetId
    )
      .then((res) => {
        if (!isCancelled) {
          if (res.success && res.data?.items) {
            setSearchResults(res.data.items);
          } else {
            setSearchResults([]);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!isCancelled) setIsSearching(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearchValue, showSuggestions, assetCategoryId, assetTypeId, zoneId, wardId, parentAssetId, assetId]);

  return {
    searchValue,
    setSearchValue,
    hasSearched,
    setHasSearched,
    showSuggestions,
    setShowSuggestions,
    searchResults,
    isSearching,
    assetCategoryId,
    setAssetCategoryId,
    assetTypeId,
    setAssetTypeId,
    zoneId,
    setZoneId,
    wardId,
    setWardId,
    parentAssetId,
    setParentAssetId,
    assetId,
    setAssetId,
  };
}
