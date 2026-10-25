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
 * - `DESCRIPTION_REGEX` - Validates multilingual text with punctuation (&, -, /, etc.) - special chars only in between, single space only
 * - `DESCRIPTION_SANITIZE` - Removes invalid characters for descriptions
 * 
 * ### Text Validation
 * - `TEXT_SANITIZE` - Generic text sanitization
 * - `TEXT_ALLOWED` - Generic text validation - single space only
 * 
 * ### Search Validation
 * - `SEARCH_KEY_REGEX` - Search key validation
 */

/* ================= CODE VALIDATION ================= */
// Generic Code Validation: Allow alphanumeric characters and underscore (A-Z, a-z, 0-9, _)
// Must start and end with alphanumeric, underscore only allowed in between
// Used across all modules (Construction, Tax Zone, etc.)
export const CODE_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9_]*[A-Za-z0-9])?$/;
export const CODE_SANITIZE = /[^A-Za-z0-9_]/g; // Remove any characters except alphanumeric and underscore

// Generic Code Validation with Decimal: Allow alphanumeric, underscore, and dot (A-Z, a-z, 0-9, _, .)
export const CODE_WITH_DECIMAL_REGEX = /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._]*[A-Za-z0-9])?$/;
export const CODE_WITH_DECIMAL_SANITIZE = /[^A-Za-z0-9._]/g;

// Alphanumeric only (letters and digits, no special characters, no spaces, no underscores)
export const ALPHANUMERIC_ONLY_REGEX = /^[A-Za-z0-9]+$/;
export const ALPHANUMERIC_ONLY_SANITIZE = /[^A-Za-z0-9]/g;

// Asset Mouja No: Allow alphanumeric (multilingual), hyphens (-), and underscores (_)
export const ASSET_MOUJA_NO_REGEX = /^[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N}_\-]*[\p{L}\p{M}\p{N}])?$/u;
export const ASSET_MOUJA_NO_SANITIZE = /[^\p{L}\p{M}\p{N}_\-]/gu;
// Asset Sub-Zone No: Allow alphanumeric (multilingual), dot (.), hyphen (-), and slash (/)
export const ASSET_SUBZONE_NO_REGEX = /^[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N}.\-\/]*[\p{L}\p{M}\p{N}])?$/u;
export const ASSET_SUBZONE_NO_SANITIZE = /[^\p{L}\p{M}\p{N}.\-\/]/gu;

/* ================= DESCRIPTION VALIDATION ================= */
// Description: Allow all languages (Marathi, Hindi, English) with basic punctuation
// Special characters (&, -, /, etc.) must be in between other characters
// Only single space allowed between characters, no consecutive spaces
export const DESCRIPTION_REGEX = /^(?!.*?\s{2})[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s\/,.\-()&]*$/u;
export const DESCRIPTION_SANITIZE = /[^\p{L}\p{M}\p{N}\s\/,.\-()&]/gu;

// English Description: Only English characters (A-Za-z), numbers, single spaces, and basic punctuation (&, -, /, etc.)
export const DESCRIPTION_ENGLISH_REGEX = /^(?!.*?\s{2})[A-Za-z0-9][A-Za-z0-9\s\/,.\-()&]*$/;
export const DESCRIPTION_ENGLISH_SANITIZE = /[^A-Za-z0-9\s\/,.\-()&]/g;

/* ================= TEXT VALIDATION ================= */
// Allow Unicode letters, marks, numbers, spaces, and basic punctuation including &
export const TEXT_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/&]/gu;
export const ASSET_MASTER_TEXT_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/&()]/gu;
export const ASSET_INVENTORY_NAME_SANITIZE = /[^\p{L}\p{M}\p{N}\s]/gu;
export const ASSET_INVENTORY_NAME_REGEX = /^(?!.*?\s{2})[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s]*$/u;
export const ASSET_MASTER_NAME_SANITIZE = /[^\p{L}\p{M}\p{N}\s_-]/gu;
export const ASSET_MASTER_NAME_REGEX = /^(?!.*?\s{2})[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s_-]*$/u;
// Validation for allowed characters, special chars in between, single space only, allows single char
export const TEXT_ALLOWED = /^(?!.*?\s{2})[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s,.\-\/&]*$/u;
export const DISPLAY_NAME_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/]/gu;
export const UNIT_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/%]/gu;


/* ================= TRANSLATION TEXT VALIDATION ================= */
// Translation text: Allow multilingual characters, underscore, hyphen, basic punctuation
// Does NOT allow: @#$%^*&
// Allows: Unicode letters, marks, numbers, spaces, comma, period, hyphen, slash, underscore, parentheses
export const TRANSLATION_TEXT_SANITIZE = /[^\p{L}\p{M}\p{N}\s,.\-\/_()]/gu;

/* ================= SEARCH VALIDATION ================= */
export const SEARCH_KEY_REGEX = /^[A-Za-z0-9+\-]+$/;
export const SEARCH_ALPHANUMERIC_SANITIZE = /[^A-Za-z0-9\s+\-]/g;

