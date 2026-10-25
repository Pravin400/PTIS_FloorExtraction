export interface LookupOption {
  value: string;
  label: string;
}

export interface FinancialYearLookupOption extends LookupOption {
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}
