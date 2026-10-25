/**
 * Renter and tenant type definitions
 */

export interface RenterDetailItem {
    id?: number;
    renterId?: number | string;
    renterName?: string;
    renterNameEnglish?: string;
    rentAmount?: number;
    rentMonthly?: number;
    rentYearly?: number;
    agreementFromDate?: string;
    agreementToDate?: string;
    agreementDate?: string;
    durationFrom?: string;
    durationTo?: string;
    incrementFrequency?: string;
    incrementType?: string;
    incrementValue?: number;
    incrementMethod?: string;
    incrementStatus?: boolean;
    isActive?: boolean;
    documentBindingId?: number;
    documentGuid?: string;
    [key: string]: unknown;
}

export interface RenterMastItem {
    id?: number;
    renterMastId?: number | string;
    renterType?: string;
    renterCategory?: string;
    financialYear?: string;
    finalRent?: number;
    durationFrom?: string;
    durationTo?: string;
    incrementCount?: number;
    totalRentCollected?: number;
    monthCount?: number;
    isActive?: boolean;
    taxLiability?: string;
    documentBindingId?: number;
    documentGuid?: string;
    [key: string]: unknown;
}

export interface RenterAPIResponse {
    id?: number;
    renterId?: number;
    renterName?: string;
    renterNameEnglish?: string;
    rentMonthly?: number;
    rentYearly?: number;
    agreementFromDate?: string;
    agreementToDate?: string;
    agreementDate?: string;
    [key: string]: unknown;
}
