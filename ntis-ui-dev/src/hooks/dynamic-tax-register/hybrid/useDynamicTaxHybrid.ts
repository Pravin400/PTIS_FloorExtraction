'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { TaxHybridConfig, ResultBase } from '@/types/dynamic-tax-register.types';
import { saveHybridConfigAction } from '@/app/[locale]/property-tax/dynamic-tax-register/action';

/** Hybrid tab's own strategy config (priority/fallback/result-base) + its two collapsible sections' open state.
 *  `loadFailed` is true when the server-side hybrid-config fetch threw rather than genuinely
 *  finding nothing — callers (useDynamicTaxDrawer's handleSaveAll) must not resave the defaults
 *  below in that case, since they're not the tax's real strategy, just a fallback. */
export function useDynamicTaxHybrid(numericId: number, hybridConfig: TaxHybridConfig | null, loadFailed: boolean) {
  const t = useTranslations('dynamicTaxRegister');
  const [hybEvalPriority, setHybEvalPriorityState] = useState(hybridConfig?.evaluationPriority ?? 'MASTER_THEN_CONDITION');
  const [hybFallback, setHybFallbackState] = useState(hybridConfig?.fallbackStrategy ?? 'DEFAULT_ZERO');
  const [hybBase, setHybBaseState] = useState<ResultBase>(hybridConfig?.resultBase ?? 'NONE');
  const [hybFieldOpen, setHybFieldOpen] = useState(true);
  const [hybDataOpen, setHybDataOpen] = useState(true);
  const [hybBusy, setHybBusy] = useState(false);
  // Explicit "has an edit happened since the last load/save" flag — same rationale as the
  // matching flag in useDynamicTaxMasterRowOps/useDynamicTaxValueRowOps.
  const [dirty, setDirty] = useState(false);

  const setHybEvalPriority = (v: typeof hybEvalPriority) => { setHybEvalPriorityState(v); setDirty(true); };
  const setHybFallback = (v: typeof hybFallback) => { setHybFallbackState(v); setDirty(true); };
  const setHybBase = (v: ResultBase) => { setHybBaseState(v); setDirty(true); };

  const handleHybridSave = async (): Promise<boolean> => {
    setHybBusy(true);
    try {
      const res = await saveHybridConfigAction(numericId, {
        taxId: numericId,
        evaluationPriority: hybEvalPriority,
        fallbackStrategy: hybFallback,
        resultBase: hybBase,
        updatedBy: 1,
      });
      if (res.success) {
        toast.success(t('messages.hybrid.configSaved'));
        setDirty(false);
        return true;
      }
      toast.error(res.error || t('messages.hybrid.saveFailed'));
      return false;
    } catch {
      toast.error(t('messages.hybrid.saveFailedRetry'));
      return false;
    } finally {
      setHybBusy(false);
    }
  };

  return {
    hybEvalPriority,
    setHybEvalPriority,
    hybFallback,
    setHybFallback,
    hybBase,
    setHybBase,
    hybFieldOpen,
    setHybFieldOpen,
    hybDataOpen,
    setHybDataOpen,
    hybBusy,
    dirty,
    loadFailed,
    handleHybridSave,
  };
}

export type DynamicTaxHybrid = ReturnType<typeof useDynamicTaxHybrid>;
