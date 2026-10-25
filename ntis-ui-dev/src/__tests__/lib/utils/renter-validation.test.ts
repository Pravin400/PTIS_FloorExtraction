import { describe, it, expect } from 'vitest';
import { validateRenterForm } from '@/lib/utils/renter/renter-validation';
import { RenterFormDataDetails } from '@/types/renter/renter.types';

describe('validateRenterForm', () => {
  const currentYear = new Date().getFullYear();

  const validBaseForm: RenterFormDataDetails = {
    renterName: 'John Doe',
    agreementId: '123456',
    agreementDate: `${currentYear}-01-15`,
    agreementDateFrom: `${currentYear}-01-15`,
    agreementDateTo: `${currentYear + 1}-01-14`,
    rentAmount: '5000.00',
    rentAmountAGR: '5000.00',
    rentAmountSUR: '',
    selfDeclarationAmount: '5000.00',
    incrementFrequency: 'Yearly',
    incrementType: 'Percentage',
    incrementValue: '5',
    customDateRanges: [],
    taxLiability: 'Renter',
  };

  it('should pass with valid data', () => {
    const errors = validateRenterForm(validBaseForm);
    expect(errors).toHaveLength(0);
  });

  describe('Tax Liability Validation', () => {
    it('should reject empty or missing tax liability', () => {
      const errors = validateRenterForm({ ...validBaseForm, taxLiability: '' });
      const matched = errors.filter((e) => e.field === 'taxLiability');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Tax Liability is required.');
    });

    it('should allow valid tax liability values like Self or Renter', () => {
      ['Self', 'Renter'].forEach((val) => {
        const errors = validateRenterForm({ ...validBaseForm, taxLiability: val });
        expect(errors.filter((e) => e.field === 'taxLiability')).toHaveLength(0);
      });
    });
  });

  describe('Agreement No Validation', () => {
    it('should allow valid alphanumeric agreement Nos with hyphens and underscores up to 8 characters', () => {
      const allowed = ['1', '123', 'ABC_123', 'ABC-123', 'ABC123', '12345678'];
      allowed.forEach((id) => {
        const errors = validateRenterForm({ ...validBaseForm, agreementId: id });
        expect(errors.filter((e) => e.field === 'agreementId')).toHaveLength(0);
      });
    });

    it('should allow empty or missing agreement No', () => {
      const errors = validateRenterForm({ ...validBaseForm, agreementId: '' });
      const matched = errors.filter((e) => e.field === 'agreementId');
      expect(matched).toHaveLength(0);
    });

    it('should reject agreement Nos with invalid special characters', () => {
      const rejected = ['ABC 123', '12/05/20', 'AG@123'];
      rejected.forEach((id) => {
        const errors = validateRenterForm({ ...validBaseForm, agreementId: id });
        const matched = errors.filter((e) => e.field === 'agreementId');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe(
          'Agreement No must be alphanumeric and can contain hyphens and underscores.'
        );
      });
    });

    it('should reject agreement Nos longer than 8 characters', () => {
      const errors = validateRenterForm({ ...validBaseForm, agreementId: '123456789' });
      const matched = errors.filter((e) => e.field === 'agreementId');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Agreement No must be at most 8 characters.');
    });
  });

  describe('Renter Name Validation', () => {
    it('should allow valid renter names', () => {
      const validNames = [
        'Ashwin',
        'Ashwin ',
        'Rahul Deshmukh',
        'Yash Patil',
        'Amit Sharma',
        'Sneha Kulkarni',
        'Raj Kumar',
        'राहुल देशमुख',
        'अमित शर्मा',
        'स्नेहा कुलकर्णी',
        'राज कुमार',
      ];
      validNames.forEach((name) => {
        const errors = validateRenterForm({ ...validBaseForm, renterName: name });
        expect(errors.filter((e) => e.field === 'renterName')).toHaveLength(0);
      });
    });

    it('should reject empty renter name', () => {
      const errors = validateRenterForm({ ...validBaseForm, renterName: '' });
      const matched = errors.filter((e) => e.field === 'renterName');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Renter Name is required.');
    });

    it('should reject renter names with numbers or special characters', () => {
      const invalidChars = ['Jane Doe 123', 'Jane Doe!', 'Jane@Doe'];
      invalidChars.forEach((name) => {
        const errors = validateRenterForm({ ...validBaseForm, renterName: name });
        const matched = errors.filter((e) => e.field === 'renterName');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Renter Name should contain only alphabets and spaces.');
      });
    });

    it('should reject renter name shorter than 3 characters', () => {
      const errors = validateRenterForm({ ...validBaseForm, renterName: 'Jo' });
      const matched = errors.filter((e) => e.field === 'renterName');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Renter Name must be at least 3 characters.');
    });

    it('should reject renter name longer than 100 characters', () => {
      const errors = validateRenterForm({ ...validBaseForm, renterName: 'J'.repeat(101) });
      const matched = errors.filter((e) => e.field === 'renterName');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Renter Name cannot exceed 100 characters.');
    });

    it('should reject same character repeated continuously more than 3 times', () => {
      const repeated = ['jjjjjjjjjj', 'ssssssss', 'aaaaaaa', 'Rahul aaaa Deshmukh'];
      repeated.forEach((name) => {
        const errors = validateRenterForm({ ...validBaseForm, renterName: name });
        const matched = errors.filter((e) => e.field === 'renterName');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Repeated or random characters are not allowed.');
      });
    });

    it('should reject repeated sequence patterns', () => {
      const repeatedSeq = ['abcabcabc', 'qweqwe', 'hahaha', 'qweqwe Deshmukh'];
      repeatedSeq.forEach((name) => {
        const errors = validateRenterForm({ ...validBaseForm, renterName: name });
        const matched = errors.filter((e) => e.field === 'renterName');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Repeated or random characters are not allowed.');
      });
    });

    it('should reject common keyboard patterns', () => {
      const keyboard = ['asdfgh', 'qwerty', 'zxcvbn', 'Rahul qwerty Deshmukh'];
      keyboard.forEach((name) => {
        const errors = validateRenterForm({ ...validBaseForm, renterName: name });
        const matched = errors.filter((e) => e.field === 'renterName');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Please enter a meaningful renter name.');
      });
    });

    it('should reject jjjsssss as repeated or random', () => {
      const errors = validateRenterForm({ ...validBaseForm, renterName: 'jjjsssss' });
      const matched = errors.filter((e) => e.field === 'renterName');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Repeated or random characters are not allowed.');
    });

    it('should reject consonant-only / meaningless spam', () => {
      const spam = ['hsgdf', 'plkjh', 'qwrth'];
      spam.forEach((name) => {
        const errors = validateRenterForm({ ...validBaseForm, renterName: name });
        const matched = errors.filter((e) => e.field === 'renterName');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Please enter a meaningful renter name.');
      });
    });
  });

  describe('Agreement Date Validation', () => {
    it('should allow dates in the current, past, and future years', () => {
      const errorsCurrent = validateRenterForm({
        ...validBaseForm,
        agreementDate: `${currentYear}-05-20`,
      });
      expect(errorsCurrent.filter((e) => e.field === 'agreementDate')).toHaveLength(0);

      const errorsPast = validateRenterForm({
        ...validBaseForm,
        agreementDate: `${currentYear - 1}-12-31`,
      });
      expect(errorsPast.filter((e) => e.field === 'agreementDate')).toHaveLength(0);

      const errorsFuture = validateRenterForm({
        ...validBaseForm,
        agreementDate: `${currentYear + 1}-01-01`,
      });
      expect(errorsFuture.filter((e) => e.field === 'agreementDate')).toHaveLength(0);
    });
  });

  describe('Duration From Date Validation', () => {
    it('should allow from dates within agreement duration', () => {
      const errors = validateRenterForm({
        ...validBaseForm,
        agreementDateFrom: `${currentYear}-06-01`,
        agreementDateTo: `${currentYear + 3}-06-01`,
      });
      expect(errors.filter((e) => e.field === 'agreementDateFrom')).toHaveLength(0);
    });

    it('should reject from dates before agreement date', () => {
      const errors = validateRenterForm({
        ...validBaseForm,
        agreementDate: `${currentYear}-06-15`,
        agreementDateFrom: `${currentYear}-06-01`,
        agreementDateTo: `${currentYear + 1}-06-14`,
      });
      expect(errors.filter((e) => e.field === 'agreementDateFrom')).not.toHaveLength(0);
    });
  });

  describe('Rent Amount Validation', () => {
    it('should allow clean integers and up to 2 decimal places', () => {
      const allowed = ['5000', '5000.5', '5000.55'];
      allowed.forEach((amount) => {
        const errors = validateRenterForm({ ...validBaseForm, rentAmount: amount });
        expect(errors.filter((e) => e.field === 'rentAmount')).toHaveLength(0);
      });
    });

    it('should reject negative values, positive symbols, more than 2 decimals, or non-numeric', () => {
      const rejected = ['-5000', '+5000', '5000.555', '5000a', '0', '-1.50'];
      rejected.forEach((amount) => {
        const errors = validateRenterForm({ ...validBaseForm, rentAmount: amount });
        expect(errors.filter((e) => e.field === 'rentAmount')).not.toHaveLength(0);
      });
    });

    it('should reject Monthly Rent when integer part exceeds 10 digits', () => {
      const errors = validateRenterForm({ ...validBaseForm, rentAmount: '12345678901' });
      const matched = errors.filter((e) => e.field === 'rentAmount');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Monthly Rent cannot exceed 10 digits.');
    });
  });

  describe('Increment Value Validation', () => {
    describe('Percentage Type Increment', () => {
      it('should allow valid numeric percentage values between 0 and 100 inclusive', () => {
        const allowed = ['0', '1', '5', '10', '100'];
        allowed.forEach((val) => {
          const errors = validateRenterForm({
            ...validBaseForm,
            incrementType: 'Percentage',
            incrementValue: val,
          });
          expect(errors.filter((e) => e.field === 'incrementValue')).toHaveLength(0);
        });
      });

      it('should reject non-numeric characters, decimals, negative signs, and letters', () => {
        const rejected = ['-5', '+5', '5.5', '5.50', 'abc', '10a', '10%'];
        rejected.forEach((val) => {
          const errors = validateRenterForm({
            ...validBaseForm,
            incrementType: 'Percentage',
            incrementValue: val,
          });
          const matched = errors.filter((e) => e.field === 'incrementValue');
          expect(matched).not.toHaveLength(0);
          expect(matched[0].message).toBe('Only numeric values are allowed.');
        });
      });

      it('should reject percentage values greater than 3 digits with the correct message', () => {
        const errors = validateRenterForm({
          ...validBaseForm,
          incrementType: 'Percentage',
          incrementValue: '1000',
        });
        const matched = errors.filter((e) => e.field === 'incrementValue');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Maximum 3 digits allowed.');
      });

      it('should reject percentage values greater than 100 with the correct message', () => {
        const errors = validateRenterForm({
          ...validBaseForm,
          incrementType: 'Percentage',
          incrementValue: '101',
        });
        const matched = errors.filter((e) => e.field === 'incrementValue');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Percentage cannot exceed 100.');
      });
    });

    describe('Fixed Type Increment', () => {
      it('should allow clean integers and up to 2 decimal places', () => {
        const allowed = ['5', '5.5', '5.55'];
        allowed.forEach((val) => {
          const errors = validateRenterForm({
            ...validBaseForm,
            incrementType: 'Fixed',
            incrementValue: val,
          });
          expect(errors.filter((e) => e.field === 'incrementValue')).toHaveLength(0);
        });
      });

      it('should reject negative values, positive symbols, or more than 2 decimals', () => {
        const rejected = ['-5', '+5', '5.555', 'abc', '0'];
        rejected.forEach((val) => {
          const errors = validateRenterForm({
            ...validBaseForm,
            incrementType: 'Fixed',
            incrementValue: val,
          });
          const matched = errors.filter((e) => e.field === 'incrementValue');
          expect(matched).not.toHaveLength(0);
          expect(matched[0].message).toBe('Increment Value must be greater than 0.');
        });
      });

      it('should reject Increment Value when integer part exceeds 5 digits', () => {
        const errors = validateRenterForm({
          ...validBaseForm,
          incrementType: 'Fixed',
          incrementValue: '123456',
        });
        const matched = errors.filter((e) => e.field === 'incrementValue');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Increment Value cannot exceed allowed limit.');
      });
    });
  });

  describe('Custom Date Ranges Validation', () => {
    const formWithCustom: RenterFormDataDetails = {
      ...validBaseForm,
      incrementFrequency: 'Custom Date',
      customDateRanges: [
        {
          id: '1',
          fromDate: `${currentYear}-02-01`,
          toDate: `${currentYear}-08-01`,
          incrementType: 'Percentage',
          incrementValue: 10,
          calculationMethod: 'Base Value',
        },
      ],
    };

    it('should pass with valid custom date ranges', () => {
      const errors = validateRenterForm(formWithCustom);
      expect(errors.filter((e) => e.field === 'customDateRanges')).toHaveLength(0);
    });

    it('should reject overlapping custom date ranges on save', () => {
      const invalidForm = {
        ...formWithCustom,
        agreementDateFrom: '2026-05-24',
        agreementDateTo: '2029-02-24',
        customDateRanges: [
          {
            id: '1',
            fromDate: '2026-05-24',
            toDate: '2027-02-27',
            incrementType: 'Percentage' as const,
            incrementValue: 10,
            calculationMethod: 'Base Value' as const,
          },
          {
            id: '2',
            fromDate: '2027-01-01',
            toDate: '2027-03-15',
            incrementType: 'Percentage' as const,
            incrementValue: 5,
            calculationMethod: 'Base Value' as const,
          },
        ],
      };
      const errors = validateRenterForm(invalidForm);
      expect(
        errors.some((e) => e.field === 'customDateRanges' && e.message.includes('overlaps'))
      ).toBe(true);
    });

    it('should reject custom ranges outside agreement duration', () => {
      const invalidForm = {
        ...formWithCustom,
        agreementDateFrom: '2026-05-24',
        agreementDateTo: '2029-02-24',
        customDateRanges: [
          {
            ...formWithCustom.customDateRanges[0],
            fromDate: '2026-05-24',
            toDate: '2029-03-01',
          },
        ],
      };
      const errors = validateRenterForm(invalidForm);
      expect(
        errors.some(
          (e) => e.field === 'customDateRanges' && e.message.includes('within agreement duration')
        )
      ).toBe(true);
    });

    it('should reject custom percentage with non-numeric, negative, or letters with specific message', () => {
      const rejected = ['-5', '5.5', 'abc', '10a'];
      rejected.forEach((val) => {
        const invalidForm = {
          ...formWithCustom,
          customDateRanges: [
            {
              ...formWithCustom.customDateRanges[0],
              incrementType: 'Percentage' as const,
              incrementValue: val as unknown as number,
            },
          ],
        };
        const errors = validateRenterForm(invalidForm);
        const matched = errors.filter((e) => e.field === 'customDateRanges');
        expect(matched).not.toHaveLength(0);
        expect(matched[0].message).toBe('Custom range #1 Only numeric values are allowed.');
      });
    });

    it('should reject custom percentage greater than 3 digits with specific message', () => {
      const invalidForm = {
        ...formWithCustom,
        customDateRanges: [
          {
            ...formWithCustom.customDateRanges[0],
            incrementType: 'Percentage' as const,
            incrementValue: '1000' as unknown as number,
          },
        ],
      };
      const errors = validateRenterForm(invalidForm);
      const matched = errors.filter((e) => e.field === 'customDateRanges');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Custom range #1 Maximum 3 digits allowed.');
    });

    it('should reject custom percentage greater than 100 with specific message', () => {
      const invalidForm = {
        ...formWithCustom,
        customDateRanges: [
          {
            ...formWithCustom.customDateRanges[0],
            incrementType: 'Percentage' as const,
            incrementValue: '101' as unknown as number,
          },
        ],
      };
      const errors = validateRenterForm(invalidForm);
      const matched = errors.filter((e) => e.field === 'customDateRanges');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Custom range #1 Percentage cannot exceed 100.');
    });

    it('should reject custom fixed increment when integer part exceeds 5 digits', () => {
      const invalidForm = {
        ...formWithCustom,
        customDateRanges: [
          {
            ...formWithCustom.customDateRanges[0],
            incrementType: 'Fixed' as const,
            incrementValue: 123456,
          },
        ],
      };
      const errors = validateRenterForm(invalidForm);
      const matched = errors.filter((e) => e.field === 'customDateRanges');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe(
        'Custom range #1 Increment Value cannot exceed allowed limit.'
      );
    });
  });

  describe('Self Declaration Amount Validation', () => {
    it('should allow empty, undefined, or whitespace values', () => {
      const allowed = ['', undefined, '   '];
      allowed.forEach((amount) => {
        const errors = validateRenterForm({ ...validBaseForm, selfDeclarationAmount: amount });
        expect(errors.filter((e) => e.field === 'selfDeclarationAmount')).toHaveLength(0);
      });
    });

    it('should allow clean integers and up to 2 decimal places', () => {
      const allowed = ['5000', '5000.5', '5000.55'];
      allowed.forEach((amount) => {
        const errors = validateRenterForm({ ...validBaseForm, selfDeclarationAmount: amount });
        expect(errors.filter((e) => e.field === 'selfDeclarationAmount')).toHaveLength(0);
      });
    });

    it('should reject negative values, positive symbols, more than 2 decimals, or non-numeric', () => {
      const rejected = ['-5000', '+5000', '5000.555', '5000a', '0', '-1.50'];
      rejected.forEach((amount) => {
        const errors = validateRenterForm({ ...validBaseForm, selfDeclarationAmount: amount });
        expect(errors.filter((e) => e.field === 'selfDeclarationAmount')).not.toHaveLength(0);
      });
    });

    it('should reject Self Declaration Amount when integer part exceeds 10 digits', () => {
      const errors = validateRenterForm({ ...validBaseForm, selfDeclarationAmount: '12345678901' });
      const matched = errors.filter((e) => e.field === 'selfDeclarationAmount');
      expect(matched).not.toHaveLength(0);
      expect(matched[0].message).toBe('Self Declaration cannot exceed 10 digits.');
    });
  });
});
