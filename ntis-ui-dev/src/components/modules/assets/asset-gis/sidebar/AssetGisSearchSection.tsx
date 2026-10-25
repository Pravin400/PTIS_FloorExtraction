'use client';

import { useState, useRef } from 'react';
import { Search, X, MapPin, Hash, Loader2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { usePropertySearch } from '@/hooks/useAssetGisApi';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeOwnerId } from '@/lib/utils/asset-gis-utils';
import { cn } from '@/lib/utils/cn';
import { Button, Input } from '@/components/common';
import { searchPropertiesAction } from '@/app/[locale]/assets/gismapviewer/actions';
import type { AssetGisSearchSectionProps } from '@/types/asset-gis.types';

export type { AssetGisSearchSectionProps };

export function AssetGisSearchSection({ onSelectProperty }: AssetGisSearchSectionProps) {
  const t = useTranslations('assetGis');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType] = useState<'all' | 'buildingid' | 'mobile' | 'name' | 'address'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // PERFECT_FIX: Debounce search to 400ms for massive 3 Lakh dataset
  const debouncedQuery = useDebounce(searchQuery, 400);
  const { data: searchResults, isFetching: isSearching } = usePropertySearch(debouncedQuery, searchType);

  const isNotFound = searchQuery.length >= 3 && !isSearching && (!searchResults || searchResults.length === 0);

  const handleSelect = (item: Record<string, unknown>) => {
    const rawOwnerId = String(item.assetNo || item.AssetNo || item.MPMS_ID || item.mpmsId || item.OwnerID || item.ownerID || item.ownerId || '');
    const id = rawOwnerId.toString().startsWith('MPMS') ? rawOwnerId : normalizeOwnerId(rawOwnerId);
    const bldgId = item.BuildingID || item.buildingID || item.buildingId || item.Buil_ID || item.Buil_Id || id;
    const lat = Number(item.latitude ?? item.Latitude ?? item.FallbackLatitude ?? item.fallbackLatitude ?? item.centroidY ?? 0) || null;
    const lng = Number(item.longitude ?? item.Longitude ?? item.FallbackLongitude ?? item.fallbackLongitude ?? item.centroidX ?? 0) || null;

    const normalizedItem = {
      ...item,
      assetId: item.assetId ?? item.id,
      assetNo: id,
      AssetNo: id,
      ownerID: id,
      OwnerID: id,
      ownerId: id,
      MPMS_ID: id,
      mpmsId: id,
      Buil_ID: bldgId,
      Buil_Id: bldgId,
      builId: bldgId,
      buil_id: bldgId,
      BuildingID: bldgId,
      buildingID: bldgId,
      latitude: lat,
      Latitude: lat,
      longitude: lng,
      Longitude: lng,
      FallbackLatitude: lat,
      FallbackLongitude: lng,
      centroidY: lat,
      centroidX: lng,
    };

    if (onSelectProperty) onSelectProperty(normalizedItem);

    if (inputRef.current) inputRef.current.blur();
  };

  const handleSearchSubmit = () => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const clean = searchQuery.trim();

    // Select matching item if available from live search suggestions
    if (searchResults && searchResults.length > 0) {
      handleSelect(searchResults[0] as Record<string, unknown>);
    } else {
      searchPropertiesAction(clean, searchType).then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          handleSelect(res.data[0] as Record<string, unknown>);
        } else {
          handleSelect({ MPMS_ID: clean, OwnerID: clean, assetNo: clean });
        }
      });
    }
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <div
          className={cn(
            'relative group flex items-center p-1 rounded-2xl bg-white border-2 transition-all duration-300 shadow-2xs focus-within:shadow-md focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50',
            isNotFound ? 'border-red-500' : 'border-slate-100'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-focus-within:text-blue-500 group-focus-within:bg-blue-50 transition-colors shrink-0 ml-1">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </div>

          <Input
            naked
            ref={inputRef}
            type="text"
            placeholder={t('sidebar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-slate-700 placeholder:text-slate-300 px-3 min-w-0"
          />

          <div className="flex items-center gap-1 mr-1">
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSearchQuery('')}
                icon={X}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 h-auto border-0"
                aria-label="Clear Search"
                title="Clear Search"
              />
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all cursor-pointer border-0"
              onClick={handleSearchSubmit}
            >
              {t('sidebar.searchButton')}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {searchQuery.length >= 2 && (isSearching || (searchResults && searchResults.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-3 max-h-[320px] overflow-y-auto rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[1001] custom-scrollbar p-2"
            >
              {isSearching ? (
                <div className="p-6 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-t-blue-600 animate-spin" />
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching Records...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {searchResults?.map((rawItem: unknown, index: number) => {
                    const item = (rawItem || {}) as Record<string, unknown>;
                    const assetNo = String(item.AssetNo || item.assetNo || item.OwnerID || item.ownerID || '');
                    const assetName = String(item.AssetName || item.assetName || item.OwnerName || item.ownerName || '');
                    const mobile = String(item.Mobile || item.mobile || '');
                    const address = String(item.Address || item.address || '');
                    return (
                      <Button
                        type="button"
                        variant="ghost"
                        key={`${assetNo}-${index}`}
                        onClick={() => handleSelect(item)}
                        className="flex flex-col items-start gap-1.5 p-3.5 rounded-2xl hover:bg-blue-50 transition-all text-left group border border-transparent hover:border-blue-100 w-full h-auto"
                      >
                        {/* Asset No header row */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-blue-500" />
                            {assetNo}
                          </span>
                          {mobile ? (
                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors border border-slate-100 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> {mobile}
                            </span>
                          ) : null}
                        </div>
                        {/* Asset Name */}
                        {assetName ? (
                          <span className="text-xs font-bold text-slate-700 tracking-tight truncate w-full">{assetName}</span>
                        ) : null}
                        {/* Address */}
                        {address ? (
                          <span className="text-[10px] font-medium text-blue-500 line-clamp-1 opacity-80 flex items-center gap-1 w-full">
                            <MapPin className="w-3 h-3 inline shrink-0" />{address}
                          </span>
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isNotFound && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-full left-0 right-0 mt-2 text-center text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 rounded-xl py-2 shadow-sm z-50"
            >
              {t('sidebar.noResultsFound')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
