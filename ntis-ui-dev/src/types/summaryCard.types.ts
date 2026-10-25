import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { DualMethodResponse } from '@/types/dualMethod.types';
import type { OldDetailsData } from '@/types/ptis.types';
import type { PtisTaxMode } from '@/types/property-tax/apartment';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';

export interface IndividualFloorSummaryCardsProps {
  rateableData?: RateableValueResponse | null;
  capitalData?: CapitalValueResponse | null;
  dualMethodData?: DualMethodResponse | null;
  comparisonData?: PropertyComparisonResponse | null;
  oldDetailsData?: OldDetailsData | null;
  taxMode?: PtisTaxMode;
  isLoading?: boolean;
  className?: string;
}

export interface IndividualFloorSummaryCardsSkeletonProps {
  taxMode?: PtisTaxMode;
  className?: string;
}

export interface TruncatedValueProps {
  value: string | number | undefined | null;
  className?: string;
  maxDigits?: number;
  alwaysShowTooltip?: boolean;
}

export interface FloorSummaryMetrics {
  isCapitalMode: boolean;
  isDualMode: boolean;
  // Area
  hasCompArea: boolean;
  oldArea: number;
  newArea: number;
  changeArea: number;
  // Changes of use
  oldUse: string;
  newUse: string;
  isUseUpdated: boolean;
  // ALV
  oldAlv: number;
  newAlv: number;
  formattedAlvDelta: string;
  hasCompAlv: boolean;
  // RV
  oldRv: number;
  newRv: number;
  rvPercent: number;
  formattedRvDelta: string;
  hasCompRv: boolean;
  // CV
  oldCv: number;
  newCv: number;
  cvPercent: number;
  formattedCvDelta: string;
  hasCompCv: boolean;
  // Tax
  oldTax: number;
  newTax: number;
  formattedTaxDelta: string;
  hasCompTax: boolean;
  // Formatters & helpers
  formatRupeeShort: (val: number | string | undefined | null, hasSource: boolean) => string;
}
