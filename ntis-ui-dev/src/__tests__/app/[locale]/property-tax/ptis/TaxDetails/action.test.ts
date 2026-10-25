import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRateableTaxDetails, getCapitalTaxDetails } from '@/app/[locale]/property-tax/ptis/TaxDetails/action';
import * as taxDetailsService from '@/lib/api/ptis/ptisMain-taxdetails/taxDetails.service';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';

// Mock the service layer
vi.mock('@/lib/api/ptis/ptisMain-taxdetails/taxDetails.service');

describe('TaxDetails Server Actions - Input Validation', () => {
  const mockTaxData: TaxDetailsData = {
    propertyId: 12345,
    policies: [
      {
        policyCode: 'NETTAX',
        taxAmounts: [
          { taxName: 'General Tax', taxAmount: 5000 },
        ],
        taxTotal: 5000,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRateableTaxDetails', () => {
    describe('Valid Input', () => {
      it('should accept valid numeric property ID', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsByPropertyId).mockResolvedValue(mockTaxData);

        const result = await getRateableTaxDetails(12345);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTaxData);
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).toHaveBeenCalledWith(12345);
      });

      it('should accept valid string property ID', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsByPropertyId).mockResolvedValue(mockTaxData);

        const result = await getRateableTaxDetails('12345');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTaxData);
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).toHaveBeenCalledWith(12345);
      });

      it('should accept string property ID with whitespace', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsByPropertyId).mockResolvedValue(mockTaxData);

        const result = await getRateableTaxDetails('  12345  ');

        expect(result.success).toBe(true);
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).toHaveBeenCalledWith(12345);
      });

      it('should accept maximum valid property ID', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsByPropertyId).mockResolvedValue(mockTaxData);

        const result = await getRateableTaxDetails(2147483647); // Max 32-bit int

        expect(result.success).toBe(true);
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).toHaveBeenCalledWith(2147483647);
      });
    });

    describe('Invalid Input', () => {
      it('should reject undefined property ID', async () => {
        const result = await getRateableTaxDetails(undefined as unknown as number);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Property ID is required');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject null property ID', async () => {
        const result = await getRateableTaxDetails(null as unknown as number);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Property ID is required');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject empty string property ID', async () => {
        const result = await getRateableTaxDetails('');

        expect(result.success).toBe(false);
        expect(result.error).toContain('cannot be empty');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject whitespace-only property ID', async () => {
        const result = await getRateableTaxDetails('   ');

        expect(result.success).toBe(false);
        expect(result.error).toContain('cannot be empty');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject negative property ID', async () => {
        const result = await getRateableTaxDetails(-123);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid property ID format');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject zero property ID', async () => {
        const result = await getRateableTaxDetails(0);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid property ID format');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject decimal property ID', async () => {
        const result = await getRateableTaxDetails(123.45);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid property ID format');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject non-numeric string', async () => {
        const result = await getRateableTaxDetails('abc123');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid property ID format');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject property ID with special characters', async () => {
        const result = await getRateableTaxDetails('123-45');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid property ID format');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject property ID exceeding maximum value', async () => {
        const result = await getRateableTaxDetails(2147483648); // Max + 1

        expect(result.success).toBe(false);
        expect(result.error).toContain('exceeds maximum allowed value');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject extremely large property ID', async () => {
        const result = await getRateableTaxDetails(9999999999999);

        expect(result.success).toBe(false);
        expect(result.error).toContain('exceeds maximum allowed value');
        expect(taxDetailsService.getPtisMainTaxDetailsByPropertyId).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsByPropertyId).mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await getRateableTaxDetails(12345);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('getCapitalTaxDetails', () => {
    describe('Valid Input', () => {
      it('should accept valid numeric property ID', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).mockResolvedValue(mockTaxData);

        const result = await getCapitalTaxDetails(12345);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockTaxData);
        expect(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).toHaveBeenCalledWith(12345);
      });

      it('should accept valid string property ID', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).mockResolvedValue(mockTaxData);

        const result = await getCapitalTaxDetails('67890');

        expect(result.success).toBe(true);
        expect(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).toHaveBeenCalledWith(67890);
      });
    });

    describe('Invalid Input', () => {
      it('should reject undefined property ID', async () => {
        const result = await getCapitalTaxDetails(undefined as unknown as number);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Property ID is required');
        expect(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject null property ID', async () => {
        const result = await getCapitalTaxDetails(null as unknown as number);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Property ID is required');
        expect(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject empty string', async () => {
        const result = await getCapitalTaxDetails('');

        expect(result.success).toBe(false);
        expect(result.error).toContain('cannot be empty');
        expect(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject negative property ID', async () => {
        const result = await getCapitalTaxDetails(-456);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid property ID format');
        expect(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).not.toHaveBeenCalled();
      });

      it('should reject property ID exceeding maximum', async () => {
        const result = await getCapitalTaxDetails(3000000000);

        expect(result.success).toBe(false);
        expect(result.error).toContain('exceeds maximum allowed value');
        expect(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        vi.mocked(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).mockRejectedValue(
          new Error('API timeout')
        );

        const result = await getCapitalTaxDetails(12345);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('Consistency Between Actions', () => {
    it('should have consistent validation for both actions', async () => {
      const testCases = [
        { input: undefined, shouldFail: true },
        { input: null, shouldFail: true },
        { input: '', shouldFail: true },
        { input: 0, shouldFail: true },
        { input: -1, shouldFail: true },
        { input: 12345, shouldFail: false },
        { input: '12345', shouldFail: false },
      ];

      for (const testCase of testCases) {
        const rateableResult = await getRateableTaxDetails(testCase.input as unknown as string | number);
        const capitalResult = await getCapitalTaxDetails(testCase.input as unknown as string | number);

        if (testCase.shouldFail) {
          expect(rateableResult.success).toBe(false);
          expect(capitalResult.success).toBe(false);
        } else {
          // Mock successful responses for valid inputs
          vi.mocked(taxDetailsService.getPtisMainTaxDetailsByPropertyId).mockResolvedValue(mockTaxData);
          vi.mocked(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).mockResolvedValue(mockTaxData);
        }
      }
    });
  });
});
