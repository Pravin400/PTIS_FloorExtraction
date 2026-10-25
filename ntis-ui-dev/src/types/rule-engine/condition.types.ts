import type { EffectState } from './effect.types';

export interface ConditionState {
  id: string;
  fieldId: string;
  operator: string;
  value: string | string[];
  valueLabel?: string | string[];
}

export interface ConditionGroupState {
  id: string;
  logicalOperator: 'AND' | 'OR';
  conditions: ConditionState[];
  groups: ConditionGroupState[];
}

export interface RuleBlock {
  id: string;
  description: string;
  conditions: ConditionGroupState;
  effect?: EffectState;
  effects: EffectState[];
  stopProcessing?: boolean;
  ruleScopeName?: string;
}
