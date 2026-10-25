import { SocialAttributeFormModel } from '@/types/social-attribute.types';
import { ApiError } from '@/lib/utils/api';

export function validateId(id: number): boolean {
  return Number.isFinite(id) && id > 0;
}

export function validateAndPrepareSearchTerm(searchTerm?: string): string | undefined {
  if (typeof searchTerm !== 'string') return undefined;

  const trimmedSearchTerm = searchTerm.trim();
  if (trimmedSearchTerm.length === 0) return undefined;

  const MAX_SEARCH_TERM_LENGTH = 100;
  return trimmedSearchTerm.slice(0, MAX_SEARCH_TERM_LENGTH);
}

export function validateSocialAttributeForm(data: SocialAttributeFormModel, isEdit: boolean): void {
  if (isEdit && (!data.id || data.id <= 0)) {
    throw new ApiError(400, 'Social Attribute ID is required for update', 'Validation failed');
  }

  const code = data.socialAttributeCode?.trim();
  if (!code) {
    throw new ApiError(400, 'Social attribute code is required', 'Validation failed');
  }
  if (code.length < 3) {
    throw new ApiError(
      400,
      'Social attribute code must be at least 3 characters',
      'Validation failed'
    );
  }
  if (code.length > 50) {
    throw new ApiError(
      400,
      'Social attribute code cannot exceed 50 characters',
      'Validation failed'
    );
  }
  if (!/^[A-Z_]+$/.test(code)) {
    throw new ApiError(
      400,
      'Social attribute code format is invalid. Only English uppercase letters and underscore are allowed.',
      'Validation failed'
    );
  }

  const name = data.socialAttributeName?.trim();
  if (!name) {
    throw new ApiError(400, 'Social attribute name is required', 'Validation failed');
  }
  if (name.length > 40) {
    throw new ApiError(
      400,
      'Social attribute name cannot exceed 40 characters',
      'Validation failed'
    );
  }
  if (!/^[\p{L}\p{M}\s\-()]+$/u.test(name)) {
    throw new ApiError(
      400,
      'Social attribute name format is invalid. Only letters, spaces, dash (-), and parentheses () are allowed.',
      'Validation failed'
    );
  }

  const dataType = data.dataType?.trim();
  if (!dataType) {
    throw new ApiError(400, 'Data type is required', 'Validation failed');
  }

  const unit = data.unit?.trim();
  if (unit) {
    if (unit.length > 50) {
      throw new ApiError(400, 'Unit cannot exceed 50 characters', 'Validation failed');
    }
    if (!/^[\p{L}\p{M}\p{N}.%²³\s]+$/u.test(unit)) {
      throw new ApiError(
        400,
        'Unit format is invalid. Only letters, numbers, spaces, dot, percent, and power symbols are allowed.',
        'Validation failed'
      );
    }
  }
}

export function validateCreateFormData(data: SocialAttributeFormModel): void {
  validateSocialAttributeForm(data, false);
}

export function validateUpdateFormData(data: SocialAttributeFormModel): void {
  validateSocialAttributeForm(data, true);
}

export function getDeleteErrorStatusCode(errorMsg: string): number {
  const lowerMsg = errorMsg.toLowerCase();

  if (lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
    return 404; // Not Found
  } else if (
    lowerMsg.includes('in use') ||
    lowerMsg.includes('linked') ||
    lowerMsg.includes('referenced') ||
    lowerMsg.includes('associated') ||
    lowerMsg.includes('cannot delete') ||
    lowerMsg.includes('foreign key') ||
    lowerMsg.includes('violate') ||
    lowerMsg.includes('conflict') ||
    lowerMsg.includes('reference constraint') ||
    lowerMsg.includes('fk_')
  ) {
    return 409; // Conflict - record in use
  } else if (lowerMsg.includes('invalid') || lowerMsg.includes('bad request')) {
    return 400; // Bad Request
  } else {
    return 500; // Default to server error
  }
}

export function createApiError(
  statusCode?: number,
  errorMessage?: string,
  defaultMessage: string = 'Operation failed'
): ApiError {
  const errorMsg = errorMessage || '';
  const isDuplicate =
    errorMsg.toLowerCase().includes('already exists') ||
    errorMsg.toLowerCase().includes('duplicate');

  return new ApiError(
    statusCode ?? (isDuplicate ? 409 : 500),
    errorMessage || defaultMessage,
    defaultMessage
  );
}
