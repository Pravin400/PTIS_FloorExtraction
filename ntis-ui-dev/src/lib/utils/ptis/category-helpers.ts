/**
 * Centralized helper for property category checks.
 * Eliminates duplicated `isPlotCategory` logic across PtisMainScreen,
 * useFloorSubmission, and AddFloorDrawer.
 *
 * @module category-helpers
 */

/**
 * Determines whether a property category represents an open-plot type.
 *
 * @param category - The category string from the property details (e.g. 'Plot', 'Open Plot', 'Residential')
 * @returns `true` if the category represents a plot/open-plot property
 */
export const isPlotCategory = (category?: string | null): boolean => {
  if (!category) return false;
  const normalized = category.toLowerCase().trim();
  return normalized === 'plot' || normalized === 'open plot';
};

/**
 * Determines whether a property category represents an Apartment type.
 *
 * @param category - The category string from property details (e.g. 'Apartment', 'Residential Apartment')
 * @returns `true` if the category represents an Apartment property
 */
export const isApartmentCategory = (category?: string | null): boolean => {
  if (!category) return false;
  const normalized = category.toLowerCase().trim();
  return normalized === 'apartment' || normalized.includes('apartment');
};

