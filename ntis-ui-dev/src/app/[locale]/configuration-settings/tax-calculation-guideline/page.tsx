import { TaxCalculationGuideline } from '@/components/modules/configuration-settings/tax-calculation-guideline';
import { getTaxCalculationGuidelineAction } from '@/app/[locale]/configuration-settings/tax-calculation-guideline/actions';
import { getPolicyConfigurationsPagedServer } from '@/lib/api/policy-configuration.services';

import { PolicyConfiguration } from '@/types/policy-configuration.types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tax Calculation Guideline | NTIS',
  description:
    'Configure CC / OC / Electric Bill based tax calculation guidelines for the tax engine.',
};

export default async function TaxCalculationGuidelinePage() {
  let fetchError: string | undefined;
  let statusCode: number | undefined;

  const result = await getTaxCalculationGuidelineAction();

  if (!result.success) {
    fetchError = result.error ?? 'Failed to load tax calculation guideline';
    statusCode = result.statusCode;
  }

  // Fetch policy configurations (PolicyCodeMaster)
  let policyConfigs: PolicyConfiguration[] = [];
  try {
    const policyResponse = await getPolicyConfigurationsPagedServer(1, 1000);
    policyConfigs = (policyResponse?.items?.filter((p) => p.isActive) as PolicyConfiguration[]) || [];
  } catch (err) {
    console.error('Failed to fetch policy configurations:', err);
  }

  return (
    <TaxCalculationGuideline
      initialDto={result.data ?? null}
      fetchError={fetchError}
      statusCode={statusCode}
      policyConfigs={policyConfigs}
    />
  );
}

