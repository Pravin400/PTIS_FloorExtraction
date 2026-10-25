import { describe, it, expect } from 'vitest';
import { validatePaymentMode } from '@/lib/validations/payment-mode';
import type { PaymentModeFormData } from '@/types/paymentMode.types';

describe('validatePaymentMode', () => {
  const mockT = (key: string) => key;

  const validData: PaymentModeFormData = {
    code: 'CARD01',
    paymentModeName: 'Credit Card',
    type: 'Card',
    category: 'Card',
    description: 'Standard credit card payment',
    chargeType: 'Fixed',
    transactionCharge: 10.50,
    isActive: true,
  };

  it('passes validation with valid data', () => {
    const errors = validatePaymentMode(validData, mockT);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('requires code', () => {
    const data = { ...validData, code: '   ' };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.code).toBe('form.validation.codeRequired');
  });

  it('enforces maximum length on code', () => {
    const data = { ...validData, code: 'A'.repeat(21) };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.code).toBe('form.validation.codeMaxLength');
  });

  it('enforces regex format on code', () => {
    const data = { ...validData, code: 'CARD-01' };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.code).toBe('form.validation.codeInvalidResult');
  });

  it('requires paymentModeName', () => {
    const data = { ...validData, paymentModeName: '   ' };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.paymentModeName).toBe('form.validation.nameRequired');
  });

  it('enforces maximum length on paymentModeName', () => {
    const data = { ...validData, paymentModeName: 'A'.repeat(51) };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.paymentModeName).toBe('form.validation.nameMaxLength');
  });

  it('enforces maximum length on description', () => {
    const data = { ...validData, description: 'A'.repeat(201) };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.description).toBe('form.validation.descriptionMaxLength');
  });

  it('validates negative fixed charge', () => {
    const data = { ...validData, chargeType: 'Fixed' as const, transactionCharge: -5.0 };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.transactionCharge).toBe('form.validation.chargeNegative');
  });

  it('validates negative percentage charge', () => {
    const data = { ...validData, chargeType: 'Percentage' as const, transactionCharge: -0.5 };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.transactionCharge).toBe('form.validation.chargePercentageRange');
  });

  it('validates percentage charge greater than 100', () => {
    const data = { ...validData, chargeType: 'Percentage' as const, transactionCharge: 100.5 };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.transactionCharge).toBe('form.validation.chargePercentageRange');
  });

  it('validates non-zero charge when chargeType is None', () => {
    const data = { ...validData, chargeType: 'None' as const, transactionCharge: 10.0 };
    const errors = validatePaymentMode(data, mockT);
    expect(errors.transactionCharge).toBe('form.validation.chargeNoneInvalid');
  });
});
