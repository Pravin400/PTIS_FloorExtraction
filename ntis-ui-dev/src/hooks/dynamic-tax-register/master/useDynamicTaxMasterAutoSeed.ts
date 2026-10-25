'use client';

import { useEffect, useMemo, useRef } from 'react';
import { TaxMasterMappingRow } from '@/types/dynamic-tax-register.types';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface DynamicTaxMasterAutoSeedParams {
  activeTab: string;
  effectiveCategory: string;
  isHybrid: boolean;
  ruleOptions: RuleSelectOption[];
  effectiveMstRuleId: string;
  mstYearId: number;
  mstRows: TaxMasterMappingRow[];
  mstBusy: boolean;
  /** True when the server-side mapping fetch for this tax failed (network/5xx) rather than
   *  genuinely returning zero rows — must never auto-seed over that, or a transient load failure
   *  turns into placeholder FIXED/NONE/0 rows silently saved over real data on the next Save. */
  loadFailed: boolean;
  applyAutoDefaultMasterRule: (value: string) => void;
  handleHybridMasterRuleChange: (value: string) => void;
  handleSeedMaster: () => void;
}

/**
 * Auto-populates the Data tab (and Hybrid's nested Master Data Mapping section)
 * without a manual "Seed Master Keys" click: defaults the Rule Name to the
 * first "Choose from List" rule when none is linked yet, and (re)seeds
 * automatically whenever the effective rule or year changes and the grid is empty —
 * covers first load and switching Rule Name. Fragile dependency chain (see
 * project plan's Risks) — verify by hand after any change here, don't trust
 * an automated exhaustive-deps fix.
 */
export function useDynamicTaxMasterAutoSeed({
  activeTab,
  effectiveCategory,
  isHybrid,
  ruleOptions,
  effectiveMstRuleId,
  mstYearId,
  mstRows,
  mstBusy,
  loadFailed,
  applyAutoDefaultMasterRule,
  handleHybridMasterRuleChange,
  handleSeedMaster,
}: DynamicTaxMasterAutoSeedParams) {
  const masterBasedOptions = useMemo(
    () => ruleOptions.filter((o) => o.ruleType === 'MASTER_BASED'),
    [ruleOptions]
  );
  // Both one-shot: unlike the seed guard below, the "pick a default rule" step previously
  // had NO guard at all — if effectiveMstRuleId ever read falsy again after being set
  // (e.g. a stale render during a pending navigation), it would re-fire another
  // router.push, and every push here re-runs this same effect, compounding into a
  // navigation loop. autoActionCountRef is a hard circuit-breaker on top of both
  // per-purpose guards, so no combination of stale state can loop indefinitely.
  const autoDefaultRuleAttemptedRef = useRef(false);
  const autoSeedAttemptedRef = useRef<string | null>(null);
  const autoActionCountRef = useRef(0);
  const MAX_AUTO_ACTIONS = 3;

  useEffect(() => {
    // Never auto-seed/auto-default while the General tab is what's actually visible — this
    // effect must only act once the Configuration tab is the one in view, or an admin merely
    // sitting on General (or tweaking its Rule Name dropdown) can silently trigger a
    // background INSERT into TaxMasterMapping with no button clicked.
    if (activeTab !== 'config') return;
    if (!(effectiveCategory === 'Data' || isHybrid) || masterBasedOptions.length === 0) return;
    if (autoActionCountRef.current >= MAX_AUTO_ACTIONS) return;
    // A failed fetch must never be treated as "no mappings yet" — auto-seeding here would
    // silently save placeholder rows over data that may still exist server-side (see loadFailed).
    if (loadFailed) return;

    if (!effectiveMstRuleId) {
      if (autoDefaultRuleAttemptedRef.current) return;
      autoDefaultRuleAttemptedRef.current = true;
      autoActionCountRef.current += 1;
      // Intentional one-time default: pick the first "Choose from List" rule when none is linked
      // yet. Uses the silent (non-hybrid) or hybrid-local rule setter — neither touches the
      // General tab's `ruleChanged`, so this system default can never masquerade as a user-made
      // mode change (see applyAutoDefaultMasterRule / handleAutoDefaultRuleDefinition).
      (isHybrid ? handleHybridMasterRuleChange : applyAutoDefaultMasterRule)(masterBasedOptions[0].value);
      return;
    }

    const currentSeedKey = `${effectiveMstRuleId}-${mstYearId}`;

    if (mstRows.length === 0 && !mstBusy && autoSeedAttemptedRef.current !== currentSeedKey) {
      autoSeedAttemptedRef.current = currentSeedKey;
      autoActionCountRef.current += 1;
      handleSeedMaster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, effectiveCategory, isHybrid, masterBasedOptions, effectiveMstRuleId, mstYearId, mstRows.length, mstBusy, loadFailed]);
}
