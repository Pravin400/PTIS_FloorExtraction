import { useState, useCallback } from 'react';
import {
  PERSON_NAME_REGEX,
  EMAIL_REGEX,
  MOBILE_10_REGEX,
  YEAR_REGEX,
  CODE_REGEX,
} from '@/lib/utils/validation-rules';
import type {
  PropertyBasicInfoFormData,
  PropertyBasicInfoErrors,
  FloorDataRow,
  FloorQCValidationError,
  BasicInfoSectionCopy,
  FloorQCSectionCopy,
} from '@/types/propertyEdit.types';

interface UsePropertyEditFormValidationArgs {
  formData: PropertyBasicInfoFormData;
  floorData: FloorDataRow[];
  basicInfoCopy: BasicInfoSectionCopy;
  floorQCCopy: FloorQCSectionCopy;
}

/**
 * Hook for managing property edit form validation
 * 
 * Handles:
 * - Field-level validation with translated messages
 * - Form-wide validation
 * - Year validation for floor QC
 * - Touch state tracking
 */
export function usePropertyEditFormValidation({
  formData,
  floorData,
  basicInfoCopy,
  floorQCCopy,
}: UsePropertyEditFormValidationArgs) {
  const [errors, setErrors] = useState<PropertyBasicInfoErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PropertyBasicInfoErrors, boolean>>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  /**
   * Validates a single field and returns error message or empty string
   */
  const validateField = useCallback((field: string, value: string): string => {
    const { validation } = basicInfoCopy;
    
    switch (field) {
      case 'ownerName':
        if (!value.trim()) return validation.ownerNameRequired;
        if (!PERSON_NAME_REGEX.test(value.trim())) return validation.invalidNameFormat;
        break;
      case 'occupierName':
        if (!value.trim()) return validation.occupierNameRequired;
        if (!PERSON_NAME_REGEX.test(value.trim())) return validation.invalidNameFormat;
        break;
      case 'renterName':
        if (value.trim() && !PERSON_NAME_REGEX.test(value.trim())) return validation.invalidNameFormat;
        break;
      case 'mobileNo':
        if (value.trim() && !MOBILE_10_REGEX.test(value.trim())) return validation.invalidMobile;
        break;
      case 'emailId':
        if (value.trim() && !EMAIL_REGEX.test(value.trim())) return validation.invalidEmail;
        break;
      case 'flatOrShopNo':
        if (!value.trim()) return validation.flatOrShopNoRequired;
        break;
      case 'wingName':
        if (value.trim() && !CODE_REGEX.test(value.trim())) return validation.invalidWingFormat;
        break;
      case 'oldPropertyNo':
        if (value.trim() && !CODE_REGEX.test(value.trim())) return validation.invalidPropertyNoFormat;
        break;
    }
    return '';
  }, [basicInfoCopy]);

  /**
   * Validates all basic info form fields
   * Returns true if valid, false otherwise
   */
  const validateForm = useCallback((): boolean => {
    setSubmittedOnce(true);
    
    const newErrors: PropertyBasicInfoErrors = {};
    
    const errorOwner = validateField('ownerName', formData.ownerName);
    if (errorOwner) newErrors.ownerName = errorOwner;
    
    const errorOccupier = validateField('occupierName', formData.occupierName);
    if (errorOccupier) newErrors.occupierName = errorOccupier;
    
    const errorRenter = validateField('renterName', formData.renterName);
    if (errorRenter) newErrors.renterName = errorRenter;
    
    const errorMobile = validateField('mobileNo', formData.mobileNo);
    if (errorMobile) newErrors.mobileNo = errorMobile;
    
    const errorEmail = validateField('emailId', formData.emailId);
    if (errorEmail) newErrors.emailId = errorEmail;
    
    const errorFlat = validateField('flatOrShopNo', formData.flatOrShopNo);
    if (errorFlat) newErrors.flatOrShopNo = errorFlat;
    
    const errorWing = validateField('wingName', formData.wingName);
    if (errorWing) newErrors.wingName = errorWing;
    
    const errorOldPropNo = validateField('oldPropertyNo', formData.oldPropertyNo);
    if (errorOldPropNo) newErrors.oldPropertyNo = errorOldPropNo;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  /**
   * Validates a year field (construction year or assessment year)
   */
  const validateYear = useCallback((year: string): string => {
    if (!year.trim()) return '';
    if (!YEAR_REGEX.test(year)) return floorQCCopy.validation.invalidYear;
    const yearNum = parseInt(year, 10);
    if (yearNum < 1900 || yearNum > 2100) return floorQCCopy.validation.yearOutOfRange;
    return '';
  }, [floorQCCopy]);

  /**
   * Validates all floor QC data rows
   * Returns array of validation errors
   */
  const validateFloorData = useCallback((): FloorQCValidationError[] => {
    const errors: FloorQCValidationError[] = [];
    
    floorData.forEach((row, index) => {
      const conYearError = validateYear(row.conYear);
      if (conYearError) {
        errors.push({
          rowIndex: index,
          field: 'conYear',
          message: conYearError,
        });
      }
      
      const asstYearError = validateYear(row.asstYear);
      if (asstYearError) {
        errors.push({
          rowIndex: index,
          field: 'asstYear',
          message: asstYearError,
        });
      }
    });
    
    return errors;
  }, [floorData, validateYear]);

  /**
   * Determines if an error should be shown for a field
   * Only shows error after field is touched or form is submitted
   */
  const showError = useCallback((field: keyof PropertyBasicInfoErrors): boolean => {
    return Boolean((submittedOnce || touched[field]) && errors[field]);
  }, [submittedOnce, touched, errors]);

  /**
   * Handles field blur - marks field as touched and validates
   */
  const handleBlur = useCallback((field: keyof PropertyBasicInfoErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field as keyof PropertyBasicInfoFormData] || '';
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [formData, validateField]);

  /**
   * Clears error for a specific field
   */
  const clearFieldError = useCallback((field: keyof PropertyBasicInfoErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  return {
    errors,
    setErrors,
    validateField,
    validateForm,
    validateYear,
    validateFloorData,
    showError,
    submittedOnce,
    touched,
    setTouched,
    handleBlur,
    clearFieldError,
  };
}
