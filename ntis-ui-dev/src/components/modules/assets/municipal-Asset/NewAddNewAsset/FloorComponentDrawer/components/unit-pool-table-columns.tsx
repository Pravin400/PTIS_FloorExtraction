import { Home, TreeDeciduous, Sparkles, CheckCircle2, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, Button, type FloorDetailsTableColumn } from '@/components/common';
import { typeBadge } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-utils';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';
import type { UnitPoolTableRowData, UnitPoolTableColumnsArgs } from '@/types/asset/floor-details.types';

const FOCUS_RING_RESET = 'focus:ring-0! focus:ring-offset-0!';

function factorColumn(key: string, label: string, valueKey: string): FloorDetailsTableColumn<UnitPoolTableRowData> {
  return {
    key,
    label,
    headerRender: plainHeader(label),
    headerClassName: 'text-center',
    cellClassName: 'text-center font-mono text-xs font-semibold text-slate-600',
    render: (row) => {
      const val = (row.original as Record<string, unknown>)?.[valueKey];
      return val ? Number(val).toFixed(2) : '—';
    },
  };
}

function plainHeader(label: React.ReactNode) {
  const HeaderComponent = () => (
    <span className="text-xs font-black uppercase tracking-widest text-[#1d4ed8] whitespace-nowrap">{label}</span>
  );
  HeaderComponent.displayName = 'PlainHeaderUnitPool';
  return HeaderComponent;
}

