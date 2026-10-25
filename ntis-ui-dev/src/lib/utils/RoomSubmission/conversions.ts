/**
 * Utility for area and measurement conversions
 */

export const CONVERSION_FACTORS = {
  SQFT_TO_SQM: 0.092903,
  SQM_TO_SQFT: 10.764,
  BUILTUP_MULTIPLIER: 1.2, // 20% increase for built-up area
};

/**
 * Converts Square Feet to Square Meters (rounded to 2 decimal places)
 */
export const convertSqFtToSqM = (sqFt: number | string): number => {
  const value = typeof sqFt === 'string' ? parseFloat(sqFt) : sqFt;
  if (isNaN(value)) return 0;
  return Number((value * CONVERSION_FACTORS.SQFT_TO_SQM).toFixed(2));
};

/**
 * Converts Square Meters to Square Feet (rounded to 2 decimal places)
 */
export const convertSqMToSqFt = (sqM: number | string): number => {
  const value = typeof sqM === 'string' ? parseFloat(sqM) : sqM;
  if (isNaN(value)) return 0;
  return Number((value * CONVERSION_FACTORS.SQM_TO_SQFT).toFixed(2));
};

/**
 * Calculates Built-up Area from Carpet Area (rounded to 2 decimal places)
 */
export const calculateBuiltUpArea = (carpetArea: number | string): number => {
  const value = typeof carpetArea === 'string' ? parseFloat(carpetArea) : carpetArea;
  if (isNaN(value)) return 0;
  return Number((value * CONVERSION_FACTORS.BUILTUP_MULTIPLIER).toFixed(2));
};
