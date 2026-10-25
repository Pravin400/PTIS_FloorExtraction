/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user input and prevent XSS attacks.
 * Use these functions before setting any user input to state.
 */

/**
 * Sanitize text input by removing potentially dangerous characters
 * while preserving valid international characters
 * Blocks invalid special characters like *()_++_)(&&^%$#@!~!!@#$%}{};'.,, etc.
 * 
 * @param input - Raw user input string
 * @returns Sanitized string safe for display
 */
export const sanitizeTextInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Block invalid special characters - only allow letters, numbers, underscores, spaces, and basic punctuation
    .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u0900-\u097F\u0D00-\u0D7F\s.,\'\-\/()&]/g, '')
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Sanitize email input
 * 
 * @param email - Raw email input
 * @returns Sanitized email string
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>()[\]\\,;:\s@"]/g, match => {
      // Keep @ symbol, remove other dangerous chars
      return match === '@' ? match : '';
    });
};

/**
 * Sanitize numeric input
 * 
 * @param input - Raw numeric input
 * @returns String containing only digits
 */
export const sanitizeNumericInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input.replace(/\D/g, '');
};

/**
 * Escape HTML special characters
 * Use this when you need to display user input as-is
 * 
 * @param text - Text to escape
 * @returns HTML-safe string
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, char => map[char] || char);
};

/**
 * Translate Devanagari digits (०-९) to standard English digits (0-9)
 * 
 * @param input - Input string potentially containing Devanagari digits
 * @returns String with Devanagari digits translated to standard digits
 */
export const translateDevanagariDigits = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  const devanagari = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return input.replace(/[०-९]/g, d => devanagari.indexOf(d).toString());
};

/**
 * Validate and sanitize a name input
 * Allows letters, spaces, hyphens, apostrophes, dots, forward slash, and common punctuation
 * Blocks all invalid special characters like *()_++_)(&&^%$#@!~!!@#$%}{};',, etc.
 * 
 * @param name - Raw name input
 * @returns Sanitized name with only valid characters
 */
