import { describe, expect, it } from 'vitest';
import {
  collectDualMethodErrors,
} from '@/lib/utils/ptis';
import {
  calculateCapitalTotal,
  getMethodTaxTotal,
  getOldTaxTotal,
  calculateRateableTotal,
  sumTaxAmounts,
} from '@/lib/utils/ptis-calculations';
import {
  getUniqueTaxNames,
  buildComparisonRows,
} from '@/lib/utils/ptis-table-helpers';
import { validatePropertyId } from '@/lib/utils/ptis-normalization';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { DualMethodResponse, DualMethodTaxes } from '@/types/dualMethod.types';
import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { OldDetailsData } from '@/types/ptis.types';

const mockOldDetails = {
  oldZoneName: '',
  oldWardNo: '',
  oldPropertyNo: '',
  oldPartitionNo: '',
  oldEGovernanceNo: '',
  oldPlotArea: '',
  oldPlotNo: '',
  oldRV: '',
  oldCV: '',
  oldALV: '',
  oldPropertyTax: '',
  oldTotalTax: '0',
};

describe('dual method utilities', () => {
  it('sums tax arrays and returns null for invalid inputs', () => {
      const taxes: DualMethodTaxes = [
        { taxId: 1, taxName: 'GENERAL TAX', percentage: 10, amount: 100 },
      ];
      expect(sumTaxAmounts(taxes)).toBe(100);
      expect(sumTaxAmounts(null)).toBeNull();
    });

  it('prefers dual-method totals before fallback values', () => {
    const dualMethodData: DualMethodResponse = {
      oldTaxes: [{ taxId: 1, taxName: 'GENERAL TAX', percentage: 10, amount: 100 }],
      rvTaxes: [{ taxId: 2, taxName: 'GENERAL TAX', percentage: 10, amount: 120 }],
      cvTaxes: [{ taxId: 3, taxName: 'GENERAL TAX', percentage: 10, amount: 150 }],
      retainTaxes: [],
      oldTaxesTotal: 500,
      rvTaxesTotal: 600,
      cvTaxesTotal: 700,
      retainTaxesTotal: 0,
    };

    expect(
      getOldTaxTotal(
        dualMethodData,
        { ...mockOldDetails, oldTotalTax: '200' } as unknown as OldDetailsData
      )
    ).toBe(500);
    expect(getMethodTaxTotal(dualMethodData.rvTaxesTotal, dualMethodData.rvTaxes, 50)).toBe(600);
  });

  it('uses aggregated arrays or fallback totals when server totals are unavailable', () => {
    const taxes: DualMethodTaxes = [{ taxId: 1, taxName: 'TREE TAX', percentage: 5, amount: 75 }];
    expect(getMethodTaxTotal(undefined, taxes, 40)).toBe(75);
    expect(getMethodTaxTotal(undefined, undefined, 40)).toBe(40);
    expect(getMethodTaxTotal(undefined, undefined, undefined)).toBeNull();
  });

  it('computes rateable and capital totals from normalized payloads', () => {
    const rateableData: RateableValueResponse = {
      propertyId: 10,
      financeYear: 2025,
      totalRateableValue: 0,
      totalTax: 250,
      policy: {
        policyCode: '',
        policyDate: '',
        policyYear: 2025,
        policyRVorCVvalue: 0,
        taxTotal: 0,
        taxes: [],
      },
      details: [
        {
          propertyDetailsId: 1,
          floor: 'Ground',
          constructionYear: '2020',
          assessmentYear: '2025',
          constructionType: 'RCC',
          use: 'Residential',
          subTypeOfUse: 'Flat',
          noOfRooms: 2,
          carpetAreaSqFeet: 100,
          carpetAreaSqMeter: 9.2,
          builtupAreaSqFeet: 110,
          builtupAreaSqMeter: 10.2,
          occupancyNumber: 'O1',
          occupancyDate: null,
          renterName: '',
          rentMonthly: 0,
          rentYearly: 0,
          monthlyRate: 0,
          yearlyRate: 0,
          yearlyRent: 0,
          depreciation: 0,
          annualRentalValue: 1000,
          maintenance: 0,
          rateableValue: 2000,
          taxTotal: 250,
          taxes: [],
        },
      ],
    };
    const capitalData: CapitalValueResponse = {
      items: [
        {
          propertyDetailsId: 1,
          propertyId: 10,
          constructionYear: '2020',
          assessmentYear: '2025',
          carpetAreaSqFeet: 100,
          carpetAreaSqMeter: 9.2,
          noOfRooms: 2,
          builtupAreaSqMeter: 10.2,
          builtupAreaSqFeet: 110,
          sdrr: 10,
          baseValue: 20,
          floorFactor: 1,
          ageFactor: 1,
          useFactor: 1,
          capitalValue: 5000,
          taxes: [],
        },
      ],
      totalCapitalValue: 0,
      totalTax: 300,
    };

    // totalRateableValue is explicitly provided by server (0), so it should win over floor sums.
    expect(calculateRateableTotal(rateableData)).toEqual({ rv: 0, tax: 250, alv: 1000 });

    // totalCapitalValue is explicitly provided by server (0), so it should win over item sums.
    expect(calculateCapitalTotal(capitalData)).toEqual({ cv: 0, tax: 300 });
  });

  it('falls back to summing floors/items when server totals are missing', () => {
    const rateableData = {
      propertyId: 10,
      financeYear: 2025,
      policy: {
        policyCode: '',
        policyDate: '',
        policyYear: 2025,
        policyRVorCVvalue: 0,
        taxTotal: 0,
        taxes: [{ taxId: 1, taxName: 'GENERAL TAX', percentage: 0, amount: 111 }],
      },
      details: [
        {
          propertyDetailsId: 1,
          floor: 'Ground',
          constructionYear: '2020',
          assessmentYear: '2025',
          constructionType: 'RCC',
          use: 'Residential',
          subTypeOfUse: 'Flat',
          noOfRooms: 2,
          carpetAreaSqFeet: 100,
          carpetAreaSqMeter: 9.2,
          builtupAreaSqFeet: 110,
          builtupAreaSqMeter: 10.2,
          occupancyNumber: 'O1',
          occupancyDate: null,
          renterName: '',
          rentMonthly: 0,
          rentYearly: 0,
          monthlyRate: 0,
          yearlyRate: 0,
          yearlyRent: 0,
          depreciation: 0,
          annualRentalValue: 1000,
          maintenance: 0,
          rateableValue: 2000,
          taxTotal: 250,
          taxes: [],
        },
      ],
    } as unknown as RateableValueResponse;

    const capitalData = {
      items: [
        {
          propertyDetailsId: 1,
          propertyId: 10,
          constructionYear: '2020',
          assessmentYear: '2025',
          carpetAreaSqFeet: 100,
          carpetAreaSqMeter: 9.2,
          noOfRooms: 2,
          builtupAreaSqMeter: 10.2,
          builtupAreaSqFeet: 110,
          sdrr: 10,
          baseValue: 20,
          floorFactor: 1,
          ageFactor: 1,
          useFactor: 1,
          capitalValue: 5000,
          taxes: [{ taxId: 1, taxName: 'GENERAL TAX', percentage: 0, amount: 300 }],
        },
      ],
      // totals omitted
      totalCapitalValue: undefined,
      totalTax: undefined,
    } as unknown as CapitalValueResponse;

    expect(calculateRateableTotal(rateableData)).toEqual({ rv: 2000, tax: 250, alv: 1000 });
    expect(calculateCapitalTotal(capitalData)).toEqual({ cv: 5000, tax: 300 });
  });

  it('merges unique error messages for toast display', () => {
    expect(
      collectDualMethodErrors('Dual failed', 'Rateable failed', 'Dual failed')
    ).toBe('Dual failed | Rateable failed');
    expect(collectDualMethodErrors(undefined, undefined, undefined)).toBeNull();
  });

  describe('getUniqueTaxNames', () => {
    it('extracts unique tax names in insertion/API order', () => {
      const dualMethodData: DualMethodResponse = {
        oldTaxes: [{ taxId: 1, taxName: 'B', percentage: 0, amount: 0 }],
        rvTaxes: [{ taxId: 2, taxName: 'A', percentage: 0, amount: 0 }],
        cvTaxes: [{ taxId: 3, taxName: 'C', percentage: 0, amount: 0 }],
        retainTaxes: [{ taxId: 4, taxName: 'A', percentage: 0, amount: 0 }],
      };
      expect(getUniqueTaxNames(dualMethodData)).toEqual(['B', 'A', 'C']);
    });

    it('returns empty array if no data', () => {
      expect(getUniqueTaxNames(null)).toEqual([]);
    });
  });

  describe('buildComparisonRows', () => {
    it('builds correct rows for the table', () => {
      const dualMethodData: DualMethodResponse = {
        oldTaxes: [],
        rvTaxes: [{ taxId: 1, taxName: 'Tax1', percentage: 0, amount: 100 }],
        cvTaxes: [],
        retainTaxes: [],
        rvTaxesTotal: 100,
      };
      const taxNames = ['Tax1', 'Tax2'];
      const labels = [
        { id: 'rv', key: 'rvTaxes' as keyof DualMethodResponse, label: 'RV', color: 'blue' },
      ];

      const rows = buildComparisonRows(dualMethodData, taxNames, labels);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        id: 'rv',
        label: 'RV',
        totalTax: 100,
        colorClass: 'blue',
        tax_tax1: 100,
        tax_tax2: 0,
      });
    });

    it('returns empty array if no data', () => {
      expect(buildComparisonRows(null, [], [])).toEqual([]);
    });

    it('aggregates duplicate tax names per method row', () => {
      const dualMethodData: DualMethodResponse = {
        oldTaxes: [],
        rvTaxes: [
          { taxId: 1, taxName: 'GENERAL TAX', percentage: 0, amount: 40 },
          { taxId: 2, taxName: 'GENERAL TAX', percentage: 0, amount: 60 },
        ],
        cvTaxes: [],
        retainTaxes: [],
      };
      const labels = [
        { id: 'rv', key: 'rvTaxes' as keyof DualMethodResponse, label: 'RV', color: 'blue' },
      ];

      const rows = buildComparisonRows(dualMethodData, ['GENERAL TAX'], labels);
      expect(rows).toHaveLength(1);
      expect(rows[0].tax_general_tax).toBe(100);
      expect(rows[0].totalTax).toBe(100);
    });
  });

  describe('getOldTaxTotal', () => {

    it('should return 0 when both dualMethodData and oldTotalTax are null', () => {
      expect(getOldTaxTotal(null, { ...mockOldDetails, oldTotalTax: '0' })).toBe(0);
    });

    it('should prefer dualMethodData.oldTaxesTotal if available', () => {
      const dualData: DualMethodResponse = {
        oldTaxes: [],
        rvTaxes: [],
        cvTaxes: [],
        retainTaxes: [],
        oldTaxesTotal: 500,
      };
      expect(getOldTaxTotal(dualData, { ...mockOldDetails, oldTotalTax: '100' })).toBe(500);
    });

    it('should fallback to oldTotalTax if dualMethodData is missing oldTaxesTotal', () => {
      expect(getOldTaxTotal(null, { ...mockOldDetails, oldTotalTax: '250' })).toBe(250);
    });
  });

  describe('sumTaxAmounts', () => {
    it('should return sum of tax amounts', () => {
      const taxes = [
        { taxId: 1, taxName: 'T1', percentage: 0, amount: 10 },
        { taxId: 2, taxName: 'T2', percentage: 0, amount: 20 },
      ] as DualMethodTaxes;
      expect(sumTaxAmounts(taxes)).toBe(30);
    });

    it('should return null if taxes is not an array', () => {
      expect(sumTaxAmounts(null)).toBeNull();
    });
  });

  describe('validatePropertyId', () => {
    it('accepts positive integer ids', () => {
      expect(validatePropertyId(42)).toBe(42);
      expect(validatePropertyId('42')).toBe(42);
      expect(validatePropertyId(' 42 ')).toBe(42);
    });

    it('rejects malformed numeric strings', () => {
      expect(validatePropertyId('123abc')).toBeNull();
      expect(validatePropertyId('1e2')).toBeNull();
      expect(validatePropertyId('1.5')).toBeNull();
      expect(validatePropertyId('')).toBeNull();
      expect(validatePropertyId('   ')).toBeNull();
    });

    it('rejects non-positive and non-integer values', () => {
      expect(validatePropertyId(0)).toBeNull();
      expect(validatePropertyId(-1)).toBeNull();
      expect(validatePropertyId(1.2)).toBeNull();
    });
  });
});
