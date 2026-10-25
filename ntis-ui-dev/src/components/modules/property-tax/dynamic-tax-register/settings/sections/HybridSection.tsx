import { useTranslations } from 'next-intl';
import { Settings, ChevronDown, Table2 } from 'lucide-react';
import { AddButton, SaveButton, RefreshButton } from '@/components/common';
import { YearRangeOption } from '@/types/dynamic-tax-register.types';
import type { DynamicTaxHybrid } from '@/hooks/dynamic-tax-register/hybrid/useDynamicTaxHybrid';
import type { DynamicTaxMaster } from '@/hooks/dynamic-tax-register/master/useDynamicTaxMaster';
import type { DynamicTaxCondition } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxCondition';
import { ConditionSection } from './condition/ConditionSection';
import { HybridStrategyForm } from './HybridStrategyForm';
import { MasterFilterBar } from './master/MasterFilterBar';
import { MasterTableSection } from './master/MasterTableSection';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface HybridSectionProps {
  hybrid: DynamicTaxHybrid;
  master: DynamicTaxMaster;
  condition: DynamicTaxCondition;
  ruleOptions: RuleSelectOption[];
  yearRangeOptions: YearRangeOption[];
  onRetryLoad: () => void;
}

/** HYBRID tax's config: its own strategy form + collapsible Condition and Master Data Mapping sections. */
export function HybridSection({
  hybrid, master, condition, ruleOptions, yearRangeOptions, onRetryLoad,
}: HybridSectionProps) {
  const t = useTranslations('dynamicTaxRegister');
  const {
    hybEvalPriority, setHybEvalPriority, hybFallback, setHybFallback, hybBase, setHybBase,
    hybBusy, handleHybridSave, hybFieldOpen, setHybFieldOpen, hybDataOpen, setHybDataOpen, loadFailed: hybridLoadFailed,
  } = hybrid;
  const {
    mstRuleDefinitionId, handleHybridMasterRuleChange, mstYearId, mstYearSelectOptions, onMstYearChange,
    mstBulkMode, setMstBulkMode, mstBulkBase, setMstBulkBase, mstBulk, setMstBulk, mstBusy,
    handleMstBulkApply, mstPagedRows, mstFilteredLocalCount, mstSeededLocally, mstPage, mstPageSize, mstTotalPages,
    patchMstRow, onMstPageChange, onMstPageSizeChange, handleMstSave, handleSeedMaster, loadFailed: masterLoadFailed,
  } = master;

  return (
    <div className="flex flex-col gap-0 overflow-auto bg-slate-50">
      {hybridLoadFailed && (
        // The strategy form below still shows its built-in defaults (MASTER_THEN_CONDITION /
        // DEFAULT_ZERO / NONE) even when the real config failed to load — useDynamicTaxDrawer's
        // handleSaveAll refuses to persist them, but the admin should know why the form looks
        // reset rather than assuming that's genuinely this tax's saved strategy.
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-red-50 border-b border-red-200">
          <p className="text-xs text-red-700 font-semibold">{t('hybrid.strategyLoadFailed')}</p>
          <RefreshButton
            label={t('hybrid.retryLoad')}
            size="sm"
            onClick={onRetryLoad}
          />
        </div>
      )}
      <HybridStrategyForm
        hybEvalPriority={hybEvalPriority}
        setHybEvalPriority={setHybEvalPriority}
        hybFallback={hybFallback}
        setHybFallback={setHybFallback}
        hybBase={hybBase}
        setHybBase={setHybBase}
        hybBusy={hybBusy}
        handleHybridSave={handleHybridSave}
      />

      <div className="border-b border-slate-200">
        <button
          type="button"
          onClick={() => setHybFieldOpen((v) => !v)}
          aria-expanded={hybFieldOpen}
          className="w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
              <Settings className="w-3.5 h-3.5 text-purple-600" />
            </span>
            <span className="text-[12px] font-extrabold text-slate-700 uppercase tracking-wide">{t('hybrid.conditionRuleSection')}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">{t('hybrid.fieldComponentBadge')}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${hybFieldOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {hybFieldOpen && (
          <div className="border-t border-slate-100 bg-white">
            <ConditionSection condition={condition} />
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setHybDataOpen((v) => !v)}
          aria-expanded={hybDataOpen}
          className="w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <Table2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <span className="text-[12px] font-extrabold text-slate-700 uppercase tracking-wide">{t('hybrid.masterDataMapping')}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">{t('hybrid.dataComponentBadge')}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${hybDataOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {hybDataOpen && (
          <div className="border-t border-slate-100 bg-white">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <MasterFilterBar
                ruleOptions={ruleOptions}
                ruleNameValue={mstRuleDefinitionId}
                onRuleNameChange={handleHybridMasterRuleChange}
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
            {masterLoadFailed ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="text-sm text-red-600 font-semibold">{t('hybrid.masterLoadFailed')}</p>
                <RefreshButton
                  label={t('hybrid.retryLoad')}
                  size="sm"
                  onClick={onRetryLoad}
                />
              </div>
            ) : !mstSeededLocally && mstFilteredLocalCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  {mstBusy ? t('hybrid.loadingMasterData') : t('hybrid.noMasterKeysFound')}
                </p>
                {!mstBusy && <AddButton label={t('hybrid.seedMasterKeys')} size="sm" onClick={handleSeedMaster} />}
              </div>
            ) : (
              <>
                <div className="overflow-auto px-2 py-2">
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
                <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100">
                  <SaveButton label={t('hybrid.saveMappings')} size="sm" disabled={mstBusy || mstFilteredLocalCount === 0} onClick={handleMstSave} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
