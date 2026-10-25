'use client';

import { useTranslations } from 'next-intl';
import { Eye, Pencil, Printer, MapPin } from 'lucide-react';
import { Badge, Tooltip, IconOnlyActionButton } from '@/components/common';
import type { AssetRegisterRow } from '@/types/asset/asset-register/municipal-asset-register.types';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';

interface TableRowBasicColumnsProps {
  row: AssetRegisterRow;
  handleViewDetails: (row: AssetRegisterRow) => void;
}

export function TableRowAssetColumn({ row, handleViewDetails }: TableRowBasicColumnsProps) {
  const t = useTranslations('assetRegister');

  return (
    <td className="py-2 px-3 relative group align-middle text-center sticky left-[102px] bg-white group-hover:bg-slate-50/50 group-hover:z-30 transition-colors z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
      <Tooltip
        content={row.address && row.address !== '-' ? row.address : null}
        placement="right"
        className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white rounded-xl shadow-lg border border-blue-300/30 text-xs font-semibold text-center leading-relaxed p-3 max-w-xs"
      >
        <div className="space-y-1 flex flex-col items-center justify-center text-center">
          <h3
            onClick={() => handleViewDetails(row)}
            className="font-bold text-[#1E3A8A] text-xs hover:underline cursor-pointer leading-snug text-center"
          >
            {row.assetName || row.assetCode}
          </h3>
          <Badge
            variant="success"
            size="sm"
            className="text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-700 border-emerald-200 rounded px-1.5 py-0.5 inline-block mx-auto"
          >
            {row.assetTypeName || t('Asset')}
          </Badge>
          <p className="text-[10px] text-slate-400 font-medium text-center">
            {t('MPMS_NO')}: <span className="font-semibold text-slate-600">{row.mpmsNo || t('Not_Available')}</span>
          </p>
        </div>
      </Tooltip>
    </td>
  );
}

interface TableRowActionsProps {
  row: AssetRegisterRow;
  handleViewDetails: (row: AssetRegisterRow) => void;
  handleEdit: (row: AssetRegisterRow) => void;
  handlePrint: (row: AssetRegisterRow) => void;
  handleGisMap: (row: AssetRegisterRow) => void;
}

export function TableRowActions({
  row,
  handleViewDetails,
  handleEdit,
  handlePrint,
  handleGisMap,
}: TableRowActionsProps) {
  const t = useTranslations('assetRegister');
  const { canView, canEdit, haveFullAccess } = useActivePagePermissions();

  const allowView = haveFullAccess || canView;
  const allowEdit = haveFullAccess || canEdit;

  return (
    <td className="py-2 px-2 text-center align-middle">
      <div className="flex items-center justify-center gap-1">
        {allowView && (
          <IconOnlyActionButton
            icon={Eye}
            onClick={() => handleViewDetails(row)}
            aria-label={t('View')}
            title={t('View')}
            className="!w-7 !h-7 !p-0 !min-w-0 !rounded !border-none !bg-[#3B82F6] hover:!bg-[#2563EB] !text-white !shadow-2xs cursor-pointer transition-all [&_svg]:!w-3.5 [&_svg]:!h-3.5"
          />
        )}
        {allowEdit && (
          <IconOnlyActionButton
            icon={Pencil}
            onClick={() => handleEdit(row)}
            aria-label={t('Edit_Asset') || 'Edit Asset'}
            title={t('Edit_Asset') || 'Edit Asset'}
            className="!w-7 !h-7 !p-0 !min-w-0 !rounded !border-none !bg-[#10B981] hover:!bg-[#059669] !text-white !shadow-2xs cursor-pointer transition-all [&_svg]:!w-3.5 [&_svg]:!h-3.5"
          />
        )}
        {allowView && (
          <IconOnlyActionButton
            icon={Printer}
            onClick={() => handlePrint(row)}
            aria-label={t('Print_Report') || 'Print Report'}
            title={t('Print_Report') || 'Print Report'}
            className="!w-7 !h-7 !p-0 !min-w-0 !rounded !border-none !bg-[#8B5CF6] hover:!bg-[#7C3AED] !text-white !shadow-2xs cursor-pointer transition-all [&_svg]:!w-3.5 [&_svg]:!h-3.5"
          />
        )}
        {allowView && (
          <IconOnlyActionButton
            icon={MapPin}
            onClick={() => handleGisMap(row)}
            aria-label={t('View_On_Map') || 'View on Map'}
            title={t('View_On_Map') || 'View on Map'}
            className="!w-7 !h-7 !p-0 !min-w-0 !rounded !border-none !bg-[#F59E0B] hover:!bg-[#D97706] !text-white !shadow-2xs cursor-pointer transition-all [&_svg]:!w-3.5 [&_svg]:!h-3.5"
          />
        )}
      </div>
    </td>
  );
}
