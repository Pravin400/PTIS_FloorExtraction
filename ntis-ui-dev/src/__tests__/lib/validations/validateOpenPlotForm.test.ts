import { describe, it, expect } from 'vitest';
import { validateOpenPlotForm } from '@/lib/validations/validateOpenPlotForm';

describe('validateOpenPlotForm Unit Tests', () => {
  const dummyCategory = {
    id: 10,
    typeOfUseId: 10,
    typeOfUseCode: 'OP',
    description: 'खुला भूखंड निवासी',
    type: 'C',
    typeOfUseGroupId: 10031,
    typeOfUseCategoryId: 3,
    isActive: true,
  };

  it('should return error if category is missing', () => {
    const result = validateOpenPlotForm(null, '10', '20');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Please select an Open Plot Category.');
  });

  it('should return error if length or width is 0 or invalid', () => {
    expect(validateOpenPlotForm(dummyCategory, '0', '20').isValid).toBe(false);
    expect(validateOpenPlotForm(dummyCategory, '10', '-5').isValid).toBe(false);
    expect(validateOpenPlotForm(dummyCategory, 'abc', '20').isValid).toBe(false);
  });

  it('should validate valid dimensions correctly', () => {
    const result = validateOpenPlotForm(dummyCategory, '100', '10');
    expect(result.isValid).toBe(true);
    expect(result.plotLength).toBe(100);
    expect(result.plotWidth).toBe(10);
    expect(result.areaSqMeter).toBe(1000);
  });
});
