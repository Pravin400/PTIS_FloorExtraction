import type { DryRunEffect } from './effect.types';

export interface DryRunSubRule {
  ruleCode: string;
  ruleName: string;
  expression: string;
  isMatch: boolean;
  wasSkipped?: boolean;
  skipReason?: string | null;
  matchStatus?: string | null;
  effect?: DryRunEffect | null;
  effects?: DryRunEffect[] | null;
  stopProcessing?: boolean;
  baseRate?: number;
  computedValue?: number;
  arrayIndex?: number;
}

export interface DryRunWorkflow {
  workflowName: string;
  ruleEntityId?: number;
  priority: number;
  entityStopOnMatch: boolean;
  subRules: DryRunSubRule[];
}

export interface DryRunResult {
  category: string;
  totalRulesLoaded: number;
  totalSubRulesEvaluated: number;
  matchedCount: number;
  stoppedEarly: boolean;
  workflows: DryRunWorkflow[];
}
