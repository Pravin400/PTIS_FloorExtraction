import { useTranslations } from 'next-intl';
import { AddButton, SaveButton, RefreshButton } from '@/components/common';
import { YearRangeOption } from '@/types/dynamic-tax-register.types';
import type { DynamicTaxMaster } from '@/hooks/dynamic-tax-register/master/useDynamicTaxMaster';
import { MasterFilterBar } from './MasterFilterBar';
import { MasterTableSection } from './MasterTableSection';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface MasterSectionProps {
  master: DynamicTaxMaster;
  ruleOptions: RuleSelectOption[];
  yearRangeOptions: YearRangeOption[];
  onRetryLoad: () => void;
}

/** Standalone Data (MASTER_BASED) tab — its Rule Name IS the tax's only rule. */
export function MasterSection({ master, ruleOptions, yearRangeOptions, onRetryLoad }: MasterSectionProps) {
  const t = useTranslations('dynamicTaxRegister');
  const {
    effectiveMstRuleId, handleMasterRuleChange, mstYearId, mstYearSelectOptions, onMstYearChange,
    mstBulkMode, setMstBulkMode, mstBulkBase, setMstBulkBase, mstBulk, setMstBulk, mstBusy,
    handleMstBulkApply, mstPagedRows, mstFilteredLocalCount, mstSeededLocally, mstPage, mstPageSize, mstTotalPages,
    patchMstRow, onMstPageChange, onMstPageSizeChange, handleMstSave, handleSeedMaster, loadFailed,
  } = master;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-5 py-4">
        <MasterFilterBar
          ruleOptions={ruleOptions}
          ruleNameValue={effectiveMstRuleId}
          onRuleNameChange={handleMasterRuleChange}
          showRuleName={false}
          mstYearId={mstYearId}
          mstYearSelectOptions={mstYearSelectOptions}
          onMstYearChange={onMstYearChange}
          mstBulkMode={mstBulkMode}
          setMstBulkMode={setMstBulkMode}
          mstBulkBase={mstBulkBase}
          setMstBulkBase={setMstBulkBase}
          mstBulk={mstBulk}
          setMstBulk={setMstBulk}
          mstBusy={mstBusy}
          handleMstBulkApply={handleMstBulkApply}
        />
      </div>
      {loadFailed ? (
        // Deliberately not the "no master keys" empty state — that one offers Seed Master Keys,
        // which here would overwrite mappings that may still exist server-side (the fetch
        // failed, it didn't necessarily come back empty).
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-red-600 font-semibold">{t('master.loadFailed')}</p>
          <RefreshButton
            label={t('master.retryLoad')}
            size="sm"
            onClick={onRetryLoad}
          />
        </div>
      ) : !mstSeededLocally && mstFilteredLocalCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-slate-500 font-medium">
            {mstBusy ? t('master.loadingMasterData') : t('master.noMasterKeysFound')}
          </p>
          {!mstBusy && <AddButton label={t('master.seedMasterKeys')} size="sm" onClick={handleSeedMaster} />}
        </div>
      ) : (
        // min-h-0 is load-bearing: a flex child defaults to min-height:auto, so without it this
        // div refuses to shrink below its table's full height and `overflow-auto` never engages —
        // the grid's pagination row then overflows past the Save footer and gets clipped.
        <div className="flex-1 min-h-0 overflow-auto px-2 py-2">
          <MasterTableSection
            mstRows={mstPagedRows}
            mstBusy={mstBusy}
            mstPage={mstPage}
            mstPageSize={mstPageSize}
            mstTotalPages={mstTotalPages}
            mstTotalCount={mstFilteredLocalCount}
            yearRangeOptions={yearRangeOptions}
            patchMstRow={patchMstRow}
            onMstPageChange={onMstPageChange}
            onMstPageSizeChange={onMstPageSizeChange}
          />
        </div>
      )}
      <div className="flex items-center justify-end gap-3 px-5 py-3 bg-white border-t border-slate-200">
        <SaveButton label={t('master.saveConfiguration')} size="sm" disabled={mstBusy || mstFilteredLocalCount === 0 || loadFailed} onClick={handleMstSave} />
      </div>
    </div>
  );
}
