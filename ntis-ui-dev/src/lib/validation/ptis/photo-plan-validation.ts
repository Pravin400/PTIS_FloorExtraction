import { z } from 'zod';

/**
 * Zod validation schema for Photo Plan naming modal.
 * Error messages correspond to localization keys in ptis.json.
 */
export const photoPlanNamingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'media.nameRequired')
    .max(250, 'media.nameTooLong')
    .regex(/^[a-zA-Z0-9\u0900-\u097F\s._\-/,()]+$/, 'media.invalidNameFormat'),
  displayOrder: z
    .coerce
    .number()
    .int('media.invalidDisplayOrder')
    .positive('media.invalidDisplayOrder'),
  remarks: z.string().trim().optional(),
  photoTypeId: z
    .number()
    .positive('media.photoTypeIdRequired')
    .optional(),
});

/**
 * File validation helper function.
 * Returns error message key or null.
 */
export function validatePhotoFile(file: File | null): string | null {
  if (!file) {
    return 'media.fileRequired';
  }
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return 'media.allowedFormats';
  }
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    return 'media.maxFileSize';
  }
  return null;
}
