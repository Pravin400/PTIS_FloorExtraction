/**
 * Type definitions for Rateable Value API
 * Endpoint: POST /rateable-value/{propertyId}
 */

import { PtisTaxDetail } from './ptis-core.types';

export type RateableTax = PtisTaxDetail;

export type RateableValueTaxes = RateableTax[];

/**
 * Request payload / query options for Rateable Value API
 */
export interface RateableValueRequest {
    /** Force recalculation of rateable value ignoring cache */
    forceRecalculate?: boolean;
}


/**
 * Policy information for rateable value calculation
 */
export interface RateableValuePolicy {
    /** Unique policy code identifier */
    policyCode: string;
    /** Date when the policy was issued */
    policyDate: string;
    /** Financial year for the policy */
    policyYear: number;
    /** Rateable or Capital value threshold */
    policyRVorCVvalue: number;
    /** Total tax calculated under this policy */
    taxTotal: number;
    /** Breakdown of taxes by type */
    taxes: RateableValueTaxes;
}

/**
 * Detailed rateable value information for a single floor/property detail
 */
export interface RateableValueDetail {
    /** Unique identifier for the property detail/floor */
    propertyDetailsId: number;
    /** Floor number or description */
    floor: string;
    /** Sub Floor description */
    subFloor?: string;
    /** Year when construction was completed */
    constructionYear: string;
    /** Assessment year for tax calculation */
    assessmentYear: string;
    /** Type of construction (e.g., RCC, Pucca) */
    constructionType: string;
    /** Primary use of the property (e.g., Residential, Commercial) */
    use: string;
    /** Sub-type of use (e.g., Flat, Shop) */
    subTypeOfUse: string;
    /** Number of rooms in the property */
    noOfRooms: number;
    /** Carpet area in square feet */
    carpetAreaSqFeet: number;
    /** Carpet area in square meters */
    carpetAreaSqMeter: number;
    /** Built-up area in square feet */
    builtupAreaSqFeet: number;
    /** Built-up area in square meters */
    builtupAreaSqMeter: number;
    /** Occupancy certificate number */
    occupancyNumber: string;
    /** Date of occupancy certificate */
    occupancyDate: string | null;
    /** Name of the renter (if rented) */
    renterName: string;
    /** Monthly rent amount */
    rentMonthly: number;
    /** Yearly rent amount */
    rentYearly: number;
    /** Monthly rate per unit area */
    monthlyRate: number;
    /** Yearly rate per unit area */
    yearlyRate: number;
    /** Total yearly rent */
    yearlyRent: number;
    /** Depreciation amount */
    depreciation: number;
    /** Annual rental value after deductions */
    annualRentalValue: number;
    /** Maintenance amount */
    maintenance: number;
    /** Final rateable value for tax calculation */
    rateableValue: number;
    /** Total tax for this floor/detail */
    taxTotal: number;
    /** Tax breakdown by type */
    taxes: RateableValueTaxes;
    /** Taxable status */
    taxable?: boolean;
    /** Depreciation percentage */
    depreciationPer?: number;
    /** Depreciation applied on (e.g. Area, Rent) */
    appliedOn?: string;
}

/**
 * Complete rateable value response for a property
 */
export interface RateableValueResponse {
    /** Unique property identifier */
    propertyId: number;
    /** Financial year for calculation */
    financeYear: number;
    /** Sum of rateable values across all floors */
    totalRateableValue?: number;
    /** Total tax calculated */
    totalTax?: number;
    /** Policy information used for calculation */
    policy: RateableValuePolicy;
    /** Detailed breakdown by floor/property detail */
    details: RateableValueDetail[];
    /** Fallback for items list in some API responses */
    items?: RateableValueDetail[];
}

/**
 * Row representation for rateable value table display
 * Contains formatted string values for UI rendering
 */
export interface RateableRow {
    /** Property detail identifier */
    id: number;
    /** Taxable status */
    taxable: string;
    /** Floor number/description */
    floor: string;
    /** Sub Floor */
    subFloor: string;
    /** Construction year */
    constructionYear: string;
    /** Assessment year */
    assessmentYear: string;
    /** Construction type */
    constructionType: string;
    /** Nature/type of building use */
    natureTypeBuilding: string;
    /** Sub-type of use */
    subType: string;
    /** Number of rooms */
    noOfRooms: string;
    /** Formatted carpet area (sq ft & sq m) */
    carpetArea: string;
    /** Formatted built-up area (sq ft & sq m) */
    builtUpArea: string;
    /** Occupancy certificate number */
    ocNumber: string;
    /** Formatted occupancy date */
    ocDate: string;
    /** Renter name */
    renterName: string;
    /** Formatted annual rent (monthly & yearly) */
    annualRent: string;
    /** Formatted rate (monthly & yearly) */
    rate: string;
    /** Formatted yearly rental value */
    yearlyRentalValue: string;
    /** Formatted depreciation */
    depreciation: string;
    /** Formatted maintenance */
    maintenance: string;
    /** Formatted annual rental value (ALV) */
    alv: string;
    /** Formatted rateable value */
    rv: string;
    /** Applied On date */
    appliedOn: string;
    /** Tax breakdown for this row */
    taxes: RateableTax[];
}
