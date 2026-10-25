import { CheckCircle2, Eye, FileCheck, Home, Building2, Paperclip, Pencil } from 'lucide-react';
import { Checkbox, type Column } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { getDocumentBlobUrl } from '@/lib/utils/document-client-utils';
import { toast } from 'sonner';
import type { UnitRow, ViewerData } from './building-permission.types';
import type { UnitSelectionItem } from '@/types/building-permission.types';

interface UseUnitTableColumnsParams {
  filteredUnits: UnitSelectionItem[];
  selectedUnitIds: Set<number>;
  isAllUnitsSelected: boolean;
  hasSelectableUnits?: boolean;
  handleToggleAllUnits: (forceSelect?: boolean) => void;
  handleToggleUnitSelection: (row: UnitRow) => void;
  handleEditUnit?: (row: UnitRow) => void;
  setViewerData: (data: ViewerData | null) => void;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useUnitTableColumns(params: UseUnitTableColumnsParams): Column<UnitRow>[] {
  const {
    filteredUnits,
    selectedUnitIds,
    isAllUnitsSelected,
    hasSelectableUnits = true,
    handleToggleAllUnits,
    handleToggleUnitSelection,
    handleEditUnit,
    setViewerData,
    locale,
    t,
  } = params;

  return [
    {
      key: 'propertyDetailsId',
      label: (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isAllUnitsSelected}
            onCheckedChange={handleToggleAllUnits}
            disabled={filteredUnits.length === 0 || !hasSelectableUnits}
            className={cn((filteredUnits.length === 0 || !hasSelectableUnits) && 'opacity-50 cursor-not-allowed')}
          />
        </div>
      ),
      width: '40px',
      align: 'center',
      render: (_, row) => {
        const isDirectApplied = row.certStatus === 'direct';
        const isSelected = selectedUnitIds.has(row.propertyDetailsId as number) || (row.propertyId != null && selectedUnitIds.has(row.propertyId as number));
        return (
          <label
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'inline-flex items-center justify-center p-1 rounded',
              isDirectApplied ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            )}
            title={
              isDirectApplied
                ? t('building.unitAlreadyAppliedTooltip') || 'Unit is already applied. Click Edit icon to modify.'
                : undefined
            }
          >
            <Checkbox
              checked={isSelected}
              disabled={isDirectApplied}
              onCheckedChange={() => {
                if (isDirectApplied) return;
                handleToggleUnitSelection(row);
              }}
            />
          </label>
        );
      },
    },
    {
      key: 'unitNo',
      label: t('building.unit') || 'UNIT',
      render: (val, row) => {
        const isDirectApplied = row.certStatus === 'direct';
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-blue-900">{String(val || '')}</span>
            {isDirectApplied && (
              <span
                className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 text-[10px] font-semibold flex-shrink-0"
                title={
                  row.fileName
                    ? `${t('building.uploadedDoc') || 'Document'}: ${row.fileName}`
                    : t('building.directCertTooltip') || 'Certificate document uploaded for this unit'
                }
              >
                <Paperclip className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{t('building.uploaded') || 'Uploaded'}</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'wingName',
      label: t('building.wing') || 'WING',
      render: (val) => <span className="font-semibold text-slate-700">{String(val || '')}</span>,
    },
    {
      key: 'certStatus',
      label: t('building.certificateStatus') || 'CERTIFICATE STATUS',
      render: (_, row) => {
        if (row.certStatus === 'direct') {
          return (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap"
              title={row.certNumber ? `Direct Certificate: #${row.certNumber}` : 'Applied'}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <FileCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="font-mono text-[11px] truncate max-w-[150px]">
                {row.certNumber ? `#${row.certNumber}` : t('building.statusApplied') || 'Applied'}
              </span>
            </span>
          );
        }
        if (row.certStatus === 'wing') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">
              <Home className="w-3 h-3 text-sky-600 shrink-0" />
              <span>{t('building.statusWingCovered') || 'Wing Covered'}</span>
            </span>
          );
        }
        if (row.certStatus === 'apartment') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">
              <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
              <span>{t('building.statusApartmentCovered') || 'Apartment Covered'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal bg-slate-50 text-slate-500 border border-slate-200 whitespace-nowrap">
            {t('building.statusNotApplied') || 'Not Applied'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: t('common.actions') || 'ACTION',
      align: 'center',
      width: '100px',
      render: (_, row) => {
        const hasDoc = Boolean(row.hasDocument || row.documentGuid);
        const isSelected = selectedUnitIds.has(row.propertyDetailsId as number) || (row.propertyId != null && selectedUnitIds.has(row.propertyId as number));
        return (
          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-lg shadow-2xs cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95',
                isSelected
                  ? 'text-blue-700 bg-blue-100 border-2 border-blue-500 ring-2 ring-blue-400/40'
                  : 'text-blue-600 bg-blue-50/90 hover:bg-blue-100 hover:text-blue-800 border border-blue-200'
              )}
              title={
                isSelected
                  ? t('building.cancelEditUnit') || 'Cancel edit / unselect this unit'
                  : t('common.edit') || 'Edit Unit Certificate'
              }
              aria-label={t('common.edit') || 'Edit Unit Certificate'}
              onClick={() => {
                if (handleEditUnit) {
                  handleEditUnit(row);
                } else {
                  handleToggleUnitSelection(row);
                }
              }}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!hasDoc}
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150',
                hasDoc
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-300 shadow-2xs cursor-pointer hover:scale-105 active:scale-95'
                  : 'text-slate-300 bg-slate-50 border border-slate-200 cursor-not-allowed opacity-50'
              )}
              title={hasDoc ? t('common.view') || 'View Document' : t('building.noDocumentAttached') || 'No document attached'}
              aria-label={hasDoc ? t('common.view') || 'View Document' : t('building.noDocumentAttached') || 'No document attached'}
              onClick={async () => {
                if (!row.documentGuid) return;
                try {
                  const { url } = await getDocumentBlobUrl(row.documentGuid, locale);
                  setViewerData({ isOpen: true, url, name: row.fileName || `Unit ${row.unitNo} Document` });
                } catch {
                  toast.error(t('building.viewError') || 'Failed to view document');
                }
              }}
            >
              <Eye className={cn('w-4 h-4', hasDoc ? 'text-emerald-600' : 'text-slate-300')} />
            </button>
          </div>
        );
      },
    },
  ];
}
