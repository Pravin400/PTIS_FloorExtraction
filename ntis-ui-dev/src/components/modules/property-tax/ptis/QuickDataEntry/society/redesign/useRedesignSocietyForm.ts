'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type {
  PropertyMasterData,
  ApartmentQcWingDto,
} from '@/types/property-tax/apartment';
import type { PropertySocietyDetailsApiItem } from '@/types/property-society-details.types';
import type { ApartmentEditFormData, SectionWingScope } from './types';
import type { FieldDiffItem } from './ApartmentEditConfirmModal';
import { updateApartmentQcTopSectionAction } from '@/lib/api/ptis/apartment/apartment-qc-top-section.actions';
import type { UpdateApartmentQcTopSectionPayload } from '@/lib/api/ptis/apartment/apartment-qc-top-section.service';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

interface UseApartmentEditDrawerProps {
  open: boolean;
  propertyId?: number;
  propertyMasterData?: PropertyMasterData;
  societyData?: PropertySocietyDetailsApiItem | null;
  locale?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const FIELD_LABELS: Record<keyof ApartmentEditFormData, string> = {
  id: 'ID',
  propertyId: 'Property ID',
  societyDetailId: 'Society Detail ID',
  moujaId: 'Mouja ID',
  taxZoneId: 'Tax Zone ID',
  categoryId: 'Category ID',
  propertyTypeId: 'Property Type ID',
  ownerTypeId: 'Owner Type ID',
  propertyNo: 'Property No.',
  upic: 'UPIC ID',
  societyName: 'Society Name (Regional)',
  societyNameEnglish: 'Society Name',
  propertyDescription: 'Property Description',
  division: 'Division',
  wardNo: 'Ward No.',
  category: 'Category',
  taxZoneAndName: 'Tax Zone & Name',
  subZoneCsnNo: 'Sub Zone & CSN',
  plotNo: 'Plot No.',
  surveyNo: 'Survey No.',
  pinCode: 'Pin Code',
  aadharNo: 'Aadhar No.',
  landOwnerName: 'Land Owner Name (Regional)',
  landOwnerNameEnglish: 'Land Owner Name',
  occupierName: 'Occupier Name',
  occupierNameEnglish: 'Occupier Name English',
  builderName: 'Builder Name (Regional)',
  builderNameEnglish: 'Builder Name',
  builderMobileNo: 'Builder Mobile No.',
  mobileNo: 'Mobile No.',
  alternateMobileNo: 'Alternate Mobile No.',
  societyEmail: 'Society Email',
  societyAddress: 'Society Address (Regional)',
  societyAddressEnglish: 'Society Address',
  managerName: 'Manager Name (Regional)',
  managerNameEnglish: 'Manager Name',
  managerMobileNo: 'Manager Mobile No.',
  managerEmail: 'Manager Email Id',
  secretaryName: 'Secretary Name (Regional)',
  secretaryNameEnglish: 'Secretary Name',
  secretaryMobileNo: 'Secretary Mobile No.',
  secretaryEmail: 'Secretary Email Id',
};

const resolvePositiveId = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseInt(String(val), 10);
  return !isNaN(num) && num > 0 && num !== 2147483647 ? num : null;
};

const computeInitialWingScope = (
  wings: ApartmentQcWingDto[],
  targetIds?: number[] | null
): SectionWingScope => {
  const allIds = wings
    .map((w) => w.wingDetailId)
    .filter(
      (id): id is number => typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647
    );

  if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
    return {
      applyToAll: true,
      selectedWingIds: allIds,
    };
  }

  const validTargetIds = targetIds.filter(
    (id) =>
      typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647 && allIds.includes(id)
  );

  // If targetIds includes all available wings, treat as applyToAll
  if (allIds.length > 0 && validTargetIds.length === allIds.length) {
    return {
      applyToAll: true,
      selectedWingIds: allIds,
    };
  }

  return {
    applyToAll: false,
    selectedWingIds: validTargetIds,
  };
};