/* ================= NAME ONLY VALIDATION ================= */
// Name fields: Unicode letters and spaces only. No numbers, no special characters.
export const NAME_ONLY_REGEX = /^[\p{L}\p{M}\s]+$/u;
export const NAME_ONLY_SANITIZE = /[^\p{L}\p{M}\s]/gu;
export const NAME_ONLY_STRICT_REGEX = /^(?!.*?\s{2})[\p{L}\p{M}][\p{L}\p{M}\s]*$/u;

/* ================= ALPHANUMERIC WITH SPACES VALIDATION ================= */
// Generic alphanumeric with separators: Unicode letters, marks, numbers, dots, and whitespace separators.
// No special characters (e.g., @, #, $, %, ^, &, *, (, )) are allowed (dots are allowed).
// Must start and end with an alphanumeric; a single separator is allowed between tokens.
export const ALPHANUMERIC_WITH_SPACES_REGEX = /^(?!.*?\s{2})[\p{L}\p{M}\p{N}.][\p{L}\p{M}\p{N}.\s]*$/u;
export const ALPHANUMERIC_WITH_SPACES_SANITIZE = /[^\p{L}\p{M}\p{N}.\s]/gu;

// Code fields (letters only, no spaces, no numbers, no special characters)
export const LETTERS_ONLY_REGEX = /^[\p{L}\p{M}]+$/u;
export const LETTERS_ONLY_SANITIZE = /[^\p{L}\p{M}]/gu;
// Check if text contains at least one letter (supports English, Marathi, Hindi, and all Unicode scripts)
export const HAS_LETTER_REGEX = /\p{L}/u;

/* ================= BILLING FREQUENCY VALIDATION ================= */
// Billing Frequency: Allow letters, spaces, and hyphens only (supports multilingual scripts)
export const LETTERS_SPACES_HYPHENS_REGEX = /^[\p{L}\p{M}\s\-]+$/u;
export const LETTERS_SPACES_HYPHENS_SANITIZE = /[^\p{L}\p{M}\s\-]/gu;

// Periods Per Year: Positive whole numbers only, from 1 to 12
export const PERIODS_PER_YEAR_REGEX = /^(?:[1-9]|1[0-2])$/;

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

/* ================= ALPHANUMERIC + PUNCTUATION (NAME/CODE) VALIDATION ================= */
// Tax Name / Tax Code / Rule Display Name style identifier fields: alphanumeric only,
// with , . _ / \ allowed as separators between alphanumeric segments (never leading,
// trailing, or standalone) and a single space allowed between words (no
// leading/trailing/consecutive spaces). No other special characters permitted.
export const ALPHANUMERIC_PUNCTUATION_REGEX = /^[A-Za-z0-9]+(([A-Za-z0-9,._\/\\]|\s(?!\s))*[A-Za-z0-9]+)*$/;
export const ALPHANUMERIC_PUNCTUATION_SANITIZE = /[^A-Za-z0-9\s,._\/\\]/g;

/** Strips disallowed characters and collapses repeated whitespace for real-time
 *  sanitization of Tax Name/Tax Code/Display Name style fields as the user types —
 *  does not trim leading/trailing space (that would eat a just-typed trailing space
 *  before the next word), so pair with ALPHANUMERIC_PUNCTUATION_REGEX.test(value.trim())
 *  on submit. */
export const sanitizeAlphanumericPunctuation = (value: string, maxLength: number): string =>
  value
    .replace(ALPHANUMERIC_PUNCTUATION_SANITIZE, '')
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

/** Multilingual variant of {@link sanitizeAlphanumericPunctuation} for name fields that must accept
 *  any script (e.g. a Tax Name in Marathi/Hindi). Strips only characters outside Unicode
 *  letters/marks/numbers + space and , . - / ( ) & (the DESCRIPTION set), and collapses repeated
 *  whitespace. Pair with `DESCRIPTION_REGEX.test(value.trim())` on submit. */
export const sanitizeMultilingualText = (value: string, maxLength: number): string =>
  value
    .replace(DESCRIPTION_SANITIZE, '')
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

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

/* ================= TAP SIZE VALIDATION ================= */
export const TAP_SIZE_CODE_SANITIZE = /[^A-Za-z0-9._]/g;
export const TAP_SIZE_CODE_REGEX = /^(?!.*[._]{2})[A-Za-z0-9](?:[A-Za-z0-9._]*[A-Za-z0-9])?$/;

// Restrict to digits (0-9) and forward slash (/)
export const TAP_SIZE_SANITIZE = /[^0-9/]/g;
// Validate fraction (e.g. 1/2) or whole number (e.g. 1), prevent just "/" or "/6"
export const TAP_SIZE_REGEX = /^\d+(?:\/\d+)?$/;

/* ================= UPLOAD COUNT VALIDATION ================= */
// Positive integer with no leading zero (1 to 200000)
export const UPLOAD_COUNT_REGEX = /^[1-9][0-9]*$/;
export const UPLOAD_COUNT_SANITIZE = /[^0-9]/g;
export const UPLOAD_COUNT_MIN = 1;
export const UPLOAD_COUNT_MAX = 200000;

export const sanitizeUploadCount = (value: string, max: number = UPLOAD_COUNT_MAX): string => {
  const digitsOnly = value.replace(UPLOAD_COUNT_SANITIZE, '').replace(/^0+/, '');
  const maxDigits = String(max).length;
  return digitsOnly.slice(0, maxDigits);
};