function buildLabelMap(options: { value?: string | number; label?: string }[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  (options || []).forEach((o) => {
    if (o.value !== undefined && o.label !== undefined) {
      map.set(String(o.value), String(o.label));
    }
  });
  return map;
}


/**
 * Column definitions for the Unit Pool table. Split from UnitPoolTable
 * purely to stay under the file line-count limit.
 */
export function buildUnitPoolTableColumns({
  activePage,
  PAGE_SIZE,
  setActiveUnit,
  handleRemove,
  editEventRegistry,
  confirm,
  t,
  dropdownOptions,
  isScrolledRight,
  
  
}: UnitPoolTableColumnsArgs): FloorDetailsTableColumn<UnitPoolTableRowData>[] {
  const scrollToggle = () => {
    // scroll toggle handled via container event
  };

  return [
    {
      key: 'srNo',
      label: t('floorDetails.srNo') || 'Sr. No.',
      headerRender: plainHeader(t('floorDetails.srNo') || 'Sr. No.'),
      headerClassName: 'text-center w-16',
      cellClassName: 'text-center text-slate-500 font-semibold',
      render: (_row, index) => (activePage - 1) * PAGE_SIZE + index + 1,
    },
    {
      key: 'unitNumber',
      label: t('floorDetails.unitNumber'),
      headerRender: plainHeader(t('floorDetails.unitNumber')),
      cellClassName: 'text-left font-bold text-slate-800',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {String(row.type || '').toLowerCase().includes('room') && <Home className="size-3.5 text-blue-500 shrink-0" />}
          {String(row.type || '').toLowerCase().includes('open') && <TreeDeciduous className="size-3.5 text-emerald-500 shrink-0" />}
          {String(row.type || '').toLowerCase().includes('amenit') && <Sparkles className="size-3.5 text-violet-500 shrink-0" />}
          <span className="whitespace-nowrap">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: t('floorDetails.type'),
      headerRender: plainHeader(t('floorDetails.type')),
      cellClassName: 'text-left',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${typeBadge[row.type] || 'bg-slate-100 text-slate-600'}`}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'floor',
      label: t('floorDetails.floor'),
      headerRender: plainHeader(t('floorDetails.floor')),
      cellClassName: 'text-left font-semibold text-slate-600',
      render: (row) => row.floorLabel || '—',
    },
    {
      key: 'subFloor',
      label: t('floorDetails.subFloor') || 'Sub Floor',
      headerRender: plainHeader(t('floorDetails.subFloor') || 'Sub Floor'),
      cellClassName: 'text-left font-semibold text-slate-800',
      render: (row) => row.original.subFloorName || row.original.subFloorId || '-',
    },
    {
      key: 'conYr',
      label: t('floorDetails.conYr') || 'Con Yr',
      headerRender: plainHeader(t('floorDetails.conYr') || 'Con Yr'),
      cellClassName: 'text-left font-mono font-bold text-slate-800',
      render: (row) => row.original.conYear || row.original.constructionYear || '-',
    },
    {
      key: 'asstYr',
      label: t('floorDetails.asstYr') || 'Asst Yr',
      headerRender: plainHeader(t('floorDetails.asstYr') || 'Asst Yr'),
      cellClassName: 'text-left font-mono font-bold text-slate-800',
      render: (row) => row.original.assessmentYear || '-',
    },
    {
      key: 'conType',
      label: t('floorDetails.conType') || 'Con Type',
      headerRender: plainHeader(t('floorDetails.conType') || 'Con Type'),
      cellClassName: 'text-left font-semibold text-slate-800',
      render: (row) => buildLabelMap(dropdownOptions?.constructionTypes).get(String(row.original.conType)) || row.original.conType || '-',
    },
    {
      key: 'typeOfUse',
      label: t('floorDetails.typeOfUse') || 'Type of Use',
      headerRender: plainHeader(t('floorDetails.typeOfUse') || 'Type of Use'),
      cellClassName: 'text-left font-semibold text-slate-800',
      render: (row) => buildLabelMap(dropdownOptions?.useTypes).get(String(row.original.useType)) || row.original.useType || '-',
    },
    {
      key: 'subTypeOfUse',
      label: t('floorDetails.subTypeOfUse') || 'Sub Type of Use',
      headerRender: plainHeader(t('floorDetails.subTypeOfUse') || 'Sub Type of Use'),
      cellClassName: 'text-left font-semibold text-slate-800',
      render: (row) => row.original.subTypeOfUseName || (dropdownOptions?.subUseTypes ? buildLabelMap(dropdownOptions.subUseTypes).get(String(row.original.subUseType)) : undefined) || (row.original.subUseType && isNaN(Number(row.original.subUseType)) ? row.original.subUseType : null) || '-',
    },
    {
      key: 'renter',
      label: t('floorDetails.renter') || 'Renter',
      headerRender: plainHeader(t('floorDetails.renter') || 'Renter'),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.original.isRented ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
          {row.original.isRented ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'rooms',
      label: t('floorDetails.rooms') || 'Rooms',
      headerRender: plainHeader(t('floorDetails.rooms') || 'Rooms'),
      headerClassName: 'text-center',
      cellClassName: 'text-center font-bold text-slate-800',
      render: (row) => row.original.rooms?.length || 0,
    },
    {
      key: 'carpetArea',
      label: t('floorDetails.carpetAreaSqFtSqM') || 'Carpet (SqFt / SqM)',
      headerRender: plainHeader(t('floorDetails.carpetAreaSqFtSqM') || 'Carpet (SqFt / SqM)'),
      headerClassName: 'text-center',
      cellClassName: 'text-center font-mono font-bold text-[#2d42db] whitespace-nowrap',
      render: (row) => {
        const carpetSqFt = Number(row.original.carpetAreaSqFeet || row.area || 0);
        return carpetSqFt > 0 ? `${carpetSqFt.toFixed(2)} / ${(carpetSqFt / 10.7639).toFixed(2)}` : <span className="text-slate-400 italic text-[9px]">{t('floorDetails.pending') || 'pending'}</span>;
      },
    },
    {
      key: 'builtupArea',
      label: t('floorDetails.builtupSqFtSqM') || 'Builtup (SqFt / SqM)',
      headerRender: plainHeader(t('floorDetails.builtupSqFtSqM') || 'Builtup (SqFt / SqM)'),
      headerClassName: 'text-center',
      cellClassName: 'text-center font-mono font-bold text-emerald-700 whitespace-nowrap',
      render: (row) => {
        const builtupSqFt = Number(row.original.carpetAreaSqFeet || row.area || 0) * 1.2;
        return builtupSqFt > 0 ? `${builtupSqFt.toFixed(2)} / ${(builtupSqFt / 10.7639).toFixed(2)}` : '—';
      },
    },
    {
      key: 'sdrr',
      label: t('floorDetails.sdrr'),
      headerRender: plainHeader(t('floorDetails.sdrr')),
      headerClassName: 'text-center',
      cellClassName: 'text-center font-mono text-xs font-semibold text-slate-600',
      render: (row) => {
        const val = (row.original as Record<string, unknown>)?.cvBaseRate;
        return val ? Number(val).toLocaleString() : '—';
      },
    },
    {
      key: 'baseValue',
      label: t('floorDetails.baseValue'),
      headerRender: plainHeader(t('floorDetails.baseValue')),
      headerClassName: 'text-center',
      cellClassName: 'text-center font-mono text-xs font-semibold text-slate-600',
      render: (row) => {
        const val = (row.original as Record<string, unknown>)?.baseValue;
        return val ? Number(val).toLocaleString() : '—';
      },
    },
    factorColumn('floorFactor', t('floorDetails.floorFactor'), 'cvFloorFactor'),
    factorColumn('ageFactor', t('floorDetails.ageFactor'), 'cvAgeFactor'),
    factorColumn('ntbFactor', t('floorDetails.ntbFactor'), 'cvNatureFactor'),
    factorColumn('useFactor', t('floorDetails.useFactor'), 'cvUseFactor'),
    {
      key: 'capitalValue',
      label: t('floorDetails.capitalValue'),
      headerRender: plainHeader(t('floorDetails.capitalValue')),
      headerClassName: 'text-center',
      cellClassName: 'text-center font-mono text-xs font-bold text-indigo-700 bg-indigo-50/30',
      render: (row) => {
        const val = (row.original as Record<string, unknown>)?.capitalValue as string | number | undefined;
        return val ? formatIndianCurrencyAbbreviated(val, t) : '—';
      },
    },
    {
      key: 'status',
      label: t('floorDetails.status'),
      headerRender: plainHeader(t('floorDetails.status')),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (row) =>
        row.isSaved && !row.isModified ? (
          <span title="Saved to database">
            <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
          </span>
        ) : row.isModified ? (
          <span className="text-xs font-bold text-amber-600 uppercase">{t('floorDetails.modified')}</span>
        ) : (
          <span className="text-xs font-bold text-slate-400 uppercase">{t('floorDetails.pending')}</span>
        ),
    },
    {
      key: 'actions',
      label: t('floorDetails.actions'),
      headerRender: plainHeader(t('floorDetails.actions')),
      headerClassName: 'text-center sticky right-[36px] min-w-[150px] max-w-[150px] w-[150px] bg-[#EDF5FF] z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] border-l border-[#A3CBFA]',
      cellClassName: 'text-center py-1.5 sticky right-[36px] min-w-[150px] max-w-[150px] w-[150px] bg-white z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] border-l border-slate-200',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Tooltip placement="top" content={t('floorDetails.addDetails') || 'Configure Unit Details'}>
            <button
              onClick={() => {
                const childId = row.original.dbId;
                if (editEventRegistry?.current?.triggerEdit && childId) {
                  editEventRegistry.current.triggerEdit(Number(childId));
                } else {
                  setActiveUnit(row.original);
                }
              }}
              className="text-blue-600 hover:text-[#2435c2] transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip placement="top" content={t('floorDetails.deleteUnit') || 'Delete Unit'}>
            <button
              onClick={async () => {
                confirm({
                  title: t('floorDetails.deleteUnit') || 'Delete Unit',
                  description:
                    t('floorDetails.deleteUnitConfirm', { unitNumber: row.name }) ||
                    `Are you sure you want to delete unit ${row.name}?`,
                  confirmText: t('buttons.delete') || 'Delete',
                  variant: 'delete',
                  onConfirm: () => {
                    handleRemove(row.original.tempId);
                  },
                });
              }}
              className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'scrollToggle',
      label: '',
      headerRender: () => (
        <div className="flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={isScrolledRight ? ChevronLeft : ChevronRight}
            onClick={scrollToggle}
            title={isScrolledRight ? 'Scroll Left' : 'Scroll Right'}
            className={`inline-flex! h-6! w-8! p-0! rounded-md! border! border-blue-400/30! bg-blue-500! shadow-sm! text-white! hover:bg-blue-600! cursor-pointer ${FOCUS_RING_RESET}`}
          />
        </div>
      ),
      headerClassName: 'py-2 px-2 text-center sticky right-0 w-[36px] min-w-[36px] max-w-[36px] bg-[#EDF5FF] z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] border-l border-[#A3CBFA]',
      cellClassName: 'py-1.5 px-2 text-center sticky right-0 w-[36px] min-w-[36px] max-w-[36px] bg-white z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] border-l border-slate-200',
      render: () => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={isScrolledRight ? ChevronLeft : ChevronRight}
          onClick={scrollToggle}
          title={isScrolledRight ? 'Scroll Left' : 'Scroll Right'}
          className={`inline-flex! h-auto! w-auto! p-1! rounded! border! border-slate-300! bg-white! shadow-sm! text-slate-700! hover:border-blue-500! cursor-pointer ${FOCUS_RING_RESET}`}
        />
      ),
    },
  ];
}