const getInitialFormState = (
  data?: PropertyMasterData,
  societyData?: PropertySocietyDetailsApiItem | null
): ApartmentEditFormData => {
  const cleanMobile = (val?: string | null) => {
    if (!val || val === '-') return '';
    const digits = val.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const cleanText = (val?: string | null) => {
    if (!val || val === '-') return '';
    return val;
  };

  const isAsciiText = (val?: string | null) => {
    if (!val || val === '-') return false;
    return !/[^\x00-\x7F]/.test(val);
  };

  const initialLandOwner =
    cleanText(societyData?.landOwnerName) ||
    cleanText(data?.landOwnerName) ||
    cleanText(data?.ownerName) ||
    cleanText(data?.owner);

  const initialBuilder =
    cleanText(societyData?.builderName) ||
    cleanText(data?.builderName) ||
    cleanText(data?.occupierName);

  const initialAddress =
    cleanText(societyData?.societyAddress) ||
    cleanText(data?.societyAddress) ||
    cleanText(data?.address);

  const initialSocietyName =
    cleanText(societyData?.societyName) ||
    cleanText(data?.societyName);

  const initialLandOwnerEng =
    cleanText(societyData?.landOwnerNameEnglish) ||
    cleanText(data?.landOwnerNameEnglish) ||
    cleanText(data?.ownerNameEnglish) ||
    (isAsciiText(initialLandOwner) ? initialLandOwner : '');

  const initialBuilderEng =
    cleanText(societyData?.builderNameEnglish) ||
    cleanText(data?.builderNameEnglish) ||
    cleanText(data?.occupierNameEnglish) ||
    (isAsciiText(initialBuilder) ? initialBuilder : '');

  const initialSocietyNameEng =
    cleanText(societyData?.societyNameEnglish) ||
    cleanText(data?.societyNameEnglish) ||
    (isAsciiText(initialSocietyName) ? initialSocietyName : '');

  const initialAddressEng =
    cleanText(societyData?.societyAddressEnglish) ||
    cleanText(data?.societyAddressEnglish) ||
    (isAsciiText(initialAddress) ? initialAddress : '');

  const initialManagerName =
    cleanText(societyData?.managerName) ||
    cleanText(data?.managerName);

  const initialManagerNameEng =
    cleanText(societyData?.managerNameEnglish) ||
    cleanText(data?.managerNameEnglish) ||
    (isAsciiText(initialManagerName) ? initialManagerName : '');

  const initialSecretaryName =
    cleanText(societyData?.secretaryName) ||
    cleanText(data?.secretaryName);

  const initialSecretaryNameEng =
    cleanText(societyData?.secretaryNameEnglish) ||
    cleanText(data?.secretaryNameEnglish) ||
    (isAsciiText(initialSecretaryName) ? initialSecretaryName : '');

  return {
    id: data?.propertyId ?? societyData?.propertyId ?? null,
    propertyId: data?.propertyId ?? societyData?.propertyId ?? null,
    societyDetailId: societyData?.societyDetailId ?? null,
    moujaId: resolvePositiveId(data?.moujaId),
    taxZoneId: resolvePositiveId(data?.taxZoneId),
    categoryId: resolvePositiveId(data?.categoryId),
    propertyTypeId: resolvePositiveId(data?.propertyTypeId),
    ownerTypeId: resolvePositiveId(data?.ownerTypeId),
    propertyNo: cleanText(data?.propertyNo),
    upic: cleanText(data?.upic),
    societyName: initialSocietyName,
    societyNameEnglish: initialSocietyNameEng,
    propertyDescription: cleanText(data?.propertyDescriptionRegional) || 'निवासी',
    division: cleanText(data?.division),
    wardNo: cleanText(data?.wardNo),
    category: cleanText(data?.category) || 'Apartment',
    taxZoneAndName: cleanText(data?.taxZoneAndName) || cleanText(data?.taxZone),
    subZoneCsnNo: cleanText(data?.subZoneCsnNo),
    plotNo: cleanText(data?.plotNo),
    surveyNo:
      cleanText(data?.surveyNo) ||
      (data?.subZoneCsnNo ? data.subZoneCsnNo.replace(/^CSN\s*-\s*/i, '').trim() : ''),
    pinCode: cleanText(data?.pinCode) || cleanText(data?.pincode),
    aadharNo: cleanText(data?.aadharNo),
    societyAddress: initialAddress,
    societyAddressEnglish: initialAddressEng,
    landOwnerName: initialLandOwner,
    landOwnerNameEnglish: initialLandOwnerEng,
    occupierName: initialBuilder,
    occupierNameEnglish: initialBuilderEng,
    builderName: initialBuilder,
    builderNameEnglish: initialBuilderEng,
    builderMobileNo: cleanMobile(data?.builderMobileNo),
    mobileNo: cleanMobile(data?.mobileNo) || cleanMobile(data?.builderMobileNo),
    alternateMobileNo: cleanMobile(data?.altMobileNo) || cleanMobile(data?.alternateMobileNo),
    societyEmail: cleanText(societyData?.societyEmailId) || cleanText(data?.societyEmail) || cleanText(data?.emailId),
    managerName: initialManagerName,
    managerNameEnglish: initialManagerNameEng,
    managerMobileNo: cleanMobile(societyData?.managerMobileNo) || cleanMobile(data?.managerMobileNo),
    managerEmail: cleanText(societyData?.managerEmailId) || cleanText(data?.managerEmail),
    secretaryName: initialSecretaryName,
    secretaryNameEnglish: initialSecretaryNameEng,
    secretaryMobileNo: cleanMobile(societyData?.secretaryMobileNo) || cleanMobile(data?.secretaryMobileNo),
    secretaryEmail: cleanText(societyData?.secretaryEmailId) || cleanText(data?.secretaryEmail),
  };
};

// Common Validation Rules & Limits
export const VALIDATION_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  ADDRESS_MIN: 3,
  ADDRESS_MAX: 250,
  EMAIL_MAX: 100,
  MOBILE_EXACT: 10,
  AADHAAR_EXACT: 12,
  PINCODE_EXACT: 6,
} as const;

export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

