'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Search } from 'lucide-react';
import { Badge, Input, NextPageButton, PrevPageButton } from '@/components/common';
import type { AssetRegisterRow } from '@/types/asset/asset-register/municipal-asset-register.types';
import type { AssetRegisterSubUnitItem } from '@/lib/api/asset/asset-register/municipal-asset-register.service';
import { useDebounce } from '@/hooks/useDebounce';
import { sanitizeFilterInput } from '@/lib/utils/asset-utils/asset-register-filters';
import { SubunitDataRow } from './SubunitDataRow';

interface AssetRegisterSubunitRowProps {
  row: AssetRegisterRow;
  subunits: AssetRegisterSubUnitItem[];
  searchVal: string;
  subPageSize: number;
  subPage: number;
  totalSubUnits?: number;
  totalSubPages?: number;
  handleViewImage?: (row: AssetRegisterRow, mediaType?: 'photo' | 'document') => void;
  handleEdit?: (row: AssetRegisterRow) => void;
  handlePrint?: (row: AssetRegisterRow) => void;
  handleSubunitSearchChange: (parentId: number, val: string) => void;
  handleSubunitPageSizeChange: (parentId: number, size: number) => void;
  handleSubunitPageChange: (parentId: number, page: number) => void;
}

export function AssetRegisterSubunitRow({
  row,
  subunits,
  searchVal,
  subPageSize,
  subPage,
  totalSubUnits,
  totalSubPages: totalSubPagesProp,
  handleViewImage,
  handleEdit,
  handlePrint,
  handleSubunitSearchChange,
  handleSubunitPageSizeChange,
  handleSubunitPageChange,
}: AssetRegisterSubunitRowProps) {
  const t = useTranslations('assetRegister');
  const pId = row.id ?? -1;

  const [localSearch, setLocalSearch] = useState(searchVal ?? '');
  const debouncedSearch = useDebounce(localSearch, 400);

  const prevServerSearchRef = useRef(searchVal);

  useEffect(() => {
    if (prevServerSearchRef.current !== searchVal) {
      prevServerSearchRef.current = searchVal;
      setLocalSearch(searchVal ?? '');
    }
  }, [searchVal]);

  useEffect(() => {
    const sanitized = sanitizeFilterInput(debouncedSearch);
    if (sanitized === (searchVal ?? '') || sanitized === prevServerSearchRef.current) {
      return;
    }
    prevServerSearchRef.current = sanitized;
    handleSubunitSearchChange(pId, sanitized);
  }, [debouncedSearch, searchVal, pId, handleSubunitSearchChange]);

  const totalCount = totalSubUnits ?? subunits.length;
  const totalSubPages = Math.max(1, totalSubPagesProp ?? Math.ceil(totalCount / subPageSize));
  const currentPage = Math.min(Math.max(1, subPage), totalSubPages);
  const startIndex = (currentPage - 1) * subPageSize;
  const endIndex = Math.min(startIndex + subunits.length, totalCount);

  return (
    <>
      {/* Banner Row matching Figma exactly */}
      <tr className="bg-gradient-to-r from-blue-100/90 via-blue-50/80 to-slate-100/90 border-y border-blue-200 text-xs shadow-2xs">
        <td colSpan={13} className="py-2 px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 shrink-0">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-blue-950 text-xs">
                {t('Sub_Units_under')}{' '}
                <span className="font-extrabold text-blue-900">{row.assetName}</span>
              </span>
              <Badge
                variant="outline"
                size="sm"
                className="inline-flex h-auto gap-0 border-0 bg-blue-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-2xs"
              >
                {t('Units_Total', { count: totalCount })}
              </Badge>
            </div>

            <div className="relative min-w-[200px] max-w-[280px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <Input
                naked
                value={localSearch}
                onChange={(e) => setLocalSearch(sanitizeFilterInput(e.target.value))}
                placeholder={t('Search_shop_placeholder')}
                className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition-all"
                type="text"
              />
            </div>

            <div className="flex items-center space-x-3 text-xs shrink-0">
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-medium">
                <span>{t('Show')}</span>
                <select
                  value={subPageSize}
                  onChange={(e) => handleSubunitPageSizeChange(pId, Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="1">{t('unit_one')}</option>
                  <option value="2">{t('unit_two')}</option>
                  <option value="5">{t('unit_five')}</option>
                  <option value="10">{t('unit_ten')}</option>
                  <option value="20">{t('unit_twenty')}</option>
                  <option value="50">{t('unit_fifty')}</option>
                </select>
              </div>

              <span className="text-[11px] font-semibold text-slate-600">
                {t('Showing_units_range', {
                  start: totalCount === 0 ? 0 : startIndex + 1,
                  end: endIndex,
                  total: totalCount,
                })}
              </span>

              <div className="flex items-center space-x-1">
                <PrevPageButton
                  disabled={currentPage <= 1}
                  onClick={() => handleSubunitPageChange(pId, currentPage - 1)}
                  className="!h-auto !p-1 !gap-0 !rounded !border-slate-300 !text-slate-700 hover:!bg-slate-50 disabled:!opacity-40 !shadow-2xs !transition-colors !duration-150 cursor-pointer focus:!ring-0 focus:!ring-offset-0 focus-visible:![outline-style:auto] [&_svg]:!w-3.5 [&_svg]:!h-3.5"
                  title={t('Previous_Units_Page')}
                  aria-label={t('Previous_Units_Page')}
                />
                <span className="px-2 py-0.5 text-xs font-extrabold text-blue-700 bg-white border border-blue-200 rounded">
                  {currentPage} / {totalSubPages}
                </span>
                <NextPageButton
                  disabled={currentPage >= totalSubPages}
                  onClick={() => handleSubunitPageChange(pId, currentPage + 1)}
                  className="!h-auto !p-1 !gap-0 !rounded !border-slate-300 !text-slate-700 hover:!bg-slate-50 disabled:!opacity-40 !shadow-2xs !transition-colors !duration-150 cursor-pointer focus:!ring-0 focus:!ring-offset-0 focus-visible:![outline-style:auto] [&_svg]:!w-3.5 [&_svg]:!h-3.5"
                  title={t('Next_Units_Page')}
                  aria-label={t('Next_Units_Page')}
                />
              </div>
            </div>
          </div>
        </td>
      </tr>

      {/* Sub-Unit Rows */}
      {subunits.length === 0 ? (
        <tr className="bg-[#f0f6ff]/40 text-xs border-b border-blue-100/60">
          <td colSpan={13} className="py-4 text-center text-slate-400 font-medium">
            {t('No_sub_units_found')}
          </td>
        </tr>
      ) : (
        subunits.map((unit) => (
          <SubunitDataRow
            key={`subunit-${unit.id}`}
            unit={unit}
            row={row}
            handleViewImage={handleViewImage}
            handleEdit={handleEdit}
            handlePrint={handlePrint}
          />
        ))
      )}
    </>
  );
}
