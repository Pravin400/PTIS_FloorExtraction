/**
 * Floor Submission Payload Validation
 * 
 * Provides validation functions for floor submission payloads
 * Ensures all required fields are present and valid before API calls
 * Uses Zod schemas for type-safe validation with i18n-ready error keys
 * 
 * @module payload-validation
 */

import {
    type FloorSubmissionPayload,
} from '@/types/floor-details.types';
import { ApiError } from "@/lib/utils/api";
import { 
    validateSubmissionId as zodValidateSubmissionId,
    floorSubmissionSchema,
    renterSubmissionSchema
} from '@/lib/validations/floor-submission.schema';
import { getLoggedInUserId } from '@/lib/utils/cookie.server';

/**
 * Validates renter form data for API calls
 * 
 * @param data - Renter data to validate
 * @throws ApiError with status 400 if validation fails
 */
export function validateRenterFormData(data: unknown): void {
    const result = renterSubmissionSchema.safeParse(data);
    
    if (!result.success) {
        const issuesSummary = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        const errorKey = result.error.issues[0].message || 'floor.errors.invalidData';
        throw new ApiError(400, `${errorKey} (${issuesSummary})`, "Renter data validation failed");
    }
}

/**
 * Validates floor submission ID for update operations
 * 
 * @param id - Submission ID to validate (number or string)
 * @returns True if ID is valid (positive number or non-empty string)
 * 
 * @example
 * if (!validateSubmissionId(submissionId)) {
 *   throw new ApiError(400, "floor.errors.submissionIdRequired", "Floor submission ID validation failed");
 * }
 */
export function validateSubmissionId(id: number | string): id is number | string {
    return zodValidateSubmissionId(id);
}

/**
 * Validates form data for create operation using Zod schema
 * Ensures all required fields are present and valid
 * 
 * @param data - Floor submission payload to validate
 * @throws ApiError with status 400 and translation key if validation fails
 * 
 * @example
 * try {
 *   await validateCreateFormData(payload);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     const translatedMessage = t(error.message);
 *     toast.error(translatedMessage);
 *   }
 * }
 */
export async function validateCreateFormData(data: FloorSubmissionPayload): Promise<void> {
    const userId = await getLoggedInUserId();
    data.createdBy = userId;
    data.updatedBy = userId;

    const result = floorSubmissionSchema.safeParse(data);
    
    if (!result.success) {
        // Get first error - message is already a translation key
        const firstError = result.error.issues[0];
        const errorKey = firstError.message || 'floor.errors.invalidData';
        throw new ApiError(400, errorKey, "Floor submission data validation failed");
    }
}

/**
 * Validates form data for update operation
 * Ensures submission ID is valid and all required fields are present
 * 
 * @param submissionId - ID of the submission being updated
 * @param data - Floor submission payload to validate
 * @throws ApiError with status 400 and translation key if validation fails
 */
export async function validateUpdateFormData(submissionId: number | string, data: FloorSubmissionPayload): Promise<void> {
    if (!validateSubmissionId(submissionId)) {
        throw new ApiError(400, "floor.errors.submissionIdRequired", "Floor submission ID validation failed");
    }
    const userId = await getLoggedInUserId();
    data.createdBy = data.createdBy ? Number(data.createdBy) : 0;
    data.updatedBy = userId;

    const result = floorSubmissionSchema.safeParse(data);
    
    if (!result.success) {
        // Get first error - message is already a translation key
        const firstError = result.error.issues[0];
        const errorKey = firstError.message || 'floor.errors.invalidData';
        throw new ApiError(400, errorKey, "Floor submission data validation failed");
    }
}