export const sanitizeName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';

  return name
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Block all invalid special characters - only allow letters, spaces, and . , ' - /
    // Supports international characters (Unicode letters)
    .replace(/[^a-zA-Z\u00C0-\u024F\u0900-\u097F\u0D00-\u0D7F\s.,'\/\-]/g, '');
  // Note: Removed .trim() to allow trailing spaces during typing
  // Validation should handle trimming when checking if the field is valid
};

/**
 * Sanitize shop name input
 * Allows letters, numbers, spaces, and basic punctuation safe for shop names (.,'-/()&)
 * 
 * @param name - Raw shop name input
 * @returns Sanitized shop name
 */
export const sanitizeShopName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';

  return name
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Block all invalid special characters - allow letters, numbers, spaces, and basic shop punctuation (.,'-/()&)
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u0900-\u097F\u0D00-\u0D7F\s.,'\/\-()&]/g, '');
};

/**
 * Capitalize the first letter of each word in a string
 * Supports Unicode/international word boundaries
 * 
 * @param str - Input string
 * @returns String with first letter of each word capitalized
 */
export const capitalizeEachWordKycSociety = (str: string, forceAll = false): string => {
  if (!str) return '';
  const words = str.split(' ');
  return words
    .map((word, index) => {
      if (!word) return '';
      // Skip capitalization for words containing Devanagari (Marathi/Hindi) characters
      if (/[\u0900-\u097F\u0D00-\u0D7F]/.test(word)) {
        return word;
      }
      // If forceAll is false, only capitalize completed words (not the one actively being typed at the end)
      if (!forceAll && index === words.length - 1) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};


/*
 * @param str - Input string
 * @returns String with first letter of each word capitalized
 */
export const capitalizeEachWord = (str: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Sanitize address input
 * More permissive than name sanitization but still blocks invalid special characters
 * Allows letters, numbers, multiple spaces, and common address punctuation (.,/-#&,)
 * Blocks: *()_++_)(&&^%$@!~!!@#$%}{};', etc.
 * Also blocks consecutive special characters and address with only special characters
 * Preserves multiple consecutive spaces to allow formatting like "SANGHAVI HILLS .D MART  ANAND"
 * 
 * @param address - Raw address input
 * @returns Sanitized address
 */
export const sanitizeAddress = (address: string): string => {
  if (!address || typeof address !== 'string') return '';

  const sanitized = address
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Block invalid special characters - allow letters, numbers, spaces, and address-safe punctuation including &
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u0900-\u097F\u0D00-\u0D7F\s.,\-\/\#&]/g, '')
    // Remove multiple consecutive special characters (e.g., ----, ////)
    .replace(/([.,\-\/\#&])\1+/g, '$1');
  // Note: Removed .replace(/\s+/g, ' ') to allow multiple consecutive spaces
  // Note: Removed .trim() to allow leading/trailing spaces during typing

  // If result contains only special characters and no alphanumeric, return empty
  if (sanitized && !/[a-zA-Z0-9\u00C0-\u024F\u0900-\u097F\u0D00-\u0D7F]/.test(sanitized)) {
    return '';
  }

  return sanitized;
};

/**
 * Sanitize flat/shop number input
 * Allows alphanumeric, hyphen, and forward slash only
 * Blocks consecutive special characters like ----- or /////
 * 
 * @param input - Raw flat/shop number input
 * @returns Sanitized flat/shop number
 */

export const sanitizeFlatShopNo = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Allow only alphanumeric (including Devanagari), hyphen, and forward slash
    .replace(/[^a-zA-Z0-9\u0900-\u097F/-]/g, '')
    // Block consecutive same special characters
    .replace(/([-/])\1+/g, '$1')
    // Remove leading special characters only so user can type trailing ones
    .replace(/^[-/]+/g, '')
    .trim();
};

/**
 * Sanitize plot number input
 * Allows alphanumeric, spaces, hyphen, and forward slash
 * Blocks special characters like: !!@@##$$%%^^&&**(())__++{{}}||\"::\"??>><< 
 * 
 * @param input - Raw plot number input
 * @returns Sanitized plot number
 */
export const sanitizePlotNo = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Allow only alphanumeric, spaces, hyphen, and forward slash (including Devanagari range)
    .replace(/[^a-zA-Z0-9\u0900-\u097F\s\-\/]/g, '')
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    // Block consecutive same special characters
    .replace(/([\-\/])\1+/g, '$1');
};

/**
 * Sanitize survey number input
 * Allows alphanumeric, hyphen, and forward slash
 * 
 * @param input - Raw survey number input
 * @returns Sanitized survey number
 */
export const sanitizeSurveyNo = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Allow only alphanumeric (including Devanagari), hyphen, and forward slash
    .replace(/[^a-zA-Z0-9\u0900-\u097F/-]/g, '')
    // Block consecutive same special characters
    .replace(/([-/])\1+/g, '$1')
    // Remove leading special characters only so user can type trailing ones
    .replace(/^[-/]+/g, '')
    .trim();
};

/**
 * Sanitize sub zone number input
 * Allows alphanumeric, hyphen, and forward slash
 * 
 * @param input - Raw sub zone number input
 * @returns Sanitized sub zone number
 */
export const sanitizeSubZoneNo = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Allow only alphanumeric (including Devanagari), hyphen, and forward slash
    .replace(/[^a-zA-Z0-9\u0900-\u097F/-]/g, '')
    // Block consecutive same special characters
    .replace(/([-/])\1+/g, '$1')
    // Remove leading special characters only so user can type trailing ones
    .replace(/^[-/]+/g, '')
    .trim();
};

/**
 * Sanitize positive number input
 * Removes negative signs, allows only digits and decimal point
 * 
 * @param input - Raw number input
 * @returns Sanitized positive number string
 */
export const sanitizePositiveNumber = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Remove negative signs and allow only digits (English & Devanagari) and one decimal point
  let sanitized = input.replace(/[^0-9०-९.]/g, '');

  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  return sanitized;
};

/**
 * Sanitize plot area input
 * Allows max 15 digits total with up to 4 decimal places
 * 
 * @param input - Raw plot area input
 * @returns Sanitized plot area string
 */
export const sanitizePlotArea = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Remove negative signs and allow only digits (English & Devanagari) and one decimal point
  let sanitized = input.replace(/[^0-9०-९.]/g, '');

  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit to 4 decimal places
  if (parts.length === 2 && parts[1].length > 4) {
    sanitized = parts[0] + '.' + parts[1].substring(0, 4);
  }

  // Limit total digits to 15 (excluding decimal point)
  const [intPart, decPart] = sanitized.split('.');
  const totalDigits = (intPart || '').length + (decPart || '').length;

  if (totalDigits > 15) {
    // Truncate from the integer part if needed
    const maxIntDigits = 15 - (decPart || '').length;
    if (maxIntDigits > 0) {
      sanitized = intPart.substring(0, maxIntDigits) + (decPart ? '.' + decPart : '');
    } else {
      sanitized = intPart.substring(0, 15);
    }
  }

  return sanitized;
};

/**
 * Sanitize property number or partition number input
 * Allows alphanumeric characters, spaces, hyphens, and forward slashes
 * Examples: "RR / 44", "44 - 55", "44 / GG"
 * 
 * @param input - Raw property/partition number input
 * @returns Sanitized property/partition number
 */
export const sanitizePropertyPartitionNo = (input: string): string => {
  if (!input || typeof input !== "string") return "";

  return input
    // Allow only alphanumeric, spaces, hyphens, and forward slashes (including Devanagari range)
    .replace(/[^a-zA-Z0-9\u0900-\u097F\s\-\/]/g, "")
    // Remove multiple consecutive spaces
    .replace(/\s+/g, " ")
    // Remove consecutive special characters like --- or ///
    .replace(/([\-\/])\1+/g, "$1");
};

/**
 * Sanitize zone name input
 * Allows alphanumeric characters, spaces, hyphens, and forward slashes only
 * Blocks special characters like: !!@@##$$%%^^&&**(())__++{{}}||"::"??>><< 
 * 
 * @param input - Raw zone name input
 * @returns Sanitized zone name
 */
export const sanitizeZoneName = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Allow only alphanumeric, spaces, hyphens, and forward slashes (including Devanagari range)
    .replace(/[^a-zA-Z0-9\u0900-\u097F\s\-\/]/g, '')
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    // Remove consecutive special characters
    .replace(/([\-\/])\1+/g, '$1');
};

/**
 * Sanitize ward number input
 * Allows alphanumeric characters, spaces, hyphens, and forward slashes only
 * Blocks special characters like: !!@@##$$%%^^&&**(())__++{{}}||"::"??>><< 
 * 
 * @param input - Raw ward number input
 * @returns Sanitized ward number
 */
export const sanitizeWardNo = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Allow only alphanumeric, spaces, hyphens, and forward slashes (including Devanagari range)
    .replace(/[^a-zA-Z0-9\u0900-\u097F\s\-\/]/g, '')
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    // Remove consecutive special characters
    .replace(/([\-\/])\1+/g, '$1');
};

