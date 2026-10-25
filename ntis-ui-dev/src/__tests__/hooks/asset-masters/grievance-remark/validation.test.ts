import { validateGrievanceRemarkForm } from '@/hooks/asset-masters/grievance-remark/validation';
import { AssetGrievanceRemarkFormModel } from '@/types/asset-masters/asset-grievance-remark.types';
import { describe, test, expect } from 'vitest';

const t = (key: string, values?: Record<string, string | number | Date>) => {
  if (values) {
    return `${key}_${JSON.stringify(values)}`;
  }
  return key;
};

describe('validateGrievanceRemarkForm', () => {
  const baseModel: AssetGrievanceRemarkFormModel = {
    remark: '',
    description: '',
    grievanceCategoryId: 0,
    isActive: false,
  };

  test('requires remark', () => {
    const errors = validateGrievanceRemarkForm({ ...baseModel }, t, false);
    expect(errors.remark).toBe('form.validation.remarkRequired');
  });

  test('remark min length check', () => {
    const errors = validateGrievanceRemarkForm({ ...baseModel, remark: 'ab' }, t, false);
    expect(errors.remark).toBe('form.validation.remarkMinLength');
  });

  test('remark max length check (150)', () => {
    const longRemark = 'a'.repeat(151);
    const errors = validateGrievanceRemarkForm({ ...baseModel, remark: longRemark }, t, false);
    expect(errors.remark).toBe('form.validation.remarkMaxLength');
  });

  test('remark all zeros check', () => {
    const errors = validateGrievanceRemarkForm({ ...baseModel, remark: '0000' }, t, false);
    expect(errors.remark).toBe('form.validation.remarkFormat');
  });


  test('description max length check (500)', () => {
    const longDesc = 'a'.repeat(501);
    const errors = validateGrievanceRemarkForm({ ...baseModel, remark: 'Valid Remark', description: longDesc }, t, false);
    expect(errors.description).toBe('form.validation.descriptionMaxLength');
  });

  test('description all zeros check', () => {
    const errors = validateGrievanceRemarkForm({ ...baseModel, remark: 'Valid Remark', description: '0000' }, t, false);
    expect(errors.description).toBe('form.validation.remarkFormat');
  });

  test('grievanceCategoryId validation', () => {
    const errorsEmpty = validateGrievanceRemarkForm({ ...baseModel, remark: 'Valid Remark' }, t, false);
    expect(errorsEmpty.grievanceCategoryId).toBe('form.validation.remarkTypeRequired');
  });

  test('isActive required on create', () => {
    const errors = validateGrievanceRemarkForm({ ...baseModel, remark: 'Valid Remark', grievanceCategoryId: 10, isActive: false }, t, false);
    expect(errors.isActive).toBe('form.validation.mustBeActive');
  });

  test('no errors on valid model (create & edit)', () => {
    const validModel = {
      remark: 'Valid Remark',
      description: 'Valid Description',
      grievanceCategoryId: 5,
      isActive: true,
    };
    const errorsCreate = validateGrievanceRemarkForm(validModel, t, false);
    expect(errorsCreate).toEqual({});

    const errorsEdit = validateGrievanceRemarkForm({ ...validModel, isActive: false }, t, true);
    expect(errorsEdit).toEqual({});
  });
});
