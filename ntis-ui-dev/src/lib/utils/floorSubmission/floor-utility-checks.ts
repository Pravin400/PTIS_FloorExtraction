/**
 * Utility functions for Floor Submission checks
 */

/**
 * Checks if the given Type Of Use Category ID belongs to a Utility category (ID 1 or 2).
 * 
 * @param typeOfUseCategoryId - Category ID returned by the API
 * @returns boolean
 */
export const checkIsUtilityCategory = (
  typeOfUseCategoryId: number | string | null | undefined
): boolean => {
  if (typeOfUseCategoryId === undefined || typeOfUseCategoryId === null || typeOfUseCategoryId === '') {
    return false;
  }
  const categoryId = Number(typeOfUseCategoryId);
  return categoryId === 1;
};
