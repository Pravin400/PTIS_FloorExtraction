import type { PagedResponse } from "../common.types";
export type { PagedResponse };

export const METERED_BILLING_METHODS = ["Metered", "Slab", "Telescopic", "Hybrid"] as const;
export const NON_METERED_BILLING_METHODS = ["Flat", "Fixed", "Annual"] as const;

export interface ConnectionCategory {
  [key: string]: unknown;
  id: number;
  connectionCategoryCode: string;
  connectionCategory: string;
  billingFrequencyId?: number | null;
  billingFrequencyCode?: string | null;
  billingFrequency?: string | null;
  isMetered: boolean;
  billingMethod: string;
  description?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface BillingFrequencyOption {
  id: number;
  billingFrequencyCode: string;
  billingFrequency: string;
  periodsPerYear?: number;
  isActive?: boolean;
}

export interface ConnectionCategoryFormModel {
  id?: number;
  connectionCategoryCode?: string;
  connectionCategory: string;
  billingFrequencyId: number | null;
  isMetered: boolean;
  billingMethod: string;
  description: string;
  isActive: boolean;
}

export interface ConnectionCategoryMasterProps {
  data: PagedResponse<ConnectionCategory>;
}
