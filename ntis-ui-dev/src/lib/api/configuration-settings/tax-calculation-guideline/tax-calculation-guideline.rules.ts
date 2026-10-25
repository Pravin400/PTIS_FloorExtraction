import type { TaxCalculationGuidelineDto } from '@/types/tax-calculation-guideline.types';

/**
 * Pure Data-Driven evaluator.
 * Evaluates whether a guideline field is disabled dynamically based on
 * backend DTO relationships (parentGuidelineCode & parentGuidelineValue).
 *
 * Falls back to dynamic evaluation if backend metadata is present.
 */
export function isGuidelineDisabled(
  code: string,
  guidelines: TaxCalculationGuidelineDto[],
  isCertTaxDisabled: boolean
): boolean {
  if (isCertTaxDisabled) {
    const item = guidelines.find((g) => g.guidelineCode === code);
    // Top-level master toggle is always enabled
    if (item?.dataType === 'BIT' && code.startsWith('ENABLE_CERTIFICATE')) return false;
    return true;
  }

  const currentItem = guidelines.find((g) => g.guidelineCode === code);
  if (!currentItem) return false;

  // 1. Dynamic DB Parent Dependency Evaluation
  if (currentItem.parentGuidelineCode) {
    const parentItem = guidelines.find((g) => g.guidelineCode === currentItem.parentGuidelineCode);
    if (!parentItem) return false;

    const expectedValue = currentItem.parentGuidelineValue ?? 'true';
    return parentItem.guidelineValue !== expectedValue && parentItem.guidelineValue !== '1';
  }

  return false;
}

/**
 * Pure Data-Driven toggle detector based strictly on data types.
 */
export function isToggleGuideline(dataType?: string | null): boolean {
  return dataType === 'BIT';
}
