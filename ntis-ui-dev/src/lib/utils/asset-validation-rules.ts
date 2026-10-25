/**
 * Validation Rules - Regular expressions and sanitization patterns
 * 
 * @module validation-rules
 * 
 * ## Exports
 * 
 * ### Code Validation
 * - `CODE_REGEX` - Validates alphanumeric and underscore (A-Z, a-z, 0-9, _) - underscore only in between
 * - `CODE_SANITIZE` - Removes invalid characters for code fields
 * 
 * ### Description Validation
 * - `DESCRIPTION_REGEX` - Validates multilingual text starting with alphanumeric, allowing spaces and punctuation, preventing consecutive spaces and consecutive punctuation
 * - `DESCRIPTION_SANITIZE` - Removes invalid characters for descriptions
 * 
 * ### Text Validation
 * - `TEXT_SANITIZE` - Generic text sanitization
 * - `TEXT_ALLOWED` - Generic text validation starting with alphanumeric, allowing spaces and punctuation, preventing consecutive spaces and consecutive punctuation
 * 
 * ### Search Validation
 * - `SEARCH_KEY_REGEX` - Search key validation
 */

/* ================= CODE VALIDATION ================= */
// Generic Code Validation: Allow alphanumeric characters and underscore (A-Z, a-z, 0-9, _)
// Must start and end with alphanumeric, underscore only allowed in between
// Used across all modules (Construction, Tax Zone, etc.)
export const CODE_REGEX = /^(?!^0+$)[A-Za-z0-9](?:[A-Za-z0-9_\-]*[A-Za-z0-9])?$/;
export const CODE_SANITIZE = /[^A-Za-z0-9_\-]/g; // Remove any characters except alphanumeric, underscore, and hyphen

// Asset Mouja No: Allow alphanumeric (English), single hyphens (-), and underscores (_) in between
export const ASSET_MOUJA_NO_REGEX = /^(?!^0+$)(?!.*[_-]{2,})[A-Za-z0-9](?:[A-Za-z0-9_\-]*[A-Za-z0-9])?$/;
export const ASSET_MOUJA_NO_SANITIZE = /[^A-Za-z0-9_\-]/g;
// Asset Sub-Zone No: Allow alphanumeric (multilingual), dot (.), hyphen (-), and slash (/)
export const ASSET_SUBZONE_NO_REGEX = /^(?!^0+$)[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N}.\-\/]*[\p{L}\p{M}\p{N}])?$/u;
export const ASSET_SUBZONE_NO_SANITIZE = /[^\p{L}\p{M}\p{N}.\-\/]/gu;

/* ================= DESCRIPTION VALIDATION ================= */
// Allows Unicode letters, marks, numbers, selected punctuation, and normal space (no tabs/newlines).
// Must start with a Unicode letter/mark/number.
// Rejects consecutive spaces, consecutive punctuation, trailing spaces, and trailing punctuation
// except period (.) or closing parenthesis ()).
export const DESCRIPTION_REGEX = /^(?!^0+$)(?!.* {2})(?!.*[\/,.\-()&]{2,})(?!.* $)[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N} \/,.\-()&]*[\p{L}\p{M}\p{N}.)])?$/u;
export const DESCRIPTION_SANITIZE = /[^\p{L}\p{M}\p{N} \/,.\-()&]/gu;

