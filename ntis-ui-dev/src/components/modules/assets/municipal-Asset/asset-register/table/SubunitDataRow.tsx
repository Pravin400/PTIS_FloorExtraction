'use client';

import { useTranslations } from 'next-intl';
import { Pencil, Building2, Printer } from 'lucide-react';
import { Badge, Button, IconOnlyActionButton } from '@/components/common';
import type { AssetRegisterRow } from '@/types/asset/asset-register/municipal-asset-register.types';
import type { AssetRegisterSubUnitItem } from '@/lib/api/asset/asset-register/municipal-asset-register.service';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';
import { mapSubUnitToAssetRegisterRow } from '../registerMappers';

interface SubunitDataRowProps {
  unit: AssetRegisterSubUnitItem;
  row: AssetRegisterRow;
  handleViewImage?: (row: AssetRegisterRow, mediaType?: 'photo' | 'document') => void;
  handleEdit?: (row: AssetRegisterRow) => void;
  handlePrint?: (row: AssetRegisterRow) => void;
}

export function SubunitDataRow({ unit, row, handleViewImage, handleEdit, handlePrint }: SubunitDataRowProps) {
  const t = useTranslations('assetRegister');
  const { canView, canEdit, haveFullAccess } = useActivePagePermissions();
  const allowView = haveFullAccess || canView;
  const allowEdit = haveFullAccess || canEdit;

  const mappedSubUnitRow = mapSubUnitToAssetRegisterRow(unit, row);

  return (
    <tr
      key={`subunit-${unit.id}`}
      className="bg-[#f0f6ff]/90 hover:bg-[#e4efff] group transition-colors border-b border-blue-100/70 border-l-4 border-l-blue-500 text-xs"
    >
      <td className="py-2.5 px-2 text-center align-middle sticky left-0 bg-[#f0f6ff]/90 group-hover:bg-[#e4efff] transition-colors z-10 border-r border-blue-100/60">
        <span className="text-blue-600 font-black text-sm select-none" title={`${t('Sub_Units')} ${row.assetName}`}>
          {'↳'}
        </span>
      </td>
      <td className="py-2 px-3 text-center align-middle sticky left-8 bg-[#f0f6ff]/90 group-hover:bg-[#e4efff] transition-colors z-10 border-r border-blue-100/60">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleViewImage?.(mappedSubUnitRow, 'photo')}
          className="group relative !w-full !h-[50px] !min-w-0 !p-0 !gap-0 !rounded-lg overflow-hidden !bg-slate-50 border !border-slate-200/80 !shadow-2xs shrink-0 !flex items-center justify-center cursor-pointer hover:!border-blue-400 hover:!shadow-xs !transition-all !duration-200 !text-left focus:!ring-0 focus:!ring-offset-0 focus-visible:![outline-style:auto] [&>span]:contents"
          title={t('View_Media')}
        >
          <div className="flex flex-col items-center justify-center text-[8px] text-slate-400 font-bold leading-none gap-0.5 group-hover:text-blue-600">
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span>{(unit.photoCount ?? 0) > 0 ? `${unit.photoCount} ${t('Photo')}` : t('No_Image')}</span>
          </div>
        </Button>
      </td>
      <td className="py-2 px-3 relative group align-middle text-center sticky left-[102px] bg-[#f0f6ff]/90 group-hover:bg-[#e4efff] transition-colors z-10 border-r border-blue-100/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
        <div className="space-y-1 flex flex-col items-center justify-center text-center">
          <h4 className="font-bold text-[#1E3A8A] text-xs leading-snug text-center">
            {unit.assetName || unit.assetNo || t('Sub_Units')}
          </h4>
          {unit.floorName && (
            <p className="text-[10px] text-slate-500 font-medium text-center">
              {t('Floor')}: <span className="font-semibold text-slate-700">{unit.floorName}</span>
            </p>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2.5 text-slate-700 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-slate-800">{unit.assetTypeName || unit.names?.type || '-'}</p>
          <p className="text-[10px] text-slate-500 font-semibold">
            {t('CTS_Survey')}: <span className="text-slate-700">{row.csn || '-'}</span>
          </p>
          {(unit.constructionYear || unit.assessmentYear) && (
            <p className="text-[10px] text-slate-400 font-medium">
              {t('Constructed')}: <span className="font-semibold text-slate-600">{unit.constructionYear || '—'}{unit.assessmentYear ? ` (${t('Assessment')}: ${unit.assessmentYear})` : ''}{unit.constructionTypeName ? ` • ${unit.constructionTypeName}` : ''}</span>
            </p>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2.5 text-slate-700 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-slate-800">{row.ownershipType || '-'}</p>
          <p className="text-[10px] text-slate-500 font-semibold">
            {t('Custodian')}: <span className="text-slate-700">{row.departmentName || '-'}</span>
          </p>
        </div>
      </td>
      <td className="py-2.5 px-2.5 text-slate-700 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-0.5 text-xs text-center flex flex-col items-center justify-center">
          <p className="font-bold text-slate-800">
            {unit.typeOfUseName || unit.occupancyStatus || unit.occupancy || '-'}
          </p>
          {unit.noOfRooms != null && (
            <p className="text-[10px] text-slate-500 font-medium">
              {t('Rooms')}: <span className="font-semibold text-slate-700">{unit.noOfRooms}</span>
            </p>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2.5 text-slate-700 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-slate-800">
            {t('Area')}: {unit.carpetAreaSqMeter ? `${unit.carpetAreaSqMeter} m²` : '—'}
            {unit.carpetAreaSqFeet != null && unit.carpetAreaSqFeet > 0 ? ` (${Number(unit.carpetAreaSqFeet).toLocaleString('en-IN')} ft²)` : ''}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold">
            {t('Constructed')}: <span className="text-slate-700">{unit.builtUpAreaSqMeter ? `${unit.builtUpAreaSqMeter} m²` : '—'}{unit.builtUpAreaSqFeet != null && unit.builtUpAreaSqFeet > 0 ? ` (${Number(unit.builtUpAreaSqFeet).toLocaleString('en-IN')} ft²)` : ''}</span>
          </p>
        </div>
      </td>
      <td className="py-2.5 px-2.5 text-slate-700 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-1 text-xs text-center flex flex-col items-center justify-center">
          <div>
            <Badge
              variant="outline"
              size="sm"
              className={`inline-block h-auto gap-0 px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-3xs ${
                unit.status?.toLowerCase() === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : unit.status?.toLowerCase() === 'inactive'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {unit.status || '-'}
            </Badge>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-2.5 text-slate-700 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-1 text-xs text-center flex flex-col items-center justify-center">
          <div>
            <Badge variant="outline" size="sm" className="inline-block h-auto gap-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shadow-3xs uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200">
              {unit.isRented != null ? (unit.isRented ? t('Rented') : t('Self_Occupied')) : '-'}
            </Badge>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-2.5 text-slate-700 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-1 text-xs text-center">
          <span className="text-slate-500 font-medium">-</span>
        </div>
      </td>
      <td className="py-2.5 px-2.5 align-middle text-center border-r border-blue-100/60">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-[#1E3A8A] text-xs">
            {unit.capitalValue ? `₹ ${Number(unit.capitalValue).toLocaleString('en-IN')}` : '₹ 0'}
          </p>
        </div>
      </td>
      <td className="py-2.5 px-3 text-center align-middle border-r border-blue-100/60">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleViewImage?.(mappedSubUnitRow, 'document')}
          className="!inline-flex !items-center !justify-center !gap-1 !h-auto !px-2 !py-0.5 !rounded-full !text-[10px] !font-bold !whitespace-normal !duration-150 mx-auto border !bg-[#F1F5F9] !text-[#475569] !border-[#E2E8F0] hover:!bg-blue-50 hover:!text-blue-700 hover:!border-blue-300 cursor-pointer focus:!ring-0 focus:!ring-offset-0 focus-visible:![outline-style:auto]"
          title={t('View_Media')}
        >
          {t('Docs_Short')} {unit.documentCount ?? 0}
        </Button>
      </td>
      <td className="py-2.5 px-3 text-center align-middle">
        <div className="flex items-center justify-center gap-1">
          {allowEdit && (
            <IconOnlyActionButton
              icon={Pencil}
              onClick={() => handleEdit?.(mappedSubUnitRow)}
              aria-label={t('Edit_Asset') || 'Edit Asset'}
              title={t('Edit_Asset') || 'Edit Asset'}
              className="!w-7 !h-7 !p-0 !min-w-0 !rounded !border-none !bg-[#10B981] hover:!bg-[#059669] !text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs [&_svg]:!w-3.5 [&_svg]:!h-3.5"
            />
          )}
          {allowView && (
            <IconOnlyActionButton
              icon={Printer}
              onClick={() => handlePrint?.(mappedSubUnitRow)}
              aria-label={t('Print_Report') || 'Print Report'}
              title={t('Print_Report') || 'Print Report'}
              className="!w-7 !h-7 !p-0 !min-w-0 !rounded !border-none !bg-[#8B5CF6] hover:!bg-[#7C3AED] !text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs [&_svg]:!w-3.5 [&_svg]:!h-3.5"
            />
          )}
        </div>
      </td>
    </tr>
  );
}
