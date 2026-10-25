/**
 * Type definitions for DualMethod API
 * Endpoint: GET /api/DualMethod/{propertyId}
 */

import { PtisTaxDetail } from './ptis-core.types';

export type DualMethodTaxes = PtisTaxDetail[];

/**
 * Dual method comparison response
 * Compares old taxes, rateable value taxes, capital value taxes, and retained taxes
 */
export interface DualMethodResponse {
  /** Tax breakdown from old assessment */
  oldTaxes: DualMethodTaxes;
  /** Tax breakdown calculated using rateable value method */
  rvTaxes: DualMethodTaxes;
  /** Tax breakdown calculated using capital value method */
  cvTaxes: DualMethodTaxes;
  /** Tax breakdown to be retained (beneficial to taxpayer) */
  retainTaxes: DualMethodTaxes;
  /** Total tax from old assessment */
  oldTaxesTotal?: number;
  /** Total tax using rateable value method */
  rvTaxesTotal?: number;
  /** Total tax using capital value method */
  cvTaxesTotal?: number;
  /** Total retained tax */
  retainTaxesTotal?: number;
  oldRv?: number;
  oldRV?: number;
  oldTaxTotal?: number;
  totalRv?: number;
  totalRV?: number;
  totalCv?: number;
  totalCV?: number;
  rvTaxTotal?: number;
  cvTaxTotal?: number;
  retainTaxTotal?: number;
}

/**
 * Comparison data structure for dual method analysis
 * Used for generating comparison tables
 */
export interface DualMethodComparisonData {
  /** Old taxes as key-value pairs */
  oldTaxes: Record<string, number>;
  /** Rateable value taxes as key-value pairs */
  rvTaxes: Record<string, number>;
  /** Capital value taxes as key-value pairs */
  cvTaxes: Record<string, number>;
  /** Retained taxes as key-value pairs */
  retainTaxes: Record<string, number>;
}
