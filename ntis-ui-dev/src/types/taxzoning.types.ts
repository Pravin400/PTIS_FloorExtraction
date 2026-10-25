import { PagedResponse } from './common.types';

export interface TaxZone {
  id: number;
  taxZoneNo: string;
  taxZoneType: string;
  remark: string | null;
  createdDate: string;
  updatedDate: string | null;
  isActive: boolean;
}
export interface Ward {
  id: number;
  wardNo: string;
  zoneNo: string;
  description: string | null;
  descriptionEnglish: string | null;
  sequenceNo: number | null;
  isActive: boolean;
  createdBy: string | null;
  createdDate: string;
  updatedBy: string | null;
  updatedDate: string | null;
}
export interface TaxZoning {
  // id: number;
  taxZoneId: number;
  wardId: number;
  taxZone: string;
  wardNo: string;
  propertyNo: string;
  fromProperty: string;
  toProperty: string;
  isActive: boolean;
  createdDate: string | null;
  updatedDate: string | null;
}

export type TaxZoningPropertyNo = TaxZoning;

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export interface TaxZoningFormModel {
  taxZoneId: number;
  wardId: number;
  propertyNo: string;      // can be comma separated if needed
  fromProperty: string;
  toProperty: string;
  isActive: boolean;
  updatedBy?: number;
  ownerID?: number;
  propertyId?: number;
}

export type PreviewRow = {
  taxZoneNo: string;
  oldTaxZoneNo?: string;
  wardNo: string;
  propertyNo: string;
};

export type ZoningRecord = {
  taxZoneId: number;            // Internal ID for API calls
  taxZoneNo?: string;           // For display in table
  wardId: number;
  wardNo?: string;             // For display only, not used in payload
  fromProperty: string;
  toProperty: string;
  status: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type TaxZoningPageProps = {
  data: TaxZoningPropertyNo[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  taxZones: PagedResponse<TaxZone>;
  wardsData: PagedResponse<Ward>;
  allProperties?: ActionResult<PagedResponse<TaxZoning>>;
  sortBy?: string;
  sortOrder?: string;
};
export interface TaxZoningFormProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  zone: string;
  setZone: (val: string) => void;
  zoneOptions: SelectOption[];
  isTaxZoneValid: boolean;
  submitted: boolean;
  ward: string[];
  setWard: (val: string[]) => void;
  wardOptions: SelectOption[];
  isWardValid: boolean;
  fromProps: string;
  setFromProps: (val: string) => void;
  toProps: string;
  setToProps: (val: string) => void;
  propertyOptionsByWard: SelectOption[];
  isPropertyValid: boolean;
  isPropertyRangeValid: boolean;
  saving: boolean;
  isFormValid: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  wardLabel?: string;
  taxZoneLabel?: string;
}


export interface TaxZoningServerPageProps {
  searchParams: {
    page?: string;
    pageSize?: string;
    taxZoneId?: string;
    wardId?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}
