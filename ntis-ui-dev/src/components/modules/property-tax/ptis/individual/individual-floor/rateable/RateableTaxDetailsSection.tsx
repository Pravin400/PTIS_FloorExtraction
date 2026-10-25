import { getTranslations } from 'next-intl/server';
import { ToastNotifier } from '@/components/common';
import type { OldDetailsData } from '@/types/ptis.types';
import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import { RateableTaxTable } from './components/RateableTaxTable';
import { ValuationSummaryFooter } from '@/components/modules/property-tax/ptis/shared/ValuationSummaryFooter';
import { getRateableValue } from '@/app/[locale]/property-tax/ptis/RateableValue.action';
import { calculateRateableTotal } from '@/lib/utils/ptis-calculations';
import { resolveValuationData } from '@/components/modules/property-tax/ptis/shared/valuation-fetch';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';

interface Props {
  propertyId?: number;
  oldDetails: OldDetailsData;
  searchParams: Record<string, string | string[] | undefined>;
  rateableData?: RateableValueResponse | null;
  comparisonData?: PropertyComparisonResponse | null;
  hasFetchedData?: boolean;
  error?: string;
  showInlineError?: boolean;
  initialTaxDetails?: TaxDetailsData;
  taxDetailsError?: string;
  locale: string;
}

export async function RateableTaxDetailsSection({
  propertyId,
  oldDetails,
  searchParams,
  rateableData: initialData,
  comparisonData,
  hasFetchedData = false,
  error: initialError,
  showInlineError = true,
  initialTaxDetails,
  taxDetailsError,
  locale,
}: Props) {
  const ptisT = await getTranslations({ locale, namespace: 'ptis' });

  const { data: rateableData, error, message, warning } = await resolveValuationData<RateableValueResponse>({
    propertyId,
    initialData,
    initialError,
    hasFetchedInitialData: hasFetchedData,
    fetcher: getRateableValue,
    fallbackUserMessage: 'Unable to load rateable valuation details.',
    t: ptisT,
  });

  const t = await getTranslations({ locale, namespace: 'ptis.modules.PtisTaxDetails' });
  const { rv, tax, alv } = calculateRateableTotal(rateableData);

  const oldAreaRV = Number(oldDetails?.oldRV || 0);
  const oldAreaALV = Number(oldDetails?.oldALV || 0);
  const oldAreaTax = Number(oldDetails?.oldTotalTax || 0);

  const finalErrorMessage = error || null;
  const successMessage = message || null;
  const warningMessage = warning || null;

  return (
    <div className="space-y-0.5 p-0.5">
      {showInlineError && finalErrorMessage && (
        <ToastNotifier message={finalErrorMessage} type="error" />
      )}
      {showInlineError && taxDetailsError && (
        <ToastNotifier message={taxDetailsError} type="error" />
      )}
      {showInlineError && warningMessage && (
        <ToastNotifier message={warningMessage} type="warning" />
      )}
      {showInlineError && successMessage && (
        <ToastNotifier message={successMessage} type="success" />
      )}
      <RateableTaxTable locale={locale} rateableData={rateableData} searchParams={searchParams} propertyId={propertyId} />

      <ValuationSummaryFooter
        title={t('title')}
        comparisonData={comparisonData}
        badges={[
          { label: t('oldTotalRv'), value: oldAreaRV, color: 'blue' },
          { label: t('oldTotalTax'), value: oldAreaTax, color: 'blue' },
          { label: t('totalRv'), value: rv, color: 'purple' },
          { label: t('totalTax'), value: tax, color: 'purple' },
          { label: t('oldTotalAlv'), value: oldAreaALV, color: 'blue' },
          { label: t('totalAlv'), value: alv, color: 'purple' },
        ]}
        initialTaxDetails={initialTaxDetails}
        locale={locale}
      />
    </div>
  );
}
