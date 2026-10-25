/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RenterDetailsData {
  renterNameEnglish: string;
  renterNameLocal?: string;
  agreementDate?: string;
  agreementId?: string;
  agreementNo?: string;
  agreementFromDate: string;
  agreementToDate: string;
  rentMonthly: string | number;
  rentYearly: string | number;
  taxLiability?: string;
  rentType?: string;
  duration?: string;
  rentFreq?: string;
  securityDeposit?: string | number;
  depositType?: string;
  mobileNo?: string;
  emailId?: string;
  aadhaar?: string;
  pan?: string;
  tenantAddress?: string;
}

export interface RenterDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  renterData: RenterDetailsData;
  onSave: (data: any) => void;
}

/* ── Renter details form component props ─────────────────────────────────── */
export interface RenterDetailsFormProps {
  form: any;
  errors: any;
  handleMonthlyRentChange: (val: string) => void;
  handleFieldChange: (field: string, val: string) => void;
  handleLocalNameBlur?: (val: string) => void;
  t: (key: string, values?: any) => string;
}

export interface RenterIdentityFieldsProps {
  form: any;
  errors: any;
  handleFieldChange: (field: string, val: string) => void;
  handleLocalNameBlur?: (val: string) => void;
  t: (key: string, values?: any) => string;
}

export interface RenterLeaseFieldsProps {
  form: any;
  errors: any;
  handleMonthlyRentChange: (val: string) => void;
  handleFieldChange: (field: string, val: string) => void;
  t: (key: string, values?: any) => string;
}
