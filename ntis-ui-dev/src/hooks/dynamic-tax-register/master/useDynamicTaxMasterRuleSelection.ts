'use client';

import { useState } from 'react';
import { MasterSource } from '@/types/dynamic-tax-register.types';
import { MASTER_SOURCE_VALUES } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface DynamicTaxMasterRuleSelectionParams {
  ruleOptions: RuleSelectOption[];
  masterSource: MasterSource | null;
  masterRowsFirstRuleId: number | null | undefined;
  isHybrid: boolean;
  generalRuleDefinitionId: string;
  handleGeneralRuleChange: (value: string) => void;
  /** Silent variant of handleGeneralRuleChange used only for the auto-seed hook's one-time
   *  "default to the first Master Based rule" step — see useDynamicTaxGeneral for why. */
  handleAutoDefaultRuleDefinition: (value: string) => void;
  nav: DynamicTaxNav;
}

/**
 * A HYBRID tax carries its OWN RuleDefinitionId (the General tab's linked rule, e.g. a
 * condition/Hybrid-type rule) — the nested Master Data Mapping section's "Choose from
 * List" selection is a separate, second rule that only feeds the master-mapping grid.
 * Reusing the shared ruleDefinitionId here (as the standalone Data tab correctly does,
 * since there the master rule IS the tax's only rule) would overwrite the Hybrid tax's
 * own rule/category the moment a master rule was picked. Tracked separately here,
 * defaulted from whichever rule the already-seeded rows belong to.
 */
export function useDynamicTaxMasterRuleSelection({
  ruleOptions,
  masterSource,
  masterRowsFirstRuleId,
  isHybrid,
  generalRuleDefinitionId,
  handleGeneralRuleChange,
  handleAutoDefaultRuleDefinition,
  nav,
}: DynamicTaxMasterRuleSelectionParams) {
  // Overrides `masterSource` (which reflects the tax's currently SAVED rule) the
  // moment the admin picks a different "Choose from List" rule on this tab.
  const [pendingMasterSource, setPendingMasterSource] = useState<MasterSource | null>(null);
  const effectiveMasterSource = pendingMasterSource ?? masterSource;

  const [mstRuleDefinitionId, setMstRuleDefinitionId] = useState<string>(String(masterRowsFirstRuleId ?? ''));
  const effectiveMstRuleId = isHybrid ? mstRuleDefinitionId : generalRuleDefinitionId;

  const applyMasterSourceForRule = (value: string) => {
    const newSource = ruleOptions.find((o) => o.value === value)?.attachedReference;
    if (newSource && (MASTER_SOURCE_VALUES as readonly string[]).includes(newSource)) {
      setPendingMasterSource(newSource as MasterSource);
      // Old rows belong to the previous master source — navigate so the server
      // re-fetches scoped to the newly selected rule; RowOps re-syncs its local
      // rows from the fresh (empty, until seeded) prop once that lands.
      nav.router.push(nav.buildConfigUrl({ mstRule: Number(value) || undefined, mstPage: 1 }));
    }
  };

  const handleMasterRuleChange = (value: string) => {
    handleGeneralRuleChange(value);
    applyMasterSourceForRule(value);
  };

  const handleHybridMasterRuleChange = (value: string) => {
    setMstRuleDefinitionId(value);
    applyMasterSourceForRule(value);
  };

  /** Used only by useDynamicTaxMasterAutoSeed's one-time default-rule step for a standalone
   *  (non-hybrid) Master tax — same effect as handleMasterRuleChange minus the ruleChanged flag. */
  const applyAutoDefaultMasterRule = (value: string) => {
    handleAutoDefaultRuleDefinition(value);
    applyMasterSourceForRule(value);
  };

  return {
    effectiveMasterSource,
    mstRuleDefinitionId,
    effectiveMstRuleId,
    handleMasterRuleChange,
    handleHybridMasterRuleChange,
    applyAutoDefaultMasterRule,
  };
}

export type DynamicTaxMasterRuleSelection = ReturnType<typeof useDynamicTaxMasterRuleSelection>;
