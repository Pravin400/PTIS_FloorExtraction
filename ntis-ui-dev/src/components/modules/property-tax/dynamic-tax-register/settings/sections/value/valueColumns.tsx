import { Input } from '@/components/common';
import type { Column } from '@/components/common/MasterTable';
import { ValueBasedTaxRow } from '@/types/dynamic-tax-register.types';
import { GROUP_BADGE } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';

export interface GetValueColumnsParams {
  yearLabelById: (id: number | null | undefined) => string;
  valBaseType: 'RV' | 'ALV';
  setValPercent: (rowId: number, val: string) => void;
  labels: {
    typeOfUse: string;
    description: string;
    assessmentYear: string;
    userGroup: string;
    baseColumnType: string;
    taxPercent: string;
    unsavedRowAria: string;
  };
}

export function getValueColumns({ yearLabelById, valBaseType, setValPercent, labels }: GetValueColumnsParams): Column<ValueBasedTaxRow>[] {
  return [
    {
      key: 'typeOfUseCode',
      label: labels.typeOfUse,
      width: '96px',
      align: 'left',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1.5">
          {/* Negative ids are this screen's convention for "seeded locally, not yet saved" (see
              buildSeededRows) — otherwise indistinguishable from a real, already-persisted row. */}
          {(row as ValueBasedTaxRow).id < 0 && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
              title={labels.unsavedRowAria}
              aria-label={labels.unsavedRowAria}
            />
          )}
          <span className="font-extrabold text-blue-600 text-[12px] tracking-wide">{String(val ?? '')}</span>
        </span>
      ),
    },
    { key: 'description', label: labels.description, align: 'left', cellClassName: 'text-slate-700 font-semibold text-xs' },
    {
      key: 'yearRangeRVId',
      label: labels.assessmentYear,
      width: '128px',
      align: 'left',
      render: (val) => <span className="text-slate-600 font-semibold text-xs">{yearLabelById(val as number)}</span>,
    },
    {
      key: 'userGroup',
      label: labels.userGroup,
      width: '144px',
      align: 'left',
      render: (val) => {
        const g = String(val ?? '');
        const cls = GROUP_BADGE[g] ?? 'bg-slate-100 text-slate-600 border-slate-200';
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${cls}`}>{g || '-'}</span>;
      },
    },
    { key: 'baseType', label: labels.baseColumnType, width: '128px', align: 'center', render: () => <span className="inline-flex items-center justify-center px-3 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-white tracking-wider">{valBaseType}</span> },
    {
      key: 'taxPercentage',
      label: labels.taxPercent,
      width: '96px',
      align: 'center',
      render: (val, row) => (
        <div className="flex items-center justify-center gap-1">
          <Input
            type="number"
            min="0"
            max="999"
            value={String((row as ValueBasedTaxRow).taxPercentage ?? val ?? 0)}
            onChange={(e) => setValPercent((row as ValueBasedTaxRow).id, e.target.value)}
            className="h-7 text-sm text-center font-extrabold text-blue-700 w-14 !px-1"
          />
          <span className="text-slate-400 font-bold text-xs">%</span>
        </div>
      ),
    },
  ];
}
