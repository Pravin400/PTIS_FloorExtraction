export interface CustomDateRange {
    id: string;
    fromDate: string;
    toDate: string;
    incrementType: 'Percentage' | 'Fixed';
    incrementValue: number;
    calculationMethod: 'Base Value' | 'Incremented Value';
    remarks?: string;
}

export interface RenterFormDataDetails {
    renterName: string;
    agreementId: string;
    agreementDate: string;
    agreementDateFrom: string;
    agreementDateTo: string;
    rentAmount: number | string;
    rentAmountAGR: number | string;
    rentAmountSUR: number | string;
    incrementFrequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | '11-Month' | 'No Increment' | 'Custom Date';
    incrementType: 'Percentage' | 'Fixed';
    selfDeclarationAmount?: number | string;
    incrementValue: number | string;
    isCompounding?: boolean;
    viewMode?: 'monthly' | 'annual';
    customDateRanges: CustomDateRange[];
    taxLiability?: string;
    documentBindingId?: number;
    documentGuid?: string;
}

export interface RenterFormData {
    // Allow both string and number: the URL/route segment delivers a string,
    // but the resolved propertyDetailsId from the server is numeric.
    id?: string | number;
    propertyDetailsId?: string | number;
    floorId: string | number;
    renterDetails: RenterFormDataDetails;
    renterMast?: unknown[];
    renterTableEntries?: unknown[];
    grandTotal?: number;
    renterCustomIncrements?: unknown[];
    documentBindingId?: number;
    documentGuid?: string;
    [key: string]: unknown;
}

export interface RenterPayload extends Omit<RenterFormData, 'renterDetails'> {
    renterDetails: unknown[]; // API expects array
}
