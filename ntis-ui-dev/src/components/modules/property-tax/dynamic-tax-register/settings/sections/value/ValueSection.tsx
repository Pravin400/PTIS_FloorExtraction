import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { SaveButton } from '@/components/common';
import { MasterTable } from '@/components/common/MasterTable';
import type { ValueBasedTaxRow } from '@/types/dynamic-tax-register.types';
import type { DynamicTaxValue } from '@/hooks/dynamic-tax-register/value/useDynamicTaxValue';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { ValueHeaderExtra } from './ValueHeaderExtra';
import { getValueColumns } from './valueColumns';

const VAL_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface ValueSectionProps {
  value: DynamicTaxValue;
  onRetryLoad: () => void;
}

export function ValueSection({ value, onRetryLoad }: ValueSectionProps) {
  const t = useTranslations('dynamicTaxRegister');
  const typeOfUseLabel = useAliasLabel('Type_Of_Use', t('aliasFallback.typeOfUse'));
  const assessmentLabel = useAliasLabel('Assessment', t('aliasFallback.assessment'));
  const {
    valBaseType, setValBaseType, valYearId, yearSelectOptions, yearLabelById, onValYearChange,
    valUserGroup, valUserGroupOptions, onValGroupChange, valBulk, setValBulk, valBusy, handleValBulkApply,
    valFilteredLocalCount, valPagedRows, valPage, valTotalPages, loadFailed,
    valPageSize, onValPageChange, onValPageSizeChange, setValPercent, handleValSave,
  } = value;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <ValueHeaderExtra
        valBaseType={valBaseType}
        setValBaseType={setValBaseType}
        valYearId={valYearId}
        yearSelectOptions={yearSelectOptions}
        onValYearChange={onValYearChange}
        valUserGroup={valUserGroup}
        userGroupOptions={valUserGroupOptions}
        onValGroupChange={onValGroupChange}
        valBulk={valBulk}
        setValBulk={setValBulk}
        valBusy={valBusy}
        handleValBulkApply={handleValBulkApply}
      />

      {loadFailed ? (
        // Deliberately NOT the same empty state as "nothing configured yet" — that one seeds a
        // fresh zero-percentage grid, which here would silently save zeros over data that may
        // still exist server-side (the fetch failed, it didn't necessarily come back empty).
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-red-600 font-semibold">{t('value.loadFailed')}</p>
          <button
            type="button"
            onClick={onRetryLoad}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('value.retryLoad')}
          </button>
        </div>
      ) : valFilteredLocalCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-slate-500 font-medium">{t('value.noPercentageRows')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-500">{t('value.total', { count: valFilteredLocalCount })}</span>
          </div>

          {/* min-h-0 is load-bearing — see the matching note in MasterSection: without it this
              flex child won't shrink below the table's height, so overflow-auto never engages and
              the pagination row is clipped behind the Save footer. */}
          <div className="flex-1 min-h-0 overflow-auto px-2 py-2">
            <MasterTable<ValueBasedTaxRow>
              columns={getValueColumns({
                yearLabelById,
                valBaseType,
                setValPercent,
                labels: {
                  typeOfUse: typeOfUseLabel,
                  description: t('value.columns.description'),
                  assessmentYear: `${assessmentLabel} ${t('aliasFallback.yearSuffix')}`,
                  userGroup: t('value.columns.userGroup'),
                  baseColumnType: t('value.columns.baseColumnType'),
                  taxPercent: t('value.columns.taxPercent'),
                  unsavedRowAria: t('value.unsavedRowAria'),
                },
              })}
              data={valPagedRows}
              loading={valBusy}
              pageNumber={valPage}
              totalPages={valTotalPages}
              totalCount={valFilteredLocalCount}
              pageSize={valPageSize}
              pageSizeOptions={VAL_PAGE_SIZE_OPTIONS}
              onPageChange={onValPageChange}
              onPageSizeChange={onValPageSizeChange}
              paginationConfig={{ enabled: true, showPageSizeSelector: true }}
              getRowKey={(row) => String((row as ValueBasedTaxRow).id)}
              tableClassName="text-xs"
              theadClassName="text-[10px] font-extrabold uppercase tracking-widest"
              rowClassName={() => '[&_td]:border-r [&_td]:border-slate-100 [&_td]:py-2.5'}
              height="lg"
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3 px-5 py-3 bg-white border-t border-slate-200">
        <SaveButton label={t('value.saveConfiguration')} size="sm" disabled={valBusy || loadFailed} onClick={handleValSave} />
      </div>
    </div>
  );
}