/**
 * Sanitize e-governance number input
 * Allows alphanumeric characters, spaces, hyphens, and forward slashes only
 * Blocks special characters like: !!@@##$$%%^^&&**(())__++{{}}||"::"??>><< 
 * 
 * @param input - Raw e-governance number input
 * @returns Sanitized e-governance number
 */
export const sanitizeEgovNo = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Allow only alphanumeric, spaces, hyphens, and forward slashes (including Devanagari range)
    .replace(/[^a-zA-Z0-9\u0900-\u097F\s\-\/]/g, '')
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    // Remove consecutive special characters
    .replace(/([\-\/])\1+/g, '$1');
};

/**
 * Sanitize positive integer input
 * Allows only digits, no negative values or decimals
 * 
 * @param input - Raw integer input
 * @returns Sanitized positive integer string
 */
export const sanitizePositiveInteger = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  // Allow only English and Devanagari digits
  return input.replace(/[^0-9०-९]/g, '');
};

/**
 * Sanitize tax zone number input
 * Allows alphanumeric, hyphen, and forward slash only
 * Blocks consecutive special characters like ----- or /////
 * 
 * @param input - Raw tax zone number input
 * @returns Sanitized tax zone number
 */
export const sanitizeTaxZoneNo = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  const sanitized = input
    // Allow only alphanumeric, hyphen, and forward slash
    .replace(/[^a-zA-Z0-9\-/]/g, '')
    // Block consecutive special characters
    .replace(/([-/])\1+/g, '$1')
    // Remove leading/trailing special characters
    .replace(/^[-/]+|[-/]+$/g, '')
    .trim();

  // If only special characters, return empty
  if (sanitized && !/[a-zA-Z0-9]/.test(sanitized)) {
    return '';
  }

  return sanitized;
};

/**
 * Enhanced email sanitization with stricter rules
 * Only allows: letters (a-z), numbers (0-9), periods (.), and @ symbol
 * Blocks all other characters including underscores, hyphens, plus signs, etc.
 * Allows user to type periods freely - validation will catch invalid patterns like .......
 * 
 * @param email - Raw email input
 * @returns Sanitized email string
 */
export const sanitizeEmailStrict = (email: string): string => {
  if (!email || typeof email !== 'string') return '';

  let sanitized = email
    .toLowerCase()
    .trim()
    // Only keep letters, numbers, @ and period - remove everything else
    // This allows valid email characters while blocking ###, _++, ()()-----, etc.
    .replace(/[^a-z0-9@.]/g, '');

  // DO NOT modify consecutive periods - let user type freely
  // Validation will catch patterns like pra.jed.......e@gmail.com as invalid

  // Block leading period only
  sanitized = sanitized.replace(/^\./, '');

  // Ensure only one @ symbol - if multiple, keep only first occurrence
  const atIndex = sanitized.indexOf('@');
  if (atIndex !== -1) {
    const beforeAt = sanitized.substring(0, atIndex + 1);
    const afterAt = sanitized.substring(atIndex + 1).replace(/@/g, '');
    sanitized = beforeAt + afterAt;
  }

  // If result is only special characters (no alphanumeric), return empty
  if (sanitized && !/[a-z0-9]/.test(sanitized)) {
    return '';
  }

  return sanitized;
};

/**
 * Sanitize wing name input
 * Allows alphanumeric characters, spaces, and basic punctuation for wing/building names
 * Supports international characters (Devanagari, Malayalam, etc.)
 * Blocks dangerous characters and XSS attempts while preserving spaces and structure
 * Examples: "Wing A", "Tower B", "Building 1", "Wing A-1", "Tower (North)"
 * 
 * @param input - Raw wing name input
 * @returns Sanitized wing name
 */
export const sanitizeWingName = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Allow letters, numbers, spaces, and basic punctuation (.,'-/()&)
    // Supports international characters (Unicode: Latin Extended, Devanagari, Malayalam)
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u0900-\u097F\u0D00-\u0D7F\s.,\'\-\/()&]/g, '');
  // Note: No trim() or space reduction to allow natural typing with spaces
};