/* ================= TEXT VALIDATION ================= */
// Allow Unicode letters, marks, numbers, spaces, and basic punctuation including & and _
// (no tabs/newlines).
export const TEXT_SANITIZE = /[^\p{L}\p{M}\p{N} ,.\-\/&_]/gu;
export const ASSET_MASTER_TEXT_SANITIZE = /[^\p{L}\p{M}\p{N} ,.\-\/&()]/gu;
export const ASSET_INVENTORY_NAME_SANITIZE = /[^\p{L}\p{M}\p{N} ]/gu;
export const ASSET_INVENTORY_NAME_REGEX = /^(?!.* {2})(?!.* $)[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N} ]*[\p{L}\p{M}\p{N}])?$/u;
export const ASSET_MASTER_NAME_SANITIZE = /[^\p{L}\p{M}\p{N} _-]/gu;
export const ASSET_MASTER_NAME_REGEX = /^(?!^0+$)(?!.* {2})(?!.*[_-]{2,})(?!.* $)[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N} _-]*[\p{L}\p{M}\p{N}])?$/u;
// Allows Unicode letters, marks, numbers, selected punctuation, and normal space (no tabs/newlines).
// Must start with a Unicode letter/mark/number.
// Rejects consecutive spaces, consecutive punctuation, trailing spaces, and trailing punctuation
// except period (.). Single-character values are allowed.
export const TEXT_ALLOWED = /^(?!.* {2})(?!.*[,.\-\/&]{2,})(?!.* $)[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N} ,.\-\/&]*[\p{L}\p{M}\p{N}.])?$/u;
export const DISPLAY_NAME_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/]/gu;
export const UNIT_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/%]/gu;


/* ================= TRANSLATION TEXT VALIDATION ================= */
// Translation text: Allow multilingual characters, underscore, hyphen, basic punctuation
// Does NOT allow: @#$%^*&
// Allows: Unicode letters, marks, numbers, spaces, comma, period, hyphen, slash, underscore, parentheses
export const TRANSLATION_TEXT_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/_()]/gu;

/* ================= SEARCH VALIDATION ================= */
export const SEARCH_KEY_REGEX = /^[A-Za-z0-9+\-_]+$/;
export const SEARCH_ALPHANUMERIC_SANITIZE = /[^A-Za-z0-9\s+\-_]/g;
export const USER_SEARCH_SANITIZE = /[^\p{L}\p{M}\p{N} ,.\-\/&_@]/gu;

/* ================= NAME ONLY VALIDATION ================= */
// Name fields: Unicode letters and spaces only. No numbers, no special characters.
export const NAME_ONLY_REGEX = /^[\p{L}\p{M}\s]+$/u;
export const NAME_ONLY_SANITIZE = /[^\p{L}\p{M}\s]/gu;

/* ================= ALPHANUMERIC WITH SPACES VALIDATION ================= */
// Generic alphanumeric with separators: Unicode letters, marks, numbers, dots, and whitespace separators.
// No special characters (e.g., @, #, $, %, ^, &, *, (, )) are allowed (dots are allowed).
// Must start and end with an alphanumeric; a single separator is allowed between tokens.
export const ALPHANUMERIC_WITH_SPACES_REGEX = /^[\p{L}\p{M}\p{N}]+(?:[\s.][\p{L}\p{M}\p{N}]+)*$/u;
export const ALPHANUMERIC_WITH_SPACES_SANITIZE = /[^\p{L}\p{M}\p{N}.\s]/gu;

// Code fields (letters only, no spaces, no numbers, no special characters)
export const LETTERS_ONLY_REGEX = /^[\p{L}\p{M}]+$/u;
export const LETTERS_ONLY_SANITIZE = /[^\p{L}\p{M}]/gu;

/* ================= ENGLISH ONLY VALIDATION ================= */
// English only: English letters and single spaces between words only (no numbers, no special chars, no multilingual)
export const ENGLISH_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
export const ENGLISH_SANITIZE = /[^A-Za-z ]/g;

