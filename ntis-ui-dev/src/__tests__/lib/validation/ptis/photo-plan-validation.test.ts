import { describe, it, expect } from 'vitest';
import {
  photoPlanNamingSchema,
  validatePhotoFile,
} from '@/lib/validation/ptis/photo-plan-validation';

describe('photo-plan-validation', () => {
  describe('photoPlanNamingSchema', () => {
    it('validates a valid photo naming payload', () => {
      const validData = {
        name: 'Building Front Photo_1',
        displayOrder: 1,
        remarks: 'Sample remarks',
        photoTypeId: 2,
      };
      const result = photoPlanNamingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('accepts name with dots and special characters like Wing Building Photo (BUILDING NO. 2.)', () => {
      const validData = {
        name: 'Wing Building Photo (BUILDING NO. 2.)',
        displayOrder: 1,
      };
      const result = photoPlanNamingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects empty name or name exceeding max length of 250 characters', () => {
      const emptyResult = photoPlanNamingSchema.safeParse({ name: '   ', displayOrder: 1 });
      expect(emptyResult.success).toBe(false);

      const tooLongResult = photoPlanNamingSchema.safeParse({ name: 'A'.repeat(251), displayOrder: 1 });
      expect(tooLongResult.success).toBe(false);
    });

    it('rejects non-positive or non-integer display orders', () => {
      const invalidData = {
        name: 'Valid Name',
        displayOrder: -5,
      };
      const result = photoPlanNamingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validatePhotoFile', () => {
    it('returns error when file is null', () => {
      expect(validatePhotoFile(null)).toBe('media.fileRequired');
    });

    it('returns error when file type is unsupported', () => {
      const pdfFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
      expect(validatePhotoFile(pdfFile)).toBe('media.allowedFormats');
    });

    it('returns error when file size exceeds 5MB', () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      expect(validatePhotoFile(largeFile)).toBe('media.maxFileSize');
    });

    it('returns null for valid jpeg/png image under 5MB', () => {
      const validFile = new File([new ArrayBuffer(1024)], 'photo.png', { type: 'image/png' });
      expect(validatePhotoFile(validFile)).toBe(null);
    });
  });
});
