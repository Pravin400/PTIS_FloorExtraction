export const PROPERTY_DESCRIPTION_MAX = 100;
export const DESCRIPTION_ENGLISH_MAX = 100;
export const TYPE_MAX = 10;
export const PROPERTY_TYPE_GROUP_MAX = 100;

// English Description: Only English characters (A-Za-z), numbers, single spaces, and basic punctuation (&, -, /, etc.)
export const DESCRIPTION_ENGLISH_REGEX = /^(?!.*?\s{2})[A-Za-z0-9][A-Za-z0-9\s\/,.\-()&]*$/;
export const DESCRIPTION_ENGLISH_SANITIZE = /[^A-Za-z0-9\s\/,.\-()&]/g;