/* ================= SOCIETY VALIDATION ================= */
export const PERSON_NAME_REGEX = /^[\p{L}\p{M}\s.,'-]+$/u;
// Sanitize pattern for person names: removes anything not letter/mark/space/period/comma/apostrophe/hyphen
export const PERSON_NAME_SANITIZE = /[^\p{L}\p{M}\s.,'-]/gu;
export const VALID_TLD_REGEX = /^(com|in|org|net|edu|gov|mil|info|biz|me|io|nic|ai|app|dev|tech|online|store|site|live|pro|xyz|club|agency|digital|solutions|company|email|cloud|finance|global|group|services|systems|world|today|news|media|care|center)$/i;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu|gov|mil|info|biz|me|io|nic|ai|app|dev|tech|online|store|site|live|pro|xyz|club|agency|digital|solutions|company|email|cloud|finance|global|group|services|systems|world|today|news|media|care|center)(?:\.[a-zA-Z]{2})?$/i;
export const EMAIL_LOWERCASE_RESTRICTED_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.(com|in)$/;
export const limitSingleAtEmail = (v: string): string => {
  const cleaned = v.toLowerCase().replace(/[^\w@.+-]/g, '');

  const first = cleaned.indexOf('@');
  if (first === -1) return cleaned;

  return (
    cleaned.slice(0, first + 1) +
    cleaned.slice(first + 1).replace(/@/g, '')
  );
};
export const OWNER_NAME_REGEX =
  /^[\p{L}\p{M}\s.,&'()\/\-:]+$/u;
export const OWNER_NAME_SANITIZE =
  /[^\p{L}\p{M}\s.,&'()\/\-:]/gu;


export const limitOldPropertyNo = (v: string) => {
  const cleaned = v
    .replace(/[^0-9/-]/g, '')       // allow only digits, /, -
    .replace(/([/-]){2,}/g, '$1');  // prevent duplicate separators

  const parts = cleaned.split(/([/-])/);

  let result = '';

  for (const part of parts) {
    if (part === '/' || part === '-') {
      result += part;
    } else {
      const digits = part.replace(/\D/g, '');
      result += digits; // allow unlimited digits per block
    }
  }

  return result;
};
export const MOBILE_10_REGEX = /^[6-9][0-9]{9}$/;
export const PINCODE_6_REGEX = /^[1-9][0-9]{5}$/;
export const PINCODE_SANITIZE = /[^0-9]/g;
export const CITY_NAME_REGEX = /^[a-zA-Z\s]+$/;
export const YEAR_REGEX = /^[0-9०-९]{4}$/;
// Positive integer (one or more digits, no decimal/sign). Generic — usable
// for BHK, room counts, floor counts, etc.
export const POSITIVE_INTEGER_REGEX = /^\d+$/;
export const ONE_TO_NINETY_NINE_REGEX = /^(?:[1-9]|[1-9][0-9])$/;
export const limitTwoDigitNumber = (value: string): string =>
  value.replace(/[^0-9]/g, "").slice(0, 2);



/* ================= POSITIVE DECIMAL VALIDATION ================= */
// Regex pattern to match invalid keys for positive decimal input (blocks e, E, +, -)
export const POSITIVE_DECIMAL_INVALID_KEYS = /^[eE+\-]$/;

/* ================= ALL ZEROS VALIDATION ================= */
/**
 * Check if a string contains only zeros (e.g., "0", "00", "000", "0000")
 * Used to prevent invalid codes/names like "0000" in Zone Master, Rate Section Master, etc.
 * @param value - The string value to check
 * @returns true if the value consists only of zeros, false otherwise
 */
export const isAllZeros = (value: string): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return /^0+$/.test(trimmed);
};

// Apartment QC Basic Information form validation 
export const OWNERNAME_REGEX =
  /[^\p{L}\p{M}\s.,&'`()\/:-]/gu;

/* ================= OPTIONS COMMA SEPARATED VALIDATION ================= */
// Allows Unicode letters, marks, numbers, spaces, and optional space after commas.
// Rejects consecutive spaces and trailing commas.
export const OPTIONS_COMMA_SEPARATED_REGEX =
  /^(?!.* {2})[\p{L}\p{M}\p{N}]+(?: [\p{L}\p{M}\p{N}]+)*(?:, ?[\p{L}\p{M}\p{N}]+(?: [\p{L}\p{M}\p{N}]+)*)*$/u;
export const OPTIONS_COMMA_SEPARATED_SANITIZE =
  /[^\p{L}\p{M}\p{N} ,]/gu;