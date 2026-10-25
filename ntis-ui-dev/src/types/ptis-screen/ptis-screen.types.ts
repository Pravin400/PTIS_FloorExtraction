import type { PtisSearchParams } from '@/lib/utils/params';
import type { DualMethodSectionData } from '@/components/modules/property-tax/ptis/dualmethod/dual-method-data';
import type { ApartmentQCDetail, PagedResponse } from '@/types/apartmentQC.types';

export interface PtisMainScreenProps {
  locale: string;
  propertyId?: number;
  ptisParams: PtisSearchParams;
  resolvedSearchParams: Record<string, string | string[] | undefined>;
  error?: string;
  initialApartmentData?: {
    amenities: PagedResponse<ApartmentQCDetail>;
    commercial: PagedResponse<ApartmentQCDetail>;
    residential: PagedResponse<ApartmentQCDetail>;
  };
  initialDualSectionData?: DualMethodSectionData;
  wardId?: number | string;
  propertyNo?: string;
  rateableSection?: React.ReactNode;
  capitalSection?: React.ReactNode;
  dualRateableSection?: React.ReactNode;
  dualCapitalSection?: React.ReactNode;
}
