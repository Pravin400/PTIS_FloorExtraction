'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight, Building2 } from 'lucide-react';
import { Badge, Button, IconOnlyActionButton } from '@/components/common';
import type { AssetRegisterRow } from '@/types/asset/asset-register/municipal-asset-register.types';
import { TableRowAssetColumn, TableRowActions } from './AssetRegisterTableRowColumns';
import { TableRowMiddleColumns } from './TableRowMiddleColumns';

interface AssetRegisterTableRowProps {
  row: AssetRegisterRow;
  isExpanded: boolean;
  subUnitCount: number;
  handleToggleExpand: (row: AssetRegisterRow) => void;
  handleViewImage: (row: AssetRegisterRow, mediaType?: 'photo' | 'document') => void;
  handleViewDetails: (row: AssetRegisterRow) => void;
  handleEdit: (row: AssetRegisterRow) => void;
  handlePrint: (row: AssetRegisterRow) => void;
  handleGisMap: (row: AssetRegisterRow) => void;
}

export function AssetRegisterTableRow({
  row,
  isExpanded,
  subUnitCount,
  handleToggleExpand,
  handleViewImage,
  handleViewDetails,
  handleEdit,
  handlePrint,
  handleGisMap,
}: AssetRegisterTableRowProps) {
  const t = useTranslations('assetRegister');

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 relative bg-white">
      {/* 1. Expand arrow + SubUnit count */}
      <td className="py-2 px-2 text-center relative overflow-hidden align-middle sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 border-r border-slate-100">
        <div className="flex items-center justify-center space-x-1">
          {subUnitCount > 0 ? (
            <IconOnlyActionButton
              icon={ChevronRight}
              variant="ghost"
              size="xs"
              onClick={() => handleToggleExpand(row)}
              className={`!h-auto !p-1 !gap-0 !rounded-full border border-blue-200 !text-blue-600 hover:!bg-blue-50 !transition-colors !duration-150 cursor-pointer focus:!ring-0 focus:!ring-offset-0 focus-visible:![outline-style:auto] [&_svg]:transition-transform [&_svg]:duration-200 ${
                isExpanded ? '!bg-blue-50 [&_svg]:rotate-90 [&_svg]:text-blue-700' : ''
              }`}
              title={isExpanded ? t('Collapse_Asset_Details') : t('Expand_Asset_Details')}
              aria-label={isExpanded ? t('Collapse_Asset_Details') : t('Expand_Asset_Details')}
            />
          ) : (
            <span className="w-5 h-5 block" />
          )}
          {subUnitCount > 0 && (
            <Badge
              variant="outline"
              size="sm"
              className="flex w-4.5 h-4.5 px-0 py-0 justify-center gap-0 rounded-full bg-blue-50 text-blue-700 font-bold text-[9px] shrink-0 border border-blue-100"
              title={`${subUnitCount} ${t('Sub_Units') || 'Sub-Units'}`}
            >
              {subUnitCount}
            </Badge>
          )}
        </div>
      </td>

      {/* 2. Photo thumbnail */}
      <td className="py-2 px-3 text-center align-middle sticky left-8 bg-white group-hover:bg-slate-50/50 transition-colors z-10 border-r border-slate-100">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleViewImage(row, 'photo')}
          className="group relative !w-[75px] !h-[50px] !min-w-0 !p-0 !gap-0 !rounded-lg overflow-hidden !bg-slate-50 border !border-slate-200/80 !shadow-2xs shrink-0 !flex items-center justify-center cursor-pointer hover:!ring-2 hover:!ring-blue-500 focus:!ring-2 focus:!ring-blue-500 focus:!ring-offset-0 !transition-all !duration-200 !text-left [&>span]:contents"
          title={t('Photo') || 'View Asset Photo'}
          aria-label={t('Photo') || 'View Asset Photo'}
        >
          <div
            className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500"
            title={t('No_Image') || 'No Image Present'}
          >
            <div className="flex flex-col items-center justify-center gap-1 p-1">
              <Building2 className="w-5 h-5 opacity-40 text-slate-600" />
              <span className="text-[8px] font-medium opacity-70 text-center leading-none">
                {Number(row.photoCount) > 0 ? `${row.photoCount} ${t('Photo') || 'Photos'}` : t('No_Image') || 'No Image'}
              </span>
            </div>
          </div>
        </Button>
      </td>

      {/* 3. Asset with Tooltip */}
      <TableRowAssetColumn row={row} handleViewDetails={handleViewDetails} />

      {/* 4-11. Middle Columns */}
      <TableRowMiddleColumns row={row} subUnitCount={subUnitCount} />

      {/* 12. Documents */}
      <td className="py-2.5 px-3 text-center align-middle border-r border-slate-100">
        <div className="space-y-1 text-xs text-center flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleViewImage(row, 'photo')}
              className="!inline-block !h-auto !px-2 !py-0.5 !gap-0 !rounded-full !text-[10px] !font-bold !whitespace-normal !transition-colors !duration-150 !bg-[#EFF6FF] !text-[#1D4ED8] border !border-[#BFDBFE] cursor-pointer !shadow-3xs hover:!bg-[#DBEAFE] focus:!ring-1 focus:!ring-offset-0 focus:!ring-blue-500"
            >
              {t('Photo_Short') || 'Photo'} {row.photoCount || 0}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleViewImage(row, 'document')}
              className="!inline-block !h-auto !px-2 !py-0.5 !gap-0 !rounded-full !text-[10px] !font-bold !whitespace-normal !transition-colors !duration-150 !bg-[#F1F5F9] !text-[#475569] border !border-[#E2E8F0] cursor-pointer !shadow-3xs hover:!bg-[#E2E8F0] focus:!ring-1 focus:!ring-offset-0 focus:!ring-slate-400"
            >
              {t('Docs_Short') || 'Docs'} {row.documentCount || 0}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold leading-tight pt-0.5 text-center">
            {t('Plan_Title_Survey') || 'Plan • Title • Survey'}
          </p>
        </div>
      </td>

      {/* 13. Actions */}
      <TableRowActions
        row={row}
        handleViewDetails={handleViewDetails}
        handleEdit={handleEdit}
        handlePrint={handlePrint}
        handleGisMap={handleGisMap}
      />
    </tr>
  );
}
