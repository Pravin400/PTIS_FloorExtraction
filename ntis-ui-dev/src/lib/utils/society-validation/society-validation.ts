import { EMAIL_REGEX, VALID_TLD_REGEX } from '../validation-rules';

export const SOCIETY_VALIDATION_RULES = {
  /** Required length for mobile number (10 digits) */
  MOBILE_LENGTH: 10,
  /** Minimum length for names (2 characters) */
  NAME_MIN_LENGTH: 2,
  /** Maximum length for person names - Manager, Secretary, LandOwner, Builder (200 characters) */
  PERSON_NAME_MAX_LENGTH: 200,
  /** Maximum length for society/building name (500 characters) */
  SOCIETY_NAME_MAX_LENGTH: 500,
  /** Maximum length for society address (200 characters) */
  ADDRESS_MAX_LENGTH: 200,
  /** Maximum length for email fields (100 characters) */
  EMAIL_MAX_LENGTH: 100,
} as const;

/**
 * Check if a number contains repeated or invalid sequences
 * Rejects patterns like 00000, 111111, 222222, etc.
 */
const hasRepeatedSequence = (digits: string, minLength: number = 5): boolean => {
  if (!digits || digits.length < minLength) return false;

  for (let i = 0; i <= digits.length - minLength; i++) {
    const char = digits[i];
    let count = 1;
    for (let j = i + 1; j < digits.length && digits[j] === char; j++) {
      count++;
      if (count >= minLength) return true;
    }
  }
  return false;
};

export const societyValidators = {
  /**
   * Check if value contains only special characters (invalid)
   */
  isOnlySpecialCharacters: (value: string): boolean => {
    if (!value || !value.trim()) return false;
    const hasValidChars = /[\p{L}]/u.test(value);
    return !hasValidChars;
  },

  /**
   * Validate person name length and format
   */
  isValidPersonName: (name: string): boolean => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed.length === 0) return true;

    // No numbers in person names
    if (/\d/.test(trimmed) || /[\u0966-\u096F]/.test(trimmed)) return false;

    // Reject repeated special characters (e.g. >>>, ...., ----)
    if (/([.,'’/&()\-#+:;>_=@!$%^*~`\\?{}\[\]|])\1{2,}/.test(trimmed)) return false;

    // Allow only letters, marks, spaces, and safe punctuation
    if (!/^[\u0900-\u097F\uA8E0-\uA8FF\u200C\u200Da-zA-Z\s.,'’/&()\-]+$/.test(trimmed)) return false;

    // Must have at least 2 letters
    const letters = trimmed.match(/[\u0900-\u097F\uA8E0-\uA8FFa-zA-Z]/g);
    if (!letters || letters.length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH) return false;

    return trimmed.length <= SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH;
  },

  /**
   * Validate society/building name length and format
   */
  isValidSocietyName: (name: string): boolean => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed.length === 0) return true;

    // Reject repeated special characters
    if (/([.,'’/&()\-#+:;>_=@!$%^*~`\\?{}\[\]|])\1{2,}/.test(trimmed)) return false;

    // Allow letters, numbers, spaces, and safe society punctuation (+ is allowed)
    if (!/^[\u0900-\u097F\uA8E0-\uA8FF\u200C\u200Da-zA-Z0-9\u0966-\u096F\s.,'’/&()\-+]+$/.test(trimmed)) return false;

    // Must have at least 2 letters
    const letters = trimmed.match(/[\u0900-\u097F\uA8E0-\uA8FFa-zA-Z]/g);
    if (!letters || letters.length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH) return false;

    return trimmed.length <= SOCIETY_VALIDATION_RULES.SOCIETY_NAME_MAX_LENGTH;
  },

  /**
   * Validate mobile number (10 digits starting with 6-9)
   */
  isValidMobile: (mobile: string): boolean => {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length === 0) return true;
    if (digits.length !== SOCIETY_VALIDATION_RULES.MOBILE_LENGTH || !/^[6-9]/.test(digits)) return false;
    if (/^(\d)\1{9}$/.test(digits)) return false;

    return !hasRepeatedSequence(digits, 5);
  },

  /**
   * Validate email format and length
   */
  isValidEmail: (email: string, isStrict = false): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return true;

    if (trimmedEmail.length > SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH) return false;
    if (/[^a-zA-Z0-9@._%+-]/.test(trimmedEmail)) return false;
    if (/\s/.test(trimmedEmail)) return false;

    if (/\.{2,}|_{2,}|-{2,}|\+{2,}/.test(trimmedEmail)) return false;
    if (/^[._%+-]/.test(trimmedEmail)) return false;
    if (/\.@|@\./.test(trimmedEmail)) return false;

    if ((trimmedEmail.match(/@/g) || []).length !== 1) return false;

    if (!trimmedEmail.includes('@')) return !isStrict;

    const atIndex = trimmedEmail.indexOf('@');
    const localPart = trimmedEmail.substring(0, atIndex);
    const domain = trimmedEmail.substring(atIndex + 1);

    if (!localPart || localPart.length > 64) return false;
    if (!domain || domain.length < 2 || domain.length > 255) return !isStrict;

    if (domain.includes('.')) {
      const domainParts = domain.split('.');
      if (domainParts.length < 2) return false;
      for (const part of domainParts) {
        if (!part || part.startsWith('-') || part.endsWith('-')) return false;
      }
      const tld = domainParts[domainParts.length - 1].toLowerCase();
      if (!tld || tld.length < 2 || tld.length > 12) return false;
      // Reject repeated characters in TLD (e.g. .commmmmm, .coooom, .iiinnn)
      if (/(.)\1{2,}/.test(tld)) return false;
      if (!VALID_TLD_REGEX.test(tld)) return false;
    } else {
      return !isStrict;
    }

    return EMAIL_REGEX.test(trimmedEmail);
  },

  /**
   * Validate society address format and length
   */
  isValidAddress: (address: string): boolean => {
    if (!address) return true;
    const trimmed = address.trim();
    if (trimmed.length === 0) return true;

    // Allow any sequence of hyphens like "-", "--", "---", etc.
    if (/^-+$/.test(trimmed)) return true;

    // Reject repeated special characters
    if (/([.,'’/&()\-#+:;>_=@!$%^*~`\\?{}\[\]|])\1{2,}/.test(trimmed)) return false;

    // Check if address only contains allowed characters
    if (!/^[\u0900-\u097F\uA8E0-\uA8FF\u200C\u200Da-zA-Z0-9\u0966-\u096F\s.,'’/&()\-#+:;]+$/.test(trimmed)) return false;

    // Check if address contains at least some valid letters or numbers
    const hasValidChars = /[\p{L}\p{N}]/u.test(trimmed);
    if (!hasValidChars) return false;

    return trimmed.length <= SOCIETY_VALIDATION_RULES.ADDRESS_MAX_LENGTH;
  },
} as const;
