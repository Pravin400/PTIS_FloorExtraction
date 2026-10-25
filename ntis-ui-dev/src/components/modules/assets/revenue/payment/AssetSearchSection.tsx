import { type TransitionStartFunction, useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import type { AssetCounterPaymentSearchItem } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { SearchSelect, type SearchSelectOption, ClearButton, Input, Button, IconOnlyActionButton, Card, Label } from '@/components/common';
import {
  fetchAssetCategoriesAction,
  fetchAssetTypesAction,
  fetchZonesAction,
  fetchWardsAction,
  fetchAssetMasterAction,
  searchAssetAction,
} from '@/app/[locale]/assets/revenue/payment/actions';

interface AssetSearchSectionProps {
  searchValue: string;
  setSearchValue: (val: string) => void;
  setHasSearched: (val: boolean) => void;
  showSuggestions: boolean;
  setShowSuggestions: (val: boolean) => void;
  isSearching: boolean;
  searchResults: AssetCounterPaymentSearchItem[];
  router: { push: (url: string) => void; replace: (url: string) => void };
  startTransition: TransitionStartFunction;
  assetCategoryId: string;
  setAssetCategoryId: (val: string) => void;
  assetTypeId: string;
  setAssetTypeId: (val: string) => void;
  zoneId: string;
  setZoneId: (val: string) => void;
  wardId: string;
  setWardId: (val: string) => void;
  parentAssetId: string;
  setParentAssetId: (val: string) => void;
  assetId: string;
  setAssetId: (val: string) => void;
}

export function AssetSearchSection({
  searchValue,
  setSearchValue,
  setHasSearched,
  showSuggestions,
  setShowSuggestions,
  isSearching,
  searchResults,
  router,
  startTransition,
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
}: AssetSearchSectionProps) {
  const t = useTranslations('AssetPayment');
  const params = useParams<{ locale?: string }>();
  const currentLocale = params.locale || 'en';

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<SearchSelectOption[]>([]);
  const [types, setTypes] = useState<SearchSelectOption[]>([]);
  const [zones, setZones] = useState<SearchSelectOption[]>([]);
  const [wards, setWards] = useState<SearchSelectOption[]>([]);
  const [parents, setParents] = useState<SearchSelectOption[]>([]);
  const [shops, setShops] = useState<SearchSelectOption[]>([]);

  // Event-driven fetch functions (no API calls in useEffect)
  const handleToggleFilters = () => {
    const nextState = !isFiltersOpen;
    setIsFiltersOpen(nextState);
    if (nextState) {
      if (categories.length === 0) {
        fetchAssetCategoriesAction().then((res) => setCategories(res || []));
        fetchZonesAction().then((res) => setZones(res || []));
        fetchAssetMasterAction({ isParent: false }).then((res) => setShops(res?.options || []));
      }
      if (types.length === 0) {
        fetchAssetTypesAction(assetCategoryId ? Number(assetCategoryId) : undefined).then((res) => setTypes(res || []));
      }
    }
  };

  const handleCategoryChange = (val: string) => {
    setAssetCategoryId(val);
    fetchAssetTypesAction(val ? Number(val) : undefined).then((res) => setTypes(res || []));
    if (zoneId && wardId) {
      fetchAssetMasterAction({
        zoneId,
        wardId,
        assetCategoryId: val || undefined,
        assetTypeId: assetTypeId || undefined,
        isParent: true,
      }).then((res) => setParents(res?.options || []));
    }
  };

  const handleTypeChange = (val: string) => {
    setAssetTypeId(val);
    if (zoneId && wardId) {
      fetchAssetMasterAction({
        zoneId,
        wardId,
        assetCategoryId: assetCategoryId || undefined,
        assetTypeId: val || undefined,
        isParent: true,
      }).then((res) => setParents(res?.options || []));
    }
  };

  const handleZoneChange = (val: string) => {
    setZoneId(val);
    setWardId('');
    setParents([]);
    if (val) {
      fetchWardsAction(val).then((res) => setWards(res || []));
    } else {
      setWards([]);
    }
  };

  const handleWardChange = (val: string) => {
    setWardId(val);
    if (val && zoneId) {
      fetchAssetMasterAction({
        zoneId,
        wardId: val,
        assetCategoryId: assetCategoryId || undefined,
        assetTypeId: assetTypeId || undefined,
        isParent: true,
      }).then((res) => setParents(res?.options || []));
    } else {
      setParents([]);
    }
  };

  const handleParentAssetChange = (val: string) => {
    setParentAssetId(val);
    setAssetId('');
    if (val) {
      fetchAssetMasterAction({
        parentAssetId: val,
        isParent: false,
      }).then((res) => setShops(res?.options || []));
    } else {
      setShops([]);
    }
  };

  const handleExecuteSearch = async () => {
    if (!searchValue.trim() && !assetCategoryId && !assetTypeId && !parentAssetId && !assetId) {
      return;
    }

    let items = searchResults;

    // If searchResults is empty (e.g. filter-only search without search text or before suggestions loaded)
    if (items.length === 0 && (assetCategoryId || assetTypeId || parentAssetId || assetId || searchValue.trim())) {
      try {
        const res = await searchAssetAction(
          searchValue.trim(),
          assetCategoryId,
          assetTypeId,
          zoneId,
          wardId,
          parentAssetId,
          assetId
        );
        if (res.success && res.data?.items) {
          items = res.data.items;
        }
      } catch {
        items = [];
      }
    }

    if (items.length > 0) {
      const asset = items[0];
      setHasSearched(true);
      setShowSuggestions(false);
      startTransition(() => {
        const targetId = asset.leaseRentDetailsId || asset.assetId;
        router.push(`/${currentLocale}/assets/revenue/payment/${targetId}?q=${encodeURIComponent(searchValue.trim())}`);
      });
    } else {
      toast.error(t('v2.noMatchingAssets'));
      setShowSuggestions(false);
    }
  };

  const hasActiveFilters = Boolean(assetCategoryId || assetTypeId || parentAssetId || assetId);

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-[0_4px_20px_rgba(30,58,138,0.08)] p-2 sm:p-3 relative overflow-visible">
      <div className="flex items-center justify-between mb-2.5 ml-1 relative z-10 pr-2">
        <h2 className="text-[16px] font-bold text-[#1E3A8A] flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          <span>
            {t('v2.searchAsset')}
            <span className="text-[13px] text-slate-500 font-medium ml-1.5 tracking-normal hidden sm:inline">
              ({t('v2.searchPlaceholder')})
            </span>
          </span>
        </h2>

        <Button
          type="button"
          onClick={handleToggleFilters}
          variant="secondary"
          size="xs"
          icon={SlidersHorizontal}
          className={`rounded-full text-[12px] font-bold border-0 ${isFiltersOpen || hasActiveFilters
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          title="Advanced Filters"
        >
          <span className="inline-flex items-center gap-1">
            <span className="hidden sm:inline">{t('records.searchFilterTitle')}</span>
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] ml-0.5">
                {[assetCategoryId, assetTypeId, parentAssetId, assetId].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </span>
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {isFiltersOpen && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4 animate-in slide-in-from-top-2 shadow-inner relative z-30">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">{t('records.searchFilterTitle')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <Label className="text-[12px] font-bold text-slate-700 mb-1">{t('records.filters.assetCategory')}</Label>
              <SearchSelect
                name="assetCategoryId"
                options={categories}
                value={assetCategoryId}
                onChange={(_, val) => handleCategoryChange(val)}
                placeholder="Select Category"
              />
            </div>
            <div>
              <Label className="text-[12px] font-bold text-slate-700 mb-1">{t('records.table.type')}</Label>
              <SearchSelect
                name="assetTypeId"
                options={types}
                value={assetTypeId}
                onChange={(_, val) => handleTypeChange(val)}
                placeholder="Select Type"
              />
            </div>
            <div>
              <Label className="text-[12px] font-bold text-slate-700 mb-1">{t('records.filters.zone')}</Label>
              <SearchSelect
                name="zoneId"
                options={zones}
                value={zoneId}
                onChange={(_, val) => handleZoneChange(val)}
                placeholder="Select Zone"
              />
            </div>
            <div>
              <Label className="text-[12px] font-bold text-slate-700 mb-1">{t('records.filters.ward')}</Label>
              <SearchSelect
                name="wardId"
                options={wards}
                value={wardId}
                onChange={(_, val) => handleWardChange(val)}
                placeholder="Select Ward"
                disabled={!zoneId}
              />
            </div>
            <div>
              <Label className="text-[12px] font-bold text-slate-700 mb-1">{t('v2.buildingName')}</Label>
              <SearchSelect
                name="parentAssetId"
                options={parents}
                value={parentAssetId}
                onChange={(_, val) => handleParentAssetChange(val)}
                placeholder="Select Building"
                disabled={!zoneId || !wardId}
              />
            </div>
            <div>
              <Label className="text-[12px] font-bold text-slate-700 mb-1">{t('layout.assetInfo.shopName')}</Label>
              <SearchSelect
                name="assetId"
                options={shops}
                value={assetId}
                onChange={(_, val) => {
                  setAssetId(val);
                  if (val) {
                    startTransition(() => {
                      router.push(`/${currentLocale}/assets/revenue/payment/${val}?q=AMC`);
                    });
                  }
                }}
                placeholder="Select Shop"
                disabled={!parentAssetId}
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <ClearButton
              label={t('makePayment.drawer.clear')}
              onClick={() => {
                setAssetCategoryId('');
                setAssetTypeId('');
                setZoneId('');
                setWardId('');
                setParentAssetId('');
                setAssetId('');
              }}
              className="text-[12px]"
            />
          </div>
        </div>
      )}

      {/* Search input row - always side by side */}
      <div className="flex flex-row gap-2 sm:gap-4 relative z-10 items-center">
        <div className="relative flex-1 min-w-0 group">
          {/* Subtle Outer Glow on Hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full blur opacity-0 group-hover:opacity-30 transition duration-500"></div>

          {/* Input Container */}
          <div className="relative flex items-center bg-slate-50 rounded-full border border-slate-200 overflow-hidden shadow-inner group-hover:border-blue-300 transition-colors">
            <Search className="absolute left-3.5 sm:left-5 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <Input
              naked
              type="text"
              value={searchValue}
              onChange={(e) => {
                const val = e.target.value;
                setSearchValue(val);
                if (val === '') {
                  setHasSearched(false);
                  setShowSuggestions(false);
                  startTransition(() => {
                    router.push(`/${currentLocale}/assets/revenue/payment`);
                  });
                } else {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExecuteSearch();
                }
              }}
              placeholder={t('v2.searchPlaceholder')}
              aria-label={t('v2.searchPlaceholder')}
              className="w-full h-10 sm:h-12 pl-9 sm:pl-14 pr-10 sm:pr-12 text-[12px] sm:text-[14px] bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400 font-medium tracking-wide truncate"
            />

            {/* Right side icons inside input */}
            <div className="absolute right-1.5 flex items-center gap-1">
              {searchValue && (
                <IconOnlyActionButton
                  icon={X}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchValue('');
                    setHasSearched(false);
                    setShowSuggestions(false);
                    startTransition(() => {
                      router.push(`/${currentLocale}/assets/revenue/payment`);
                    });
                  }}
                  aria-label="Clear search"
                  title="Clear search"
                  className="!h-7 !w-7 !min-w-[28px] !p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded-full border-0 [&_svg]:!w-4 [&_svg]:!h-4 cursor-pointer"
                />
              )}
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchValue && (
            <Card
              padding="none"
              className="absolute top-full left-0 right-0 mt-2 sm:mt-3 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
            >
              <div className="px-4 py-2 text-[11px] font-bold text-slate-500 bg-slate-50 border-b border-slate-100 uppercase tracking-wider">
                {t('v2.suggestedAssets')}
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="px-4 py-4 text-[13px] text-slate-500 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    {t('v2.searchingDatabase')}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-4 text-[13px] text-slate-500">{t('v2.noMatchingAssets')}</div>
                ) : (
                  searchResults.map((asset) => {
                    const targetId = asset.leaseRentDetailsId || asset.assetId;
                    return (
                      <Button
                        key={targetId}
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setHasSearched(true);
                          setShowSuggestions(false);
                          startTransition(() => {
                            router.push(`/${currentLocale}/assets/revenue/payment/${targetId}?q=${encodeURIComponent(searchValue)}`);
                          });
                        }}
                        className="w-full !h-auto text-left px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-blue-50/50 border-b border-slate-100 last:border-b-0 rounded-none !justify-between !items-start group transition-all !whitespace-normal"
                      >
                        <div className="w-full text-left">
                          <div className="text-[13px] sm:text-[14px] font-bold text-blue-800 mb-0.5 sm:mb-1 group-hover:text-blue-600 transition-colors">{asset.assetNo}</div>
                          <div className="text-[11.5px] sm:text-[12px] text-slate-600 font-medium">{asset.assetName || asset.shopName} <span className="text-slate-300 mx-1.5">•</span> {asset.tenantName}</div>
                        </div>
                      </Button>
                    );
                  })
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
