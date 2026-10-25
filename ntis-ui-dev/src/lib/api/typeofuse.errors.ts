/**
 * Error message constants for Type Of Use Master services
 * These match i18n translation keys for proper error handling
 */
export const TypeOfUseErrorMessages = {
  // Group errors
  FETCH_GROUPS_FAILED: 'messages.fetchGroupsFailed',
  CREATE_GROUP_FAILED: 'messages.createGroupFailed',
  UPDATE_GROUP_FAILED: 'messages.updateGroupFailed',
  DELETE_GROUP_FAILED: 'messages.deleteGroupFailed',
  DELETE_GROUP_REFERENCED: 'messages.deleteGroupReferenced',

  // Type errors
  FETCH_TYPES_FAILED: 'messages.fetchTypesFailed',
  CREATE_TYPE_FAILED: 'messages.createTypeFailed',
  UPDATE_TYPE_FAILED: 'messages.updateTypeFailed',
  DELETE_TYPE_FAILED: 'messages.deleteTypeFailed',
  DELETE_TYPE_REFERENCED: 'messages.deleteTypeReferenced',

  // SubType errors
  FETCH_SUBTYPES_FAILED: 'messages.fetchSubTypesFailed',
  CREATE_SUBTYPE_FAILED: 'messages.createSubTypeFailed',
  UPDATE_SUBTYPE_FAILED: 'messages.updateSubTypeFailed',
  DELETE_SUBTYPE_FAILED: 'messages.deleteSubTypeFailed',
  DELETE_SUBTYPE_REFERENCED: 'messages.deleteSubTypeReferenced',
  FETCH_SUBTYPE_COUNTS_FAILED: 'messages.fetchSubTypeCountsFailed',

  // Category errors
  FETCH_CATEGORIES_FAILED: 'category.messages.fetchFailed',
  CREATE_CATEGORY_FAILED: 'category.messages.createFailed',
  UPDATE_CATEGORY_FAILED: 'category.messages.updateFailed',
  DELETE_CATEGORY_FAILED: 'category.messages.deleteFailed',
} as const;

export type TypeOfUseErrorMessageKey = typeof TypeOfUseErrorMessages[keyof typeof TypeOfUseErrorMessages];
