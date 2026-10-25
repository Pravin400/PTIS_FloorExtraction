/**
 * Assessment Unit and Difference Type Definitions
 */
import type { SurveyDetailDto, DifferenceDetailDto } from './apartment.types';

export interface AssessmentUnit {
  id: string;
  prop: string;
  /** The whole number (property - partition - flat); `prop` leaves out the main property number on the survey table. */
  propFull?: string;
  propertyNo?: string;
  oldPropertyNo?: string;
  oldPropertyId?: number | null;
  propertyId?: number | null;
  partitionNo?: string;
  flatNo?: string;
  wgFl: string;
  type: string;
  /** Full apartment type / property type text for the cell tooltip (the cell shows the short code). */
  typeFull?: string;
  /** BHK of the unit (new survey only). */
  bhk?: string;
  cty: string;
  ayr: string;
  cyr: string | number;
  use: string;
  cpt: number;
  cptMtr?: number | null;
  cptDisplay: string;
  bua: number;
  buaMtr?: number | null;
  buaDisplay: string;
  ocNo: string;
  occdt: string;
  rntr: string;
  rentDisplay: string;
  rent?: number | null;
  appliedOn: string;
  rateDisplay: string;
  rate: number;
  yrv: string;
  depr: string;
  alv: string;
  mr: string;
  rv: number;
  rvDisplay: string;
  tax: number;
  taxDisplay: string;
  cv: number;
  cvDisplay?: string;
  rttx: number;
  pen: number;
  exmp?: string;
  disc?: string;
  owner?: string;
  ocpr?: string;
  flr?: number | string;
  rvVsCvm?: string;
  rawSurvey?: SurveyDetailDto;
}

export interface UnitDifference {
  unitId: string;
  carpetDiff: number;
  buaDiff: number;
  rvDiff: number;
  capitalValueDiff?: number;
  taxDiff: number;
  rtTaxDiff: number;
  suggestion?: 'Verify Area' | 'Create New' | 'Verify' | null;
  rawDiff?: DifferenceDetailDto;
}

export type PtisPanelType = 'survey' | 'difference' | 'existing';
export type PtisViewMode = 'split' | 'survey-only' | 'difference-only' | 'existing-only';
export type PtisTaxMode = 'rateable' | 'capital' | 'dual';

export interface TaxHeadAmountItem {
  taxName: string;
  taxAmount: number;
  [key: string]: unknown;
}
