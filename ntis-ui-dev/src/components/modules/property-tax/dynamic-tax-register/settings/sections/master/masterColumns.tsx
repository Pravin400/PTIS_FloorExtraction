import type { Column } from '@/components/common/MasterTable';
import { Select, Input } from '@/components/common';
import { TaxMasterMappingRow, ResultMode, ResultBase, YearRangeOption } from '@/types/dynamic-tax-register.types';
import { clampResultValueInput } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';

export interface GetMasterColumnsParams {
  mstPage: number;
  mstPageSize: number;
  yearRangeOptions: YearRangeOption[];
  patchMstRow: (rowId: number, patch: Partial<TaxMasterMappingRow>) => void;
  labels: {
    sr: string;
    displayValue: string;
    assessmentYear: string;
    resultMode: string;
    resultBase: string;
    resultValue: string;
    unsavedRowAria: string;
  };
}

export function getMasterColumns({ mstPage, mstPageSize, yearRangeOptions, patchMstRow, labels }: GetMasterColumnsParams): Column<TaxMasterMappingRow>[] {
  return [
    { key: 'id', label: labels.sr, width: '48px', align: 'center', render: (_v, _r, i) => <span className="text-slate-400 font-bold text-[11px]">{(mstPage - 1) * mstPageSize + (i as number) + 1}</span> },
    {
      key: 'displayValue',
      label: labels.displayValue,
      align: 'left',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1.5">
          {/* Negative ids are this screen's convention for "seeded locally, not yet saved" (see
              handleSeedMaster) — otherwise indistinguishable from a real, already-persisted row. */}
          {(row as TaxMasterMappingRow).id < 0 && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
              title={labels.unsavedRowAria}
              aria-label={labels.unsavedRowAria}
            />
          )}
          <span className="text-emerald-700 font-bold text-[12px]">{String(val ?? '')}</span>
        </span>
      ),
    },
    {
      key: 'assessmentYearRangeId',
      label: labels.assessmentYear,
      width: '128px',
      align: 'left',
      // Defaults to the row's own value from the DB.
      render: (val) => {
        const matchingYear = yearRangeOptions.find((o) => o.value === Number(val));
        return (
          <span className="text-slate-600 font-semibold text-xs">
            {matchingYear ? matchingYear.label : String(val ?? '-')}
          </span>
        );
      },
    },
    {
      key: 'resultMode',
      label: labels.resultMode,
      width: '112px',
      align: 'center',
      render: (val, row) => (
        <Select
          value={String(val)}
          // Reset Result Base to NONE when leaving PERCENT so the (disabled) Base never keeps a stale value.
          onChange={(_, nextValue) => {
            const mode = nextValue as ResultMode;
            patchMstRow(
              (row as TaxMasterMappingRow).id,
              mode !== 'PERCENT' ? { resultMode: mode, resultBase: 'NONE' } : { resultMode: mode }
            );
          }}
          options={[
            { label: 'FIXED', value: 'FIXED' },
            { label: 'PERCENT', value: 'PERCENT' },
          ]}
          selectSize="sm"
          className="min-w-[108px]"
        />
      ),
    },
    {
      key: 'resultBase',
      label: labels.resultBase,
      width: '96px',
      align: 'center',
      render: (val, row) => (
        <Select
          // Non-percent modes have no base — show NONE even for legacy rows stored with a base.
          value={(row as TaxMasterMappingRow).resultMode !== 'PERCENT' ? 'NONE' : String(val)}
          onChange={(_, nextValue) => patchMstRow((row as TaxMasterMappingRow).id, { resultBase: nextValue as ResultBase })}
          options={[
            { label: 'NONE', value: 'NONE' },
            { label: 'RV', value: 'RV' },
            { label: 'ALV', value: 'ALV' },
          ]}
          // Result Base only applies to PERCENT results; for FIXED the amount is absolute, so disable it.
          disabled={(row as TaxMasterMappingRow).resultMode !== 'PERCENT'}
          selectSize="sm"
          className="min-w-[92px]"
        />
      ),
    },
    {
      key: 'resultValue',
      label: labels.resultValue,
      width: '96px',
      align: 'center',
      render: (val, row) => {
        const r = row as TaxMasterMappingRow;
        return (
          <Input
            naked
            type="number"
            min="0"
            max="999"
            value={String(r.resultValue ?? val ?? 0)}
            onChange={(e) => patchMstRow(r.id, { resultValue: Number(clampResultValueInput(e.target.value, r.resultMode)) || 0 })}
            className={`w-16 text-center text-sm font-extrabold rounded px-1.5 py-1 outline-none border border-transparent focus:border-blue-300 focus:ring-1 focus:ring-blue-100 bg-transparent ${
              Number(r.resultValue) === 0 ? 'text-slate-400' : r.resultMode === 'PERCENT' ? 'text-blue-600' : 'text-emerald-700'
            }`}
          />
        );
      },
    },
  ];
}
