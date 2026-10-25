/**
 * Server-side validation error codes for Property Type operations
 * 
 * These codes are used in API responses and can be mapped to i18n translation keys.
 * The corresponding translation keys are at: propertyType.propertyType.serverValidation.*
 * 
 * Example mapping:
 *   INVALID_PROPERTY_TYPE_ID → propertyType.propertyType.serverValidation.invalidPropertyTypeId
 */
export const PROPERTY_TYPE_ERROR_CODES = {
  /** Property Type ID is invalid or missing */
  INVALID_PROPERTY_TYPE_ID: 'INVALID_PROPERTY_TYPE_ID',
  /** Property description field is required */
  PROPERTY_DESCRIPTION_REQUIRED: 'PROPERTY_DESCRIPTION_REQUIRED',
  /** English description field is required */
  DESCRIPTION_ENGLISH_REQUIRED: 'DESCRIPTION_ENGLISH_REQUIRED',
  /** Type field is required */
  TYPE_REQUIRED: 'TYPE_REQUIRED',
  /** Property type group field is required */
  PROPERTY_TYPE_GROUP_REQUIRED: 'PROPERTY_TYPE_GROUP_REQUIRED',
  /** Property type category is required */
  CATEGORY_REQUIRED: 'CATEGORY_REQUIRED',
  /** Property Type ID is required for update operation */
  ID_REQUIRED_FOR_UPDATE: 'ID_REQUIRED_FOR_UPDATE',
  /** Failed to create property type */
  CREATE_FAILED: 'CREATE_FAILED',
  /** Failed to update property type */
  UPDATE_FAILED: 'UPDATE_FAILED',
  /** Failed to delete property type */
  DELETE_FAILED: 'DELETE_FAILED',
  /** Failed to purge delete property type */
  PURGE_DELETE_FAILED: 'PURGE_DELETE_FAILED',
} as const;

export type PropertyTypeErrorCode = typeof PROPERTY_TYPE_ERROR_CODES[keyof typeof PROPERTY_TYPE_ERROR_CODES];

/**
 * Maps error codes to i18n translation keys
 */
export const ERROR_CODE_TO_I18N_KEY: Record<PropertyTypeErrorCode, string> = {
  [PROPERTY_TYPE_ERROR_CODES.INVALID_PROPERTY_TYPE_ID]: 'serverValidation.invalidPropertyTypeId',
  [PROPERTY_TYPE_ERROR_CODES.PROPERTY_DESCRIPTION_REQUIRED]: 'serverValidation.propertyDescriptionRequired',
  [PROPERTY_TYPE_ERROR_CODES.DESCRIPTION_ENGLISH_REQUIRED]: 'serverValidation.descriptionEnglishRequired',
  [PROPERTY_TYPE_ERROR_CODES.TYPE_REQUIRED]: 'serverValidation.typeRequired',
  [PROPERTY_TYPE_ERROR_CODES.PROPERTY_TYPE_GROUP_REQUIRED]: 'serverValidation.propertyTypeGroupRequired',
  [PROPERTY_TYPE_ERROR_CODES.CATEGORY_REQUIRED]: 'serverValidation.categoryRequired',
  [PROPERTY_TYPE_ERROR_CODES.ID_REQUIRED_FOR_UPDATE]: 'serverValidation.idRequiredForUpdate',
  [PROPERTY_TYPE_ERROR_CODES.CREATE_FAILED]: 'serverValidation.createFailed',
  [PROPERTY_TYPE_ERROR_CODES.UPDATE_FAILED]: 'serverValidation.updateFailed',
  [PROPERTY_TYPE_ERROR_CODES.DELETE_FAILED]: 'serverValidation.deleteFailed',
  [PROPERTY_TYPE_ERROR_CODES.PURGE_DELETE_FAILED]: 'serverValidation.purgeDeleteFailed',
};

/**
 * Maximum number of property types to search when looking for newly created record ID
 * Used in fallback search after creation when API doesn't return the ID
 */
export const PROPERTY_TYPE_SEARCH_MAX_RECORDS = 100;
