/**
 * VALIDATION USAGE EXAMPLES
 * 
 * This file demonstrates how to use the Old Taxation and Floor Information
 * validation constants and utilities in your forms.
 * 
 * @module validation-usage-examples
 */

// ============================================================================
// OLD TAXATION VALIDATION EXAMPLES
// ============================================================================

import { useState } from 'react';
import {
  oldTaxationValidators,
  OLD_TAXATION_ERROR_MESSAGES,
} from '@/lib/utils/OldDetails/old-taxation-validation.constants';


/*
 * Example 2: Using sanitization and formatting in React input handlers
 */
function OldTaxationInputExample() {
  const handleZoneNameChange = (value: string) => {
    // Sanitize the input to remove invalid characters
    const sanitized = oldTaxationValidators.sanitizeTextField(value);
    
    // Validate the sanitized value
    const isValid = oldTaxationValidators.isValidZoneName(sanitized);
    
    if (!isValid && sanitized.trim()) {
      console.error(OLD_TAXATION_ERROR_MESSAGES.ZONE_NAME_INVALID);
    }
    
    return sanitized;
  };

  const handlePlotAreaChange = (value: string) => {
    // Format the area input
    const formatted = oldTaxationValidators.formatAreaInput(value);
    
    // Validate the formatted value
    const isValid = oldTaxationValidators.isValidAreaField(formatted);
    
    if (!isValid && formatted) {
      console.error(OLD_TAXATION_ERROR_MESSAGES.AREA_INVALID);
    }
    
    return formatted;
  };

  const handleTaxChange = (value: string) => {
    // Format the tax input
    const formatted = oldTaxationValidators.formatTaxInput(value);
    
    // Validate the formatted value
    const isValid = oldTaxationValidators.isValidTaxField(formatted);
    
    if (!isValid && formatted) {
      console.error(OLD_TAXATION_ERROR_MESSAGES.TAX_INVALID);
    }
    
    return formatted;
  };

  // Example usage in JSX
  return {
    handleZoneNameChange,
    handlePlotAreaChange,
    handleTaxChange,
  };
}

interface OldTaxationExampleFormData {
  oldZoneNo: string;
  oldWardNo: string;
  oldPropertyNo: string;
  oldPartitionNo?: string;
  oldEgovNo?: string;
  oldPlotArea?: string | number | null;
  oldRV?: string | number | null;
}

function handleOldTaxationSubmit(formData: OldTaxationExampleFormData) {
  const errors: Record<string, string> = {};

  // Validate required fields
  if (!oldTaxationValidators.isValidZoneName(formData.oldZoneNo)) {
    errors.oldZoneNo = OLD_TAXATION_ERROR_MESSAGES.ZONE_NAME_REQUIRED;
  }

  if (!oldTaxationValidators.isValidWardNo(formData.oldWardNo)) {
    errors.oldWardNo = OLD_TAXATION_ERROR_MESSAGES.WARD_NO_REQUIRED;
  }

  if (!oldTaxationValidators.isValidPropertyNo(formData.oldPropertyNo)) {
    errors.oldPropertyNo = OLD_TAXATION_ERROR_MESSAGES.PROPERTY_NO_REQUIRED;
  }

  // Validate optional fields if they have values
  if (formData.oldPartitionNo && !oldTaxationValidators.isValidPartitionNo(formData.oldPartitionNo)) {
    errors.oldPartitionNo = OLD_TAXATION_ERROR_MESSAGES.PARTITION_NO_INVALID;
  }

  if (formData.oldEgovNo && !oldTaxationValidators.isValidEgovNo(formData.oldEgovNo)) {
    errors.oldEgovNo = OLD_TAXATION_ERROR_MESSAGES.EGOV_NO_INVALID;
  }

  // Validate area fields
  if (formData.oldPlotArea && !oldTaxationValidators.isValidAreaField(formData.oldPlotArea)) {
    errors.oldPlotArea = OLD_TAXATION_ERROR_MESSAGES.AREA_INVALID;
  }

  // Validate tax fields
  if (formData.oldRV && !oldTaxationValidators.isValidTaxField(formData.oldRV)) {
    errors.oldRV = OLD_TAXATION_ERROR_MESSAGES.TAX_INVALID;
  }

  if (Object.keys(errors).length > 0) {
    console.error('Validation Errors:', errors);
    return { success: false, errors };
  }

  return { success: true, data: formData };
}

/**
 * Example 7: Real-time validation with error messages
 */
function useOldTaxationValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});


  const validateField = (fieldName: string, value: string) => {
    let error = '';

    switch (fieldName) {
      case 'oldZoneNo':
        if (!oldTaxationValidators.isValidZoneName(value)) {
          error = value.trim() ? OLD_TAXATION_ERROR_MESSAGES.ZONE_NAME_INVALID : OLD_TAXATION_ERROR_MESSAGES.ZONE_NAME_REQUIRED;
        }
        break;
      case 'oldWardNo':
        if (!oldTaxationValidators.isValidWardNo(value)) {
          error = value.trim() ? OLD_TAXATION_ERROR_MESSAGES.WARD_NO_INVALID : OLD_TAXATION_ERROR_MESSAGES.WARD_NO_REQUIRED;
        }
        break;
      case 'oldPlotArea':
        if (value && !oldTaxationValidators.isValidAreaField(value)) {
          error = OLD_TAXATION_ERROR_MESSAGES.AREA_INVALID;
        }
        break;
      case 'oldRV':
        if (value && !oldTaxationValidators.isValidTaxField(value)) {
          error = OLD_TAXATION_ERROR_MESSAGES.TAX_INVALID;
        }
        break;
      // Add more cases as needed
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error === '';
  };

  return { errors, validateField };
}

// Export examples for reference
export {
  OldTaxationInputExample, 
  handleOldTaxationSubmit,
  useOldTaxationValidation,
};
