import type { CreateRetrospectiveRuleInput } from '@/types/retrospective-rule.types';

export interface RetrospectiveRuleValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validation function for Retrospective Rule Form & Builder.
 */
export function validateRetrospectiveRuleForm(
  input: Partial<CreateRetrospectiveRuleInput>,
  t?: (key: string) => string
): RetrospectiveRuleValidationResult {
  const errors: Record<string, string> = {};
  const getMsg = (key: string, fallback: string) => (t ? t(key) : fallback);

  // Basic Rule Title Validation
  if (!input.ruleTitle || !input.ruleTitle.trim()) {
    errors.ruleTitle = getMsg('ruleTitleRequired', 'Rule title is required');
  }

  // Basic Rule Code Validation
  if (!input.ruleCode || !input.ruleCode.trim()) {
    errors.ruleCode = getMsg('ruleCodeRequired', 'Rule code is required');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
