import { RateableTaxDetailsSection } from '@/components/modules/property-tax/ptis/rateable';
import { CapitalTaxDetailsSection } from '@/components/modules/property-tax/ptis/capital';
import { defaultOldDetails } from '@/lib/constants/ptis.constants';
import type { ActionResult } from '@/types/common.types';
import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import type { PtisInitialData } from '@/types/ptis.types';
import type { DualMethodSectionData } from '@/components/modules/property-tax/ptis/dualmethod/dual-method-data';

interface PtisValuationSectionsProps {
  valuationTab?: string;
  locale: string;
  propertyId?: number;
  searchParams: Record<string, string | string[] | undefined>;
  rateableResult?: ActionResult<RateableValueResponse> | null;
  capitalResult?: ActionResult<CapitalValueResponse> | null;
  comparisonResult?: ActionResult<PropertyComparisonResponse> | null;
  dualSectionData?: DualMethodSectionData;
  initialData: PtisInitialData;
  rateableTaxDetails?: TaxDetailsData;
  rateableTaxError?: string;
  capitalTaxDetails?: TaxDetailsData;
  capitalTaxError?: string;
  showDetailsParam: boolean;
}

export function PtisValuationSections({
  valuationTab,
  locale,
  propertyId,
  searchParams,
  rateableResult,
  capitalResult,
  comparisonResult,
  dualSectionData,
  initialData,
  rateableTaxDetails,
  rateableTaxError,
  capitalTaxDetails,
  capitalTaxError,
  showDetailsParam,
}: PtisValuationSectionsProps) {
  const oldDetails = initialData.oldDetails || defaultOldDetails;
  const comparisonData = comparisonResult?.success ? comparisonResult.data : null;

  return {
    rateableSection: (
      <RateableTaxDetailsSection
        rateableData={rateableResult?.success ? rateableResult.data : null}
        comparisonData={comparisonData}
        error={!rateableResult?.success ? rateableResult?.error : undefined}
        hasFetchedData={rateableResult != null}
        oldDetails={oldDetails}
        propertyId={propertyId}
        searchParams={searchParams}
        initialTaxDetails={rateableTaxDetails}
        taxDetailsError={rateableTaxError}
        locale={locale}
      />
    ),
    capitalSection:
      valuationTab === 'capital' ? (
        <CapitalTaxDetailsSection
          capitalData={capitalResult?.success ? capitalResult.data : null}
          comparisonData={comparisonData}
          error={!capitalResult?.success ? capitalResult?.error : undefined}
          message={capitalResult?.message}
          warning={capitalResult?.warning}
          hasFetchedData={capitalResult != null}
          oldDetails={oldDetails}
          propertyId={propertyId}
          searchParams={searchParams}
          initialTaxDetails={capitalTaxDetails}
          taxDetailsError={capitalTaxError}
          locale={locale}
        />
      ) : null,
    dualRateableSection:
      valuationTab === 'dual' && showDetailsParam ? (
        <RateableTaxDetailsSection
          rateableData={dualSectionData?.initialRateableData || null}
          comparisonData={comparisonData}
          error={dualSectionData?.rateableError}
          hasFetchedData={dualSectionData != null}
          oldDetails={oldDetails}
          propertyId={propertyId}
          searchParams={searchParams}
          locale={locale}
          initialTaxDetails={rateableTaxDetails}
          taxDetailsError={rateableTaxError}
          showInlineError={true}
        />
      ) : null,
    dualCapitalSection:
      valuationTab === 'dual' && showDetailsParam ? (
        <CapitalTaxDetailsSection
          capitalData={dualSectionData?.initialCapitalData || null}
          comparisonData={comparisonData}
          error={dualSectionData?.capitalError}
          hasFetchedData={dualSectionData != null}
          oldDetails={oldDetails}
          propertyId={propertyId}
          searchParams={searchParams}
          locale={locale}
          initialTaxDetails={capitalTaxDetails}
          taxDetailsError={capitalTaxError}
          showInlineError={true}
        />
      ) : null,
  };
}
