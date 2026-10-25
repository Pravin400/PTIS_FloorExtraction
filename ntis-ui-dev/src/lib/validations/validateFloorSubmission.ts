/**
 * Unified Floor Submission Validation
 * 
 * Single source of truth for all floor-related validation
 * Uses Zod schema for both form and API payload validation
 * Eliminates dual validation system code smell
 * 
 * @module floor-submission-validation
 */

import { ActionResult } from '@/types/common.types';
import { FloorSubmissionPayload } from '@/types/floor-details.types';
import {
  validateFloorSubmissionPayload as zodValidate,
  FloorSubmissionSchemaType,
  renterSubmissionSchema
} from './floor-submission.schema';
import {
  floorFormSchema,
} from './floor-form.schema';

/**
 * Validate floor form data (client-side)
 * Returns validation result with field-level errors
 * 
 * @param data - Floor form data to validate
 * @returns Validation result with success flag and errors object
 * 
 * @example
 * const result = validateFloorForm(editingFloorForm);
 * if (!result.success) {
 *   setFormErrors(result.errors);
 * }
 */
export function validateFloorForm(
  data: unknown,
  t?: (key: string) => string,
  isAddingNewFloor?: boolean,
  selectedFloorType?: 'Construction' | 'OpenPlot',
  _allFloors?: unknown[],
  _propertyId?: string | number
) {
  const parseData = typeof data === 'object' && data !== null ? { ...data, isAddingNewFloor, selectedFloorType } : data;
  const result = floorFormSchema.safeParse(parseData);

  if (!result.success) {
    // Validation failed - this is expected during initial/partial form states.
    // We suppress console.error to avoid cluttered dev console output and Next.js overlays.
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      let message = issue.message;

      if (t) {
        if (issue.message.startsWith('floor.')) {
          message = t(issue.message) || issue.message;
        } else if (path === 'floor') {
          message = t('floor.errors.floorRequired') || 'Floor selection is required';
        } else if (path === 'conYr') {
          message = t('floor.errors.constructionYearInvalid') || 'Construction year must be between 1700 and the current financial year';
        } else if (path === 'asstYr') {
          if (issue.message.toLowerCase().includes('less than') || issue.message.toLowerCase().includes('cannot be less')) {
            message = t('floor.asstYrError') || 'Assessment Year cannot be less than Construction Year';
          } else {
            message = t('floor.errors.assessmentYearInvalid') || 'Assessment year must be between 1700 and the current financial year';
          }
        } else if (path === 'conTyp') {
          message = t('floor.errors.constructionTypeRequired') || 'Construction type is required';
        } else if (path === 'constructionTypeId') {
          message = t('floor.errors.openPlotConstructionTypeNotFound') || 'Construction Type for Open Plot (op) not found in master data';
        } else if (path === 'use') {
          message = t('floor.errors.typeOfUseRequired') || 'Type of use is required';
        } else if (path === 'rooms') {
          message = t('floor.errors.roomCountRequired') || 'Number of rooms must be greater than zero';
        } else if (path === 'areaSqFt') {
          message = t('floor.errors.carpetAreaRequired') || 'Carpet area must be greater than zero';
        }
      }

      errors[path] = message;
    });
    return { success: false as const, isValid: false, errors };
  }

  return { success: true as const, isValid: true, data: result.data, errors: {} };
}

/**
 * Validate individual field (for real-time validation)
 * 
 * @param fieldName - Name of the field to validate
 * @param value - Value to validate
 * @returns Validation result for single field
 * 
 * @example
 * const result = validateField('conYr', '2024');
 * if (!result.isValid) {
 *   setFormErrors(prev => ({ ...prev, conYr: result.error }));
 * }
 */
export function validateField(fieldName: string, value: unknown) {
  const fieldSchema = floorFormSchema.shape[fieldName as keyof typeof floorFormSchema.shape];

  if (!fieldSchema) {
    return { isValid: true, error: undefined };
  }

  const result = fieldSchema.safeParse(value);

  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0].message
    };
  }

  return { isValid: true, error: undefined };
}

/**
 * Centralized validation for FloorSubmissionPayload using Zod schema.
 * Returns { success: true } if valid, else { success: false, error }.
 * Error messages are translation keys that should be translated in the UI layer.
 */
export function validateFloorSubmissionPayload(payload: FloorSubmissionPayload): ActionResult<FloorSubmissionSchemaType> {
  const result = zodValidate(payload);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.errorKey };
}

/**
 * Export schema functions for backward compatibility
 */
export { floorSubmissionSchema } from './floor-submission.schema';
export type { FloorSubmissionSchemaType } from './floor-submission.schema';

/**
 * Validates renter form data
 * 
 * @param data - Renter data to validate
 * @returns ActionResult with success flag and optional error message
 */
export function validateRenterFormData(data: unknown): ActionResult<unknown> {
  const result = renterSubmissionSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Return first error message as translation key if it looks like one, else generic
  const firstIssueMessage = result.error.issues[0]?.message;
  const isTranslationKey = firstIssueMessage && firstIssueMessage.includes('.') && !firstIssueMessage.includes(' ');
  const issuesSummary = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
  const errorKey = isTranslationKey ? firstIssueMessage : `floor.errors.invalidData (${issuesSummary})`;
  
  // Let's make it return ActionResult to match submitFloorSubmissionNoRedirectAction pattern.
  return { success: false, error: errorKey };
}
