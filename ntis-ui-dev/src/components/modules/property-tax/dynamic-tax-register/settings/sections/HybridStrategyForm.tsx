import { useTranslations } from 'next-intl';
import { SearchSelect, SaveButton } from '@/components/common';
import { TaxHybridConfig, ResultBase } from '@/types/dynamic-tax-register.types';

export interface HybridStrategyFormProps {
  hybEvalPriority: TaxHybridConfig['evaluationPriority'];
  setHybEvalPriority: (v: TaxHybridConfig['evaluationPriority']) => void;
  hybFallback: TaxHybridConfig['fallbackStrategy'];
  setHybFallback: (v: TaxHybridConfig['fallbackStrategy']) => void;
  hybBase: ResultBase;
  setHybBase: (v: ResultBase) => void;
  hybBusy: boolean;
  handleHybridSave: () => void;
}

/** Hybrid tax's own evaluation-strategy config (priority / fallback / result base). */
export function HybridStrategyForm({
  hybEvalPriority, setHybEvalPriority, hybFallback, setHybFallback, hybBase, setHybBase, hybBusy, handleHybridSave,
}: HybridStrategyFormProps) {
  const t = useTranslations('dynamicTaxRegister');
  return (
    <div className="bg-white border-b border-slate-200 px-5 py-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('hybrid.evaluationPriority')}</span>
          <SearchSelect
            value={hybEvalPriority}
            onChange={(_, v) => setHybEvalPriority(v as TaxHybridConfig['evaluationPriority'])}
            options={[
              { label: t('hybrid.masterThenCondition'), value: 'MASTER_THEN_CONDITION' },
              { label: t('hybrid.conditionThenMaster'), value: 'CONDITION_THEN_MASTER' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('hybrid.fallbackStrategy')}</span>
          <SearchSelect
            value={hybFallback}
            onChange={(_, v) => setHybFallback(v as TaxHybridConfig['fallbackStrategy'])}
            options={[
              { label: t('hybrid.defaultZero'), value: 'DEFAULT_ZERO' },
              { label: t('hybrid.conditionRuleFallback'), value: 'CONDITION_RULE' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('hybrid.resultBase')}</span>
          <SearchSelect
            value={hybBase}
            onChange={(_, v) => setHybBase(v as ResultBase)}
            options={[
              { label: 'NONE', value: 'NONE' },
              { label: 'RV', value: 'RV' },
              { label: 'ALV', value: 'ALV' },
            ]}
          />
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <SaveButton label={t('hybrid.saveHybridStrategy')} size="sm" disabled={hybBusy} onClick={handleHybridSave} />
      </div>
    </div>
  );
}
