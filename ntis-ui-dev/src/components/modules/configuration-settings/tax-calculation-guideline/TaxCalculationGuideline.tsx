import type { TaxCalculationGuidelineModuleProps } from '@/types/tax-calculation-guideline.types';
import TaxCalculationGuidelineClient from './TaxCalculationGuidelineClient';

/**
 * Server Component wrapper for the Tax Calculation Guideline screen.
 * Forwards SSR-fetched data to the client orchestrator.
 */
export default function TaxCalculationGuideline(props: TaxCalculationGuidelineModuleProps) {
  return <TaxCalculationGuidelineClient {...props} />;
}
