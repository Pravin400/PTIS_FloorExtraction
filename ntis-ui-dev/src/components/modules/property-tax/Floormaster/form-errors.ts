/**
 * Shared utility for handling API error messages in Floor/SubFloor forms
 */

interface ApiErrorResult {
  statusCode?: number;
  message?: string;
}

interface TranslationFunctions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, params?: Record<string, any>) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tCommon: (key: string, params?: Record<string, any>) => string;
}

/**
 * Backend error code to user-friendly message mapping
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  // Floor errors
  'FloorCode_MaxLen_5': 'Floor Code must be maximum 5 characters',
  'Floor_Description_Required': 'Floor Description is required',
  'Floor_DescriptionEnglish_Required': 'English Description is required',
  'Floor_DescriptionEnglish_MaxLen': 'Description (English) cannot exceed 100 characters',
  'Floor_FloorCode_Required': 'Floor Code is required',
  'FloorCode_Required': 'Floor Code is required',
  'Floor_SequenceNo_Required': 'Sequence Number is required',
  // SubFloor errors
  'SubFloorId_MaxLen_5': 'Sub-Floor Code must be maximum 5 characters',
  'SubFloorCode_MaxLen_5': 'Sub-Floor Code must be maximum 5 characters',
  'SubFloor_Description_Required': 'Sub-Floor Description is required',
  'SubFloor_SubFloorCode_Required': 'Sub-Floor Code is required',
  'SubFloorCode_Required': 'Sub-Floor Code is required',
  // Generic errors
  'Required': 'This field is required',
  'MaxLength': 'Maximum length exceeded',
};

/**
 * Maps backend field names to form field names
 */
const FIELD_NAME_MAPPING: Record<string, string> = {
  // Floor fields
  'FloorCode': 'floorCode',
  'Description': 'description',
  'DescriptionEnglish': 'descriptionEnglish',
  'descriptionEnglish': 'descriptionEnglish',
  'SequenceNo': 'sequenceNo',
  // SubFloor fields
  'SubFloorCode': 'subFloorCode',
  'SubFloorId': 'subFloorCode',
  // Template fields (for range creation)
  'Template.Description': 'description',
};

/**
 * Parse RFC 9110 Problem Details format and return field-specific errors
 * Returns: { fieldErrors: Record<string, string>, genericError: string | null, isRfc9110: boolean }
 * isRfc9110 indicates whether the message was a valid RFC 9110 payload (use for deciding error handling path)
 */
export function parseApiFieldErrors(message: string): {
  fieldErrors: Record<string, string>;
  genericError: string | null;
  isRfc9110: boolean;
} {
  const result = {
    fieldErrors: {} as Record<string, string>,
    genericError: null as string | null,
    isRfc9110: false,
  };

  try {
    const parsed = JSON.parse(message);
    
    // Check if it's RFC 9110 Problem Details format
    if (parsed && typeof parsed === 'object' && parsed.errors) {
      result.isRfc9110 = true;
      
      // Extract errors from the errors object
      for (const [field, codes] of Object.entries(parsed.errors)) {
        if (Array.isArray(codes) && codes.length > 0) {
          const code = codes[0] as string;
          // Try to get user-friendly message from mapping
          const friendlyMessage = ERROR_CODE_MESSAGES[code] || code.replace(/_/g, ' ');
          
          // Map backend field name to form field name
          const formFieldName = FIELD_NAME_MAPPING[field] || field.charAt(0).toLowerCase() + field.slice(1);
          
          result.fieldErrors[formFieldName] = friendlyMessage;
        }
      }
      
      // If no field errors found, use title as generic error
      if (Object.keys(result.fieldErrors).length === 0 && parsed.title) {
        result.genericError = parsed.title;
      }
    }
  } catch {
    // Not a JSON response - don't set genericError here, let the caller handle with getApiErrorMessage
  }

  return result;
}

/**
 * Parse RFC 9110 Problem Details format error response
 * Format: { type, title, status, errors: { fieldName: ["ErrorCode"] }, traceId }
 */
function parseRfc9110Error(message: string): string | null {
  try {
    const parsed = JSON.parse(message);
    
    // Check if it's RFC 9110 Problem Details format
    if (parsed && typeof parsed === 'object' && parsed.errors) {
      const errorMessages: string[] = [];
      
      // Extract errors from the errors object
      for (const [field, codes] of Object.entries(parsed.errors)) {
        if (Array.isArray(codes)) {
          for (const code of codes) {
            // Try to get user-friendly message from mapping
            const friendlyMessage = ERROR_CODE_MESSAGES[code as string];
            if (friendlyMessage) {
              errorMessages.push(friendlyMessage);
            } else {
              // Fallback: format the error code into readable text
              const formattedField = field.replace(/([A-Z])/g, ' $1').trim();
              const formattedCode = (code as string)
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .trim();
              errorMessages.push(`${formattedField}: ${formattedCode}`);
            }
          }
        }
      }
      
      if (errorMessages.length > 0) {
        return errorMessages.join('. ');
      }
      
      // Fallback to title if no specific errors
      if (parsed.title) {
        return parsed.title;
      }
    }
  } catch {
    // Not a JSON response, return null to use fallback
  }
  return null;
}

/**
 * Converts API error responses to user-friendly translated messages
 * Handles 409 (duplicate), 400, 404, 401/403, and 500+ errors
 * Also parses RFC 9110 Problem Details format errors
 */
export function getApiErrorMessage(
  result: ApiErrorResult,
  translations: TranslationFunctions
): string {
  const { t, tCommon } = translations;

  // Try to parse RFC 9110 Problem Details format first
  if (result.message) {
    const parsedError = parseRfc9110Error(result.message);
    if (parsedError) {
      return parsedError;
    }
  }

  // First check the actual message content for duplicates
  const msg = result.message?.toLowerCase() || '';
  if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('same details')) {
    // Return the backend message directly for duplicate errors
    return result.message || t('apiErrors.duplicateRecord');
  }

  // Then check status codes
  if (result.statusCode === 409) return t('apiErrors.duplicateRecord');
  if (result.statusCode === 400) return result.message || t('apiErrors.invalidData');
  if (result.statusCode === 404) return t('apiErrors.notFound');
  if (result.statusCode === 401 || result.statusCode === 403) {
    return tCommon('errors.unauthorized');
  }
  if (result.statusCode && result.statusCode >= 500) {
    return tCommon('errors.serverError');
  }

  // Return backend message if available, otherwise generic error
  return result.message || t('apiErrors.operationFailed');
}