// Regional (Devanagari, Marathi, Hindi, multilingual) Person Name Pattern
// Allows Devanagari letters/marks (\u0900-\u097F\uA8E0-\uA8FF\u200C\u200D), English letters, spaces, dots, commas, apostrophes, hyphens, slashes, ampersands, parentheses.
// Disallows symbols like >, <, !, @, #, $, %, ^, *, +, =, ~, `, |, \, ?, {, }, [, ], ;, :, ", _, and numbers.
export const REGIONAL_PERSON_NAME_PATTERN = /^[\u0900-\u097F\uA8E0-\uA8FF\u200C\u200Da-zA-Z\s.,'’/&()\-]+$/;

// English Person Name Pattern: English letters, spaces, dots, commas, apostrophes, hyphens, slashes, ampersands, parentheses.
// Disallows numbers and special symbols like >, <, !, @, #, $, %, etc.
export const ENGLISH_PERSON_NAME_PATTERN = /^[a-zA-Z\s.,'’/&()\-]+$/;

// Regional Society Name Pattern: Devanagari, English letters, numbers (0-9, \u0966-\u096F), spaces, dots, commas, apostrophes, hyphens, slashes, ampersands, parentheses, plus (+)
export const REGIONAL_SOCIETY_NAME_PATTERN = /^[\u0900-\u097F\uA8E0-\uA8FF\u200C\u200Da-zA-Z0-9\u0966-\u096F\s.,'’/&()\-+]+$/;

// English Society Name Pattern: English letters, numbers (0-9), spaces, dots, commas, apostrophes, hyphens, slashes, ampersands, parentheses, plus (+)
export const ENGLISH_SOCIETY_NAME_PATTERN = /^[a-zA-Z0-9\s.,'’/&()\-+]+$/;

// Regional Address Pattern: Devanagari, English letters, numbers (0-9, \u0966-\u096F), spaces, and address punctuation (.,'’/&()\-#+:;)
export const REGIONAL_ADDRESS_PATTERN = /^[\u0900-\u097F\uA8E0-\uA8FF\u200C\u200Da-zA-Z0-9\u0966-\u096F\s.,'’/&()\-#+:;]+$/;

// English Address Pattern: English letters, numbers (0-9), spaces, and address punctuation (.,'’/&()\-#+:;)
export const ENGLISH_ADDRESS_PATTERN = /^[a-zA-Z0-9\s.,'’/&()\-#+:;]+$/;

// Pattern to detect repeated consecutive punctuation (3 or more identical characters like >>> , .... , ---- , //// , ++++)
export const REPEATED_SPECIAL_CHARS_PATTERN = /([.,'’/&()\-#+:;>_=@!$%^*~`\\?{}\[\]|])\1{2,}/;

// Check if string contains at least one letter (Devanagari or English)
export const HAS_LETTER_PATTERN = /[\u0900-\u097F\uA8E0-\uA8FFa-zA-Z]/;
// Check if string contains at least 2 letters
export const HAS_AT_LEAST_TWO_LETTERS_PATTERN = /(?:[\u0900-\u097F\uA8E0-\uA8FFa-zA-Z].*){2,}/;

// Check if string contains at least one English letter
export const HAS_ENGLISH_LETTER_PATTERN = /[a-zA-Z]/;
// Check if string contains at least 2 English letters
export const HAS_AT_LEAST_TWO_ENGLISH_LETTERS_PATTERN = /(?:[a-zA-Z].*){2,}/;

/** Legacy patterns kept for backward compatibility */
export const ENGLISH_TEXT_PATTERN = ENGLISH_SOCIETY_NAME_PATTERN;
export const ENGLISH_NAME_PATTERN = ENGLISH_PERSON_NAME_PATTERN;
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu|gov|mil|info|biz|me|io|nic|ai|app|dev|tech|online|store|site|live|pro|xyz|club|agency|digital|solutions|company|email|cloud|finance|global|group|services|systems|world|today|news|media|care|center)(?:\.[a-zA-Z]{2})?$/i;

/** Check for repeated digits like 000000, 999999 */
const hasRepeatedDigits = (digits: string, minRepeat: number = 5): boolean => {
  if (!digits || digits.length < minRepeat) return false;
  for (let i = 0; i <= digits.length - minRepeat; i++) {
    const char = digits[i];
    let count = 1;
    for (let j = i + 1; j < digits.length && digits[j] === char; j++) {
      count++;
      if (count >= minRepeat) return true;
    }
  }
  return false;
};

/** Deep email address validation */
export const validateEmailAddress = (email: string): string | null => {
  if (!email) return null;
  const strVal = email.trim();
  if (!strVal) return null;

  if (strVal.length > VALIDATION_LIMITS.EMAIL_MAX) {
    return `Email cannot exceed ${VALIDATION_LIMITS.EMAIL_MAX} characters.`;
  }

  // Reject spaces or invalid characters
  if (/\s/.test(strVal) || /[^a-zA-Z0-9@._%+-]/.test(strVal)) {
    return 'Enter a valid email address (e.g. name@example.com).';
  }

  // Exactly one '@' symbol
  const atCount = (strVal.match(/@/g) || []).length;
  if (atCount !== 1) {
    return 'Enter a valid email address with a single @ symbol.';
  }

  const [localPart, domainPart] = strVal.split('@');

  // Local part validations
  if (!localPart || localPart.length > 64) {
    return 'Enter a valid email username before @.';
  }
  if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
    return 'Email username contains invalid characters.';
  }
  if (/^[._%+-]|[._%+-]$/.test(localPart)) {
    return 'Email username cannot start or end with a dot or symbol.';
  }
  if (/\.{2,}|_{2,}|-{2,}|\+{2,}/.test(localPart)) {
    return 'Email username cannot contain consecutive dots or symbols.';
  }

  // Domain part validations
  if (!domainPart || domainPart.length > 255) {
    return 'Enter a valid email domain.';
  }
  if (/^[.-]|[.-]$/.test(domainPart)) {
    return 'Email domain cannot start or end with a dot or hyphen.';
  }
  if (/\.{2,}/.test(domainPart)) {
    return 'Email domain cannot contain consecutive dots.';
  }

  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) {
    return 'Email domain must have a valid extension (e.g. .com, .in).';
  }

  for (const label of domainLabels) {
    if (!label) {
      return 'Email domain structure is invalid.';
    }
    if (!/^[a-zA-Z0-9-]+$/.test(label)) {
      return 'Email domain contains invalid characters.';
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return 'Email domain labels cannot start or end with a hyphen.';
    }
  }

  // Top-Level Domain (TLD) validation
  const tld = domainLabels[domainLabels.length - 1].toLowerCase();
  if (!/^[a-zA-Z]{2,12}$/.test(tld)) {
    return 'Email domain extension must be valid (e.g. .com, .in).';
  }

  // Reject repeated letters in TLD (e.g., .commmmmm, .coooom, .iiinnn, .connnnn)
  if (/(.)\1{2,}/.test(tld)) {
    return 'Enter a valid domain extension without repeated characters (e.g. .com, .in).';
  }

  // Provider-specific domain checks (e.g. @gmail.com, @yahoo.com)
  const provider = domainLabels[domainLabels.length - 2]?.toLowerCase();
  const knownProviders: Record<string, string[]> = {
    gmail: ['com', 'in', 'co.in'],
    yahoo: ['com', 'in', 'co.in', 'co.uk', 'ca', 'fr'],
    hotmail: ['com', 'co.in', 'co.uk'],
    outlook: ['com', 'in', 'co.in'],
    rediffmail: ['com'],
    icloud: ['com'],
    protonmail: ['com', 'me', 'ch'],
    zoho: ['com', 'in'],
  };

  if (provider && knownProviders[provider]) {
    const validTlds = knownProviders[provider];
    const fullTld =
      domainLabels.length > 2 && domainLabels[domainLabels.length - 2] === 'co'
        ? `co.${tld}`
        : tld;
    if (!validTlds.includes(tld) && !validTlds.includes(fullTld)) {
      return `Please enter a valid ${provider} email address (e.g. name@${provider}.com).`;
    }
  }

  return null;
};

/** Validate a single field and return an error message or null */
export const validateSingleField = (
  field: keyof ApartmentEditFormData,
  value: unknown,
  _formData?: ApartmentEditFormData
): string | null => {
  const strVal = typeof value === 'string' ? value.trim() : '';

  switch (field) {
    case 'societyName': {
      if (!strVal) return 'Society Name (Regional) is required.';
      if (strVal.length < VALIDATION_LIMITS.NAME_MIN) {
        return `Society Name (Regional) must be at least ${VALIDATION_LIMITS.NAME_MIN} characters.`;
      }
      if (strVal.length > VALIDATION_LIMITS.NAME_MAX) {
        return `Society Name (Regional) cannot exceed ${VALIDATION_LIMITS.NAME_MAX} characters.`;
      }
      if (REPEATED_SPECIAL_CHARS_PATTERN.test(strVal)) {
        return 'Repeated special characters are not allowed.';
      }
      if (!REGIONAL_SOCIETY_NAME_PATTERN.test(strVal)) {
        return 'Please enter a valid regional society name without special symbols.';
      }
      if (!HAS_AT_LEAST_TWO_LETTERS_PATTERN.test(strVal)) {
        return 'Society Name (Regional) must contain letters, not only numbers or symbols.';
      }
      return null;
    }

    case 'societyNameEnglish': {
      if (!strVal) return null;
      if (strVal.length > VALIDATION_LIMITS.NAME_MAX) {
        return `Society Name cannot exceed ${VALIDATION_LIMITS.NAME_MAX} characters.`;
      }
      if (REPEATED_SPECIAL_CHARS_PATTERN.test(strVal)) {
        return 'Repeated special characters are not allowed.';
      }
      if (!ENGLISH_SOCIETY_NAME_PATTERN.test(strVal)) {
        return 'Please use English letters, numbers and basic punctuation only.';
      }
      if (!HAS_AT_LEAST_TWO_ENGLISH_LETTERS_PATTERN.test(strVal)) {
        return 'Society Name must contain English letters, not only numbers or symbols.';
      }
      return null;
    }

    case 'landOwnerName':
    case 'builderName':
    case 'managerName':
    case 'secretaryName': {
      if (!strVal) return null;
      if (strVal.length > VALIDATION_LIMITS.NAME_MAX) {
        return `Name cannot exceed ${VALIDATION_LIMITS.NAME_MAX} characters.`;
      }
      if (REPEATED_SPECIAL_CHARS_PATTERN.test(strVal)) {
        return 'Repeated special characters are not allowed.';
      }
      if (/\d/.test(strVal) || /[\u0966-\u096F]/.test(strVal)) {
        return 'Person names cannot contain numbers.';
      }
      if (!REGIONAL_PERSON_NAME_PATTERN.test(strVal)) {
        return 'Please use letters, spaces, dots and hyphens only without special symbols.';
      }
      if (!HAS_AT_LEAST_TWO_LETTERS_PATTERN.test(strVal)) {
        return 'Please enter a valid name with at least 2 letters.';
      }
      return null;
    }

    case 'landOwnerNameEnglish':
    case 'builderNameEnglish':
    case 'managerNameEnglish':
    case 'secretaryNameEnglish': {
      if (!strVal) return null;
      if (strVal.length > VALIDATION_LIMITS.NAME_MAX) {
        return `Name cannot exceed ${VALIDATION_LIMITS.NAME_MAX} characters.`;
      }
      if (REPEATED_SPECIAL_CHARS_PATTERN.test(strVal)) {
        return 'Repeated special characters are not allowed.';
      }
      if (/\d/.test(strVal)) {
        return 'Person names cannot contain numbers.';
      }
      if (!ENGLISH_PERSON_NAME_PATTERN.test(strVal)) {
        return 'Please use English letters, spaces, dots and hyphens only.';
      }
      if (!HAS_AT_LEAST_TWO_ENGLISH_LETTERS_PATTERN.test(strVal)) {
        return 'Please enter a valid English name with at least 2 letters.';
      }
      return null;
    }

    case 'secretaryMobileNo':
    case 'managerMobileNo':
    case 'builderMobileNo':
    case 'mobileNo':
    case 'alternateMobileNo': {
      if (!strVal) return null;
      const digits = strVal.replace(/\D/g, '');
      if (digits.length === 0) return null;
      if (digits.length !== VALIDATION_LIMITS.MOBILE_EXACT) {
        return 'Mobile number must be exactly 10 digits.';
      }
      if (!INDIAN_MOBILE_PATTERN.test(digits)) {
        return 'Mobile number must start with 6, 7, 8, or 9.';
      }
      if (hasRepeatedDigits(digits, 5) || /^(\d)\1{9}$/.test(digits)) {
        return 'Please enter a valid mobile number.';
      }
      return null;
    }

    case 'societyEmail':
    case 'managerEmail':
    case 'secretaryEmail': {
      return validateEmailAddress(strVal);
    }

    case 'societyAddress': {
      if (!strVal) return null;
      if (strVal.length > VALIDATION_LIMITS.ADDRESS_MAX) {
        return `Address cannot exceed ${VALIDATION_LIMITS.ADDRESS_MAX} characters.`;
      }
      if (REPEATED_SPECIAL_CHARS_PATTERN.test(strVal)) {
        return 'Repeated special characters are not allowed in address.';
      }
      if (!REGIONAL_ADDRESS_PATTERN.test(strVal)) {
        return 'Please enter a valid address without invalid special symbols.';
      }
      if (!HAS_LETTER_PATTERN.test(strVal) && !/\d/.test(strVal) && !/[\u0966-\u096F]/.test(strVal)) {
        return 'Address must contain letters or numbers.';
      }
      return null;
    }

    case 'societyAddressEnglish': {
      if (!strVal) return null;
      if (strVal.length > VALIDATION_LIMITS.ADDRESS_MAX) {
        return `Address cannot exceed ${VALIDATION_LIMITS.ADDRESS_MAX} characters.`;
      }
      if (REPEATED_SPECIAL_CHARS_PATTERN.test(strVal)) {
        return 'Repeated special characters are not allowed in address.';
      }
      if (!ENGLISH_ADDRESS_PATTERN.test(strVal)) {
        return 'Please use English letters, numbers and basic address punctuation only.';
      }
      if (!HAS_ENGLISH_LETTER_PATTERN.test(strVal) && !/\d/.test(strVal)) {
        return 'Address must contain English letters or numbers.';
      }
      return null;
    }

    case 'pinCode': {
      if (!strVal) return null;
      const digits = strVal.replace(/\D/g, '');
      if (digits.length !== VALIDATION_LIMITS.PINCODE_EXACT || !/^[1-9]\d{5}$/.test(digits)) {
        return 'PIN Code must be a 6-digit number starting with 1-9.';
      }
      if (/^(\d)\1{5}$/.test(digits)) {
        return 'PIN Code cannot consist of all identical digits.';
      }
      return null;
    }

    case 'aadharNo': {
      if (!strVal) return null;
      const digits = strVal.replace(/\D/g, '');
      if (digits.length !== VALIDATION_LIMITS.AADHAAR_EXACT || !/^[2-9]\d{11}$/.test(digits)) {
        return 'Aadhaar number must be 12 digits and cannot start with 0 or 1.';
      }
      if (/^(\d)\1{11}$/.test(digits)) {
        return 'Aadhaar number cannot consist of all identical digits.';
      }
      return null;
    }

    default:
      return null;
  }
};

/** Validate all fields in the form and return a map of field errors */
export const validateAllSocietyFields = (
  formData: ApartmentEditFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const fieldsToValidate: (keyof ApartmentEditFormData)[] = [
    'societyName',
    'societyNameEnglish',
    'landOwnerName',
    'landOwnerNameEnglish',
    'builderName',
    'builderNameEnglish',
    'builderMobileNo',
    'societyEmail',
    'societyAddress',
    'societyAddressEnglish',
    'managerName',
    'managerNameEnglish',
    'managerMobileNo',
    'managerEmail',
    'secretaryName',
    'secretaryNameEnglish',
    'secretaryMobileNo',
    'secretaryEmail',
    'pinCode',
    'aadharNo',
  ];

  for (const field of fieldsToValidate) {
    const err = validateSingleField(field, formData[field], formData);
    if (err) {
      errors[field] = err;
    }
  }

  return errors;
};

export function useRedesignSocietyForm({
  open = true,
  propertyId,
  propertyMasterData,
  societyData,
  locale: _locale = 'en',
  onSuccess,
  onClose,
}: UseApartmentEditDrawerProps) {
  const router = useRouter();

  const effectivePropertyId = (() => {
    if (propertyId && !isNaN(Number(propertyId)) && Number(propertyId) > 0) {
      return Number(propertyId);
    }
    if (
      propertyMasterData?.propertyId &&
      !isNaN(Number(propertyMasterData.propertyId)) &&
      Number(propertyMasterData.propertyId) > 0
    ) {
      return Number(propertyMasterData.propertyId);
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPid = params.get('propertyId');
      if (urlPid && !isNaN(Number(urlPid)) && Number(urlPid) > 0) {
        return Number(urlPid);
      }
    }
    return undefined;
  })();

  const { markChangesSaved } = useQdeSaveTracker(effectivePropertyId);

  const [formData, setFormData] = useState<ApartmentEditFormData>(() =>
    getInitialFormState(propertyMasterData, societyData)
  );
  const initialFormRef = useRef<ApartmentEditFormData>(
    getInitialFormState(propertyMasterData, societyData)
  );
  const [availableWings, setAvailableWings] = useState<ApartmentQcWingDto[]>(
    () => propertyMasterData?.wings || []
  );

  const [managerWingScope, setManagerWingScope] = useState<SectionWingScope>(() =>
    computeInitialWingScope(
      propertyMasterData?.wings || [],
      propertyMasterData?.managerTargetWingDetailIds
    )
  );

  const [secretaryWingScope, setSecretaryWingScope] = useState<SectionWingScope>(() =>
    computeInitialWingScope(
      propertyMasterData?.wings || [],
      propertyMasterData?.secretaryTargetWingDetailIds
    )
  );

  // Field-level error and touched states for immediate validation feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [detectedDiffs, setDetectedDiffs] = useState<FieldDiffItem[]>([]);
  const [isPending, startTransition] = useTransition();

  // Instant hydration from SSR propertyMasterData & societyData when opened or data updates
  useEffect(() => {
    if (open) {
      const initial = getInitialFormState(propertyMasterData, societyData);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(initial);
      initialFormRef.current = initial;
      setFieldErrors({});
      setTouchedFields({});

      const wings = propertyMasterData?.wings || [];
      setAvailableWings(wings);

      setManagerWingScope(
        computeInitialWingScope(wings, propertyMasterData?.managerTargetWingDetailIds)
      );
      setSecretaryWingScope(
        computeInitialWingScope(wings, propertyMasterData?.secretaryTargetWingDetailIds)
      );
    }
  }, [open, propertyMasterData, societyData]);

  const updateField = useCallback(
    <K extends keyof ApartmentEditFormData>(field: K, value: ApartmentEditFormData[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'builderName') {
          next.occupierName = (value as string) || '';
        } else if (field === 'builderNameEnglish') {
          next.occupierNameEnglish = (value as string) || '';
        } else if (field === 'builderMobileNo') {
          next.mobileNo = (value as string) || '';
        }
        const error = validateSingleField(field, value, next);
        setFieldErrors((prevErrors) => {
          if (!error && !prevErrors[field]) return prevErrors;
          const updated = { ...prevErrors };
          if (error) {
            updated[field] = error;
          } else {
            delete updated[field];
          }
          return updated;
        });
        return next;
      });
      setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    },
    []
  );

  const handleBlurField = useCallback((field: keyof ApartmentEditFormData) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    setFormData((curr) => {
      const error = validateSingleField(field, curr[field], curr);
      setFieldErrors((prevErrors) => {
        if (!error && !prevErrors[field]) return prevErrors;
        const updated = { ...prevErrors };
        if (error) {
          updated[field] = error;
        } else {
          delete updated[field];
        }
        return updated;
      });
      return curr;
    });
  }, []);

  // Compute diffs and open confirmation modal with proper validation
  const handleReviewChanges = useCallback(() => {
    const targetPropId = effectivePropertyId;
    if (!targetPropId || targetPropId <= 0) {
      toast.error('Unable to identify property ID. Please select a property from search.');
      return;
    }

    // Comprehensive validation across all form fields
    const errors = validateAllSocietyFields(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouchedFields((prev) => {
        const nextTouched = { ...prev };
        Object.keys(errors).forEach((key) => {
          nextTouched[key] = true;
        });
        return nextTouched;
      });
      const firstError = Object.values(errors)[0];
      toast.error(firstError || 'Please fix the validation errors before proceeding.');
      return;
    }

    const diffs: FieldDiffItem[] = [];
    const initial = initialFormRef.current;

    const fieldsToCheck: (keyof ApartmentEditFormData)[] = [
      'societyName',
      'societyNameEnglish',
      'landOwnerName',
      'landOwnerNameEnglish',
      'builderName',
      'builderNameEnglish',
      'builderMobileNo',
      'societyEmail',
      'societyAddress',
      'societyAddressEnglish',
      'managerName',
      'managerNameEnglish',
      'managerMobileNo',
      'managerEmail',
      'secretaryName',
      'secretaryNameEnglish',
      'secretaryMobileNo',
      'secretaryEmail',
    ];

    fieldsToCheck.forEach((key) => {
      const oldVal = (initial[key] ?? '').toString().trim();
      const newVal = (formData[key] ?? '').toString().trim();

      if (oldVal !== newVal) {
        diffs.push({
          fieldKey: key,
          label: FIELD_LABELS[key] || key,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    });

    // If no differences detected vs baseline, still allow reviewing all filled attributes
    if (diffs.length === 0) {
      fieldsToCheck.forEach((key) => {
        const val = (formData[key] ?? '').toString().trim();
        if (val) {
          diffs.push({
            fieldKey: key,
            label: FIELD_LABELS[key] || key,
            oldValue: val,
            newValue: val,
          });
        }
      });
    }

    setDetectedDiffs(diffs);
    setIsConfirmOpen(true);
  }, [effectivePropertyId, formData]);

  // Execute PATCH API with computed secretaryTargetWingDetailIds & managerTargetWingDetailIds
  const handleConfirmSubmit = useCallback(async () => {
    const targetPropId = effectivePropertyId;
    if (!targetPropId || targetPropId <= 0) {
      toast.error('Unable to identify property ID. Please select a valid property.');
      return;
    }

    const allValidWingIds = availableWings
      .map((w) => w.wingDetailId)
      .filter(
        (id): id is number => typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647
      );

    const resolvedSecretaryWingIds: number[] = secretaryWingScope.applyToAll
      ? allValidWingIds
      : secretaryWingScope.selectedWingIds.filter(
          (id) => typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647
        );

    const resolvedManagerWingIds: number[] = managerWingScope.applyToAll
      ? allValidWingIds
      : managerWingScope.selectedWingIds.filter(
          (id) => typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647
        );

    const secMobileDigits = formData.secretaryMobileNo
      ? formData.secretaryMobileNo.replace(/\D/g, '')
      : '';
    const normalizedSecretaryMobile =
      secMobileDigits.length > 10 ? secMobileDigits.slice(-10) : secMobileDigits;

    const mgrMobileDigits = formData.managerMobileNo
      ? formData.managerMobileNo.replace(/\D/g, '')
      : '';
    const normalizedManagerMobile =
      mgrMobileDigits.length > 10 ? mgrMobileDigits.slice(-10) : mgrMobileDigits;

    const bldrMobileDigits = formData.builderMobileNo
      ? formData.builderMobileNo.replace(/\D/g, '')
      : '';
    const normalizedBuilderMobile =
      bldrMobileDigits.length > 10 ? bldrMobileDigits.slice(-10) : bldrMobileDigits;

    const mobDigits = formData.mobileNo ? formData.mobileNo.replace(/\D/g, '') : '';
    const normalizedMobile =
      normalizedBuilderMobile || (mobDigits.length > 10 ? mobDigits.slice(-10) : mobDigits);

    const altMobDigits = formData.alternateMobileNo
      ? formData.alternateMobileNo.replace(/\D/g, '')
      : '';
    const normalizedAltMobile = altMobDigits.length > 10 ? altMobDigits.slice(-10) : altMobDigits;

    const validMoujaId = resolvePositiveId(formData.moujaId ?? propertyMasterData?.moujaId);
    const validTaxZoneId = resolvePositiveId(formData.taxZoneId ?? propertyMasterData?.taxZoneId);
    const validCategoryId = resolvePositiveId(
      formData.categoryId ?? propertyMasterData?.categoryId
    );
    const validPropertyTypeId = resolvePositiveId(
      formData.propertyTypeId ?? propertyMasterData?.propertyTypeId
    );
    const validOwnerTypeId = resolvePositiveId(
      formData.ownerTypeId ?? propertyMasterData?.ownerTypeId
    );

    const patchPayload: UpdateApartmentQcTopSectionPayload = {
      // Owner / Land Owner aliases
      ownerName: formData.landOwnerName?.trim() || '',
      landOwnerName: formData.landOwnerName?.trim() || '',
      owner: formData.landOwnerName?.trim() || '',
      ownerNameEnglish: formData.landOwnerNameEnglish?.trim() || '',
      landOwnerNameEnglish: formData.landOwnerNameEnglish?.trim() || '',

      // Builder / Occupier aliases
      occupierName: formData.builderName?.trim() || '',
      builderName: formData.builderName?.trim() || '',
      builder: formData.builderName?.trim() || '',
      occupierRegional: formData.builderName?.trim() || '',
      occupierNameEnglish: formData.builderNameEnglish?.trim() || '',
      builderNameEnglish: formData.builderNameEnglish?.trim() || '',
      builderEnglish: formData.builderNameEnglish?.trim() || '',

      // Mobile
      mobileNo: normalizedMobile,
      builderMobileNo: normalizedBuilderMobile || normalizedMobile,
      alternateMobileNo: normalizedAltMobile,

      // Email
      emailId: formData.societyEmail?.trim() || '',
      societyEmail: formData.societyEmail?.trim() || '',
      societyEmailId: formData.societyEmail?.trim() || '',

      // Address
      address: formData.societyAddress?.trim() || '',
      societyAddress: formData.societyAddress?.trim() || '',
      societyAddressEnglish: formData.societyAddressEnglish?.trim() || '',

      pinCode: formData.pinCode?.trim() || '',
      plotNo: formData.plotNo?.trim() || '',
      surveyNo:
        formData.surveyNo?.trim() ||
        (formData.subZoneCsnNo ? formData.subZoneCsnNo.replace(/^CSN\s*-\s*/i, '').trim() : ''),
      moujaId: validMoujaId,
      taxZoneId: validTaxZoneId,
      categoryId: validCategoryId,
      propertyTypeId: validPropertyTypeId,
      aadharNo: formData.aadharNo?.trim() || '',
      ownerTypeId: validOwnerTypeId,

      // Society Name aliases
      societyName: formData.societyName?.trim() || '',
      societyNameEnglish: formData.societyNameEnglish?.trim() || '',
      propertyHolder: formData.societyName?.trim() || '',
      holderRegional: formData.societyName?.trim() || '',

      // Secretary & Manager
      secretaryName: formData.secretaryName?.trim() || '',
      secretaryNameEnglish: formData.secretaryNameEnglish?.trim() || '',
      secretaryMobileNo: normalizedSecretaryMobile,
      secretaryEmailId: formData.secretaryEmail?.trim() || '',
      managerName: formData.managerName?.trim() || '',
      managerNameEnglish: formData.managerNameEnglish?.trim() || '',
      managerMobileNo: normalizedManagerMobile,
      managerEmailId: formData.managerEmail?.trim() || '',
      secretaryTargetWingDetailIds: resolvedSecretaryWingIds,
      managerTargetWingDetailIds: resolvedManagerWingIds,
    };

    // Requirement 16: Log final payload in development mode
    if (process.env.NODE_ENV !== 'production') {
      // console.log('[Edit Society API Payload]:', patchPayload);
    }

    startTransition(async () => {
      try {
        const patchRes = await updateApartmentQcTopSectionAction(targetPropId, patchPayload);

        if (patchRes.success) {
          toast.success(patchRes.message || 'Society details updated successfully!');
          markChangesSaved();
          initialFormRef.current = { ...formData };
          setIsConfirmOpen(false);

          const updatedDataPayload = {
            societyName: formData.societyName.trim(),
            societyNameEnglish: formData.societyNameEnglish?.trim() || '-',
            builderName: formData.builderName?.trim() || '-',
            builderNameEnglish: formData.builderNameEnglish?.trim() || '-',
            builderMobileNo: formData.builderMobileNo?.trim()
              ? `+91 ${formData.builderMobileNo.replace(/\D/g, '')}`
              : '-',
            landOwnerName: formData.landOwnerName?.trim() || '-',
            landOwnerNameEnglish: formData.landOwnerNameEnglish?.trim() || '-',
            managerName: formData.managerName?.trim() || '-',
            managerNameEnglish: formData.managerNameEnglish?.trim() || '-',
            managerMobileNo: formData.managerMobileNo?.trim()
              ? `+91 ${formData.managerMobileNo.replace(/\D/g, '')}`
              : '-',
            managerEmail: formData.managerEmail?.trim() || '-',
            secretaryName: formData.secretaryName?.trim() || '-',
            secretaryNameEnglish: formData.secretaryNameEnglish?.trim() || '-',
            secretaryMobileNo: formData.secretaryMobileNo?.trim()
              ? `+91 ${formData.secretaryMobileNo.replace(/\D/g, '')}`
              : '-',
            secretaryEmail: formData.secretaryEmail?.trim() || '-',
            societyAddress: formData.societyAddress?.trim() || '-',
            societyAddressEnglish: formData.societyAddressEnglish?.trim() || '-',
            societyEmail: formData.societyEmail?.trim() || '-',
            plotNo: formData.plotNo?.trim() || '-',
            division: formData.division?.trim() || '-',
            taxZoneAndName: formData.taxZoneAndName?.trim() || '-',
            category: formData.category?.trim() || '-',
            subZoneCsnNo: formData.subZoneCsnNo?.trim() || '-',
            propertyDescriptionRegional: formData.propertyDescription?.trim() || '-',
            moujaId: validMoujaId,
            taxZoneId: validTaxZoneId,
            categoryId: validCategoryId,
            propertyTypeId: validPropertyTypeId,
            ownerTypeId: validOwnerTypeId,
            secretaryTargetWingDetailIds: resolvedSecretaryWingIds,
            managerTargetWingDetailIds: resolvedManagerWingIds,
          };

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('ptis:apartment-top-section-updated', {
                detail: {
                  propertyId: targetPropId,
                  updatedValues: updatedDataPayload,
                },
              })
            );
          }
          router.refresh();
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(
            patchRes.error ||
              'Unable to update society details. Please review your entries and try again.'
          );
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while saving. Please try again.'
        );
      }
    });
  }, [
    effectivePropertyId,
    formData,
    propertyMasterData,
    availableWings,
    managerWingScope,
    secretaryWingScope,
    router,
    onSuccess,
    onClose,
  ]);

  return {
    formData,
    updateField,
    fieldErrors,
    touchedFields,
    handleBlurField,
    availableWings,
    managerWingScope,
    setManagerWingScope,
    secretaryWingScope,
    setSecretaryWingScope,
    isConfirmOpen,
    setIsConfirmOpen,
    detectedDiffs,
    handleReviewChanges,
    handleConfirmSubmit,
    isSubmitting: isPending,
  };
}
