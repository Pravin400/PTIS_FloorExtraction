import type { SearchCriteria } from "@/types/property-search";

/**
 * Empty/initial state for the Property Search form.
 * Used to reset the form and to seed the parent `PropertySearch` container.
 */
export const INITIAL_SEARCH_CRITERIA: SearchCriteria = {
  // Top filters
  propertyType: "",
  typeFilter: "",
  propertyDescription: "",
  zoneId: 0,
  wardId: 0,
  // Quick Search
  scanQR: "",
  propertyNoFrom: "",
  propertyNoTo: "",
  oldPropertyNo: "",
  upicId: "",
  citySurveyNo: "",
  subZoneNo: "",
  plotNo: "",
  // KYC
  holderName: "",
  occupierName: "",
  mobile: "",
  shopBuildingName: "",
  societyName: "",
  address: "",
  // Values & Dues
  valuesZone: "",
  valuesWard: "",
  valuationMethod: "",
  rateableValueFilter: "",
  rateableValueFrom: "",
  rateableValueTo: "",
  capitalValueFilter: "",
  capitalValueFrom: "",
  capitalValueTo: "",
  taxDefaulter: "",
  taxDefaulterFromValue: "",
  taxDefaulterToValue: "",
  betweenValue: "",
};

export const PROPERTY_TYPE_OPTIONS = [
  "assessed",
  "unassessed",
  "partiallyAssessed",
] as const;

export const TYPE_FILTER_OPTIONS = [
  "geoSequencing",
  "internalSurvey",
  "dataEntry",
  "assessment",
  "approvalByUlb",
  "noticeDistribution",
  "hearingAndAppeal",
  "billDistribution",
  "billGeneration",
  "billRecovery",
] as const;

export type PropertyTypeOption = (typeof PROPERTY_TYPE_OPTIONS)[number];
export type TypeFilterOption = (typeof TYPE_FILTER_OPTIONS)[number];

/** Maps legacy English URL values to stable option keys. */
export const LEGACY_PROPERTY_TYPE_VALUES: Record<string, PropertyTypeOption> = {
  Assessed: "assessed",
  Unassessed: "unassessed",
  "Partially Assessed": "partiallyAssessed",
};

export const LEGACY_TYPE_FILTER_VALUES: Record<string, TypeFilterOption> = {
  "Geo-sequencing": "geoSequencing",
  "Internal Survey": "internalSurvey",
  "Data Entry & Quality Co...": "dataEntry",
  Assessment: "assessment",
  "Approval by ULB": "approvalByUlb",
  "Notice Distribution": "noticeDistribution",
  "Hearing and Appeals": "hearingAndAppeal",
  "Bills Distribution": "billDistribution",
  "Bill Generation": "billGeneration",
  "Bill Recovery": "billRecovery",
};
