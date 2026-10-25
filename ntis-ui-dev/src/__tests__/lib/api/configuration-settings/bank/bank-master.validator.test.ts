import { describe, it, expect } from 'vitest';
import { validateBankMaster } from '@/lib/api/configuration-settings/bank/bank-master.validator';
import type { BankMasterFormData } from '@/types/bank-master.types';

describe('validateBankMaster - Pincode Validation', () => {
  const baseValidData: BankMasterFormData = {
    bankCode: 'SBI001',
    bankName: 'State Bank of India',
    branchName: 'Main Branch',
    ifscCode: 'SBIN0000001',
    address: 'Amravati Road',
    city: 'Amravati',
    state: 'Maharashtra',
    pincode: '444600',
    isActive: true,
  };

  it('should accept a valid 6-digit Indian pincode starting with a non-zero digit', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      pincode: '444600',
    };
    const errors = validateBankMaster(data);
    expect(errors.pincode).toBeUndefined();
  });

  it('should reject a pincode of all zeros (000000)', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      pincode: '000000',
    };
    const errors = validateBankMaster(data);
    expect(errors.pincode).toBe('pincodeFormat');
  });

  it('should reject a pincode starting with zero (e.g. 012345)', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      pincode: '012345',
    };
    const errors = validateBankMaster(data);
    expect(errors.pincode).toBe('pincodeFormat');
  });

  it('should reject a pincode with fewer than 6 digits', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      pincode: '44460',
    };
    const errors = validateBankMaster(data);
    expect(errors.pincode).toBe('pincodeFormat');
  });

  it('should reject a pincode with more than 6 digits', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      pincode: '4446001',
    };
    const errors = validateBankMaster(data);
    expect(errors.pincode).toBe('pincodeFormat');
  });

  it('should reject a pincode containing non-numeric characters', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      pincode: '44460a',
    };
    const errors = validateBankMaster(data);
    expect(errors.pincode).toBe('pincodeFormat');
  });
});

describe('validateBankMaster - Address Validation', () => {
  const baseValidData: BankMasterFormData = {
    bankCode: 'SBI001',
    bankName: 'State Bank of India',
    branchName: 'Main Branch',
    ifscCode: 'SBIN0000001',
    address: 'Amravati Road',
    city: 'Amravati',
    state: 'Maharashtra',
    pincode: '444600',
    isActive: true,
  };

  it('should accept a valid address with alphanumeric and basic punctuation', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      address: 'Amravati Road, Block 4-A/B (Near Central Mall) & State Bank Lane',
    };
    const errors = validateBankMaster(data);
    expect(errors.address).toBeUndefined();
  });

  it('should reject an address containing invalid special characters', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      address: 'Amravati Road!@#$%',
    };
    const errors = validateBankMaster(data);
    expect(errors.address).toBe('addressFormat');
  });
});

describe('validateBankMaster - Bank details mismatch validation', () => {
  const baseValidData: BankMasterFormData = {
    bankCode: 'SBI001',
    bankName: 'State Bank of India',
    branchName: 'Main Branch',
    ifscCode: 'SBIN0000001',
    address: 'Amravati Road',
    city: 'Amravati',
    state: 'Maharashtra',
    pincode: '444600',
    isActive: true,
  };

  it('should accept matching details for known bank (e.g. SBI/SBIN)', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      bankCode: 'SBI001',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0000001',
    };
    const errors = validateBankMaster(data);
    expect(errors.ifscCode).toBeUndefined();
  });

  it('should reject mismatched details for known bank (e.g. SBI Code, HDFC Name, SBIN IFSC)', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      bankCode: 'SBI001',
      bankName: 'HDFC Bank',
      ifscCode: 'SBIN0000001',
    };
    const errors = validateBankMaster(data);
    expect(errors.ifscCode).toBe('bankMismatch');
  });

  it('should reject mismatched details for different known banks (e.g. SBI Code, SBI Name, HDFC IFSC)', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      bankCode: 'SBI001',
      bankName: 'State Bank of India',
      ifscCode: 'HDFC0000001',
    };
    const errors = validateBankMaster(data);
    expect(errors.ifscCode).toBe('bankMismatch');
  });

  it('should accept custom test inputs with fuzzy prefix matching', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      bankCode: 'ABCD001',
      bankName: 'ABCD Cooperative Bank',
      ifscCode: 'ABCD0001234',
    };
    const errors = validateBankMaster(data);
    expect(errors.ifscCode).toBeUndefined();
  });

  it('should reject mismatched details for custom/cooperative bank prefixes', () => {
    const data: BankMasterFormData = {
      ...baseValidData,
      bankCode: 'WXYZ001',
      bankName: 'WXYZ Bank',
      ifscCode: 'ABCD0001234',
    };
    const errors = validateBankMaster(data);
    expect(errors.ifscCode).toBe('bankMismatch');
  });
});
