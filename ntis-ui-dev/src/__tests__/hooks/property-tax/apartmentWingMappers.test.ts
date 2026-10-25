import { describe, it, expect } from 'vitest';
import { mapWingData } from '@/hooks/property-tax/apartment/apartment-wing-mappers';
import { WingWiseDetailsItems } from '@/types/property-tax/apartment';

describe('mapWingData', () => {
  it('should map both wings and commonAmenities into WingData array', () => {
    const mockData: WingWiseDetailsItems = {
      propertyId: 1655111,
      propertyNo: '104',
      wardNo: 'MM8',
      societyId: 18162,
      rateMasterAreaUnit: 'SqMeter',
      wings: [
        {
          wingId: 19,
          wingMasterId: 19,
          wingDetailId: 12174,
          societyId: 18162,
          wingNo: 'S',
          wingName: 'S',
          propertyCount: 20,
          floorRange: 'G-9',
          totalArea: 10484.31,
          collectionPercentage: 0,
          oldDemand: '0',
          currentDemand: '1.75 Crore',
          retroDemand: '2.99 Crore',
          totalDemand: '4.74 Crore',
          revenueImpact: '4.74 Crore',
          revenueImpactPercentage: 0,
          exemptionAppliedAmount: '0',
          exemptedPropertyCount: 0,
          propertyTypes: [
            {
              propertyTypeName: 'Commercial',
              propertyCount: 20,
              totalArea: 10484.31,
              oldDemand: '0',
              currentDemand: '1.75 Crore',
              retroDemand: '2.99 Crore',
              totalDemand: '4.74 Crore',
              totalRevenue: '4.74 Crore',
            },
          ],
        },
      ],
      commonAmenities: [
        {
          wingId: null,
          wingMasterId: null,
          wingDetailId: null,
          societyId: 18162,
          wingNo: 'Common Amenities',
          wingName: 'Common Amenities',
          propertyCount: 13,
          floorRange: 'G-10',
          totalArea: 3325.53,
          collectionPercentage: 0,
          oldDemand: '0',
          currentDemand: '40.32 Lakh',
          retroDemand: '98.86 Lakh',
          totalDemand: '1.39 Crore',
          revenueImpact: '1.39 Crore',
          revenueImpactPercentage: 0,
          revenueImpactDetails: [
            {
              previousRV: '0',
              revisedRV: '29.43 Lakh',
              differenceRV: '29.43 Lakh',
              affectedUnits: 11,
            },
          ],
          exemptionAppliedAmount: '1.39 Crore',
          exemptedPropertyCount: 13,
          propertyTypes: [
            {
              propertyTypeName: 'Amenity',
              propertyCount: 13,
              totalArea: 3325.53,
              oldDemand: '0',
              currentDemand: '40.32 Lakh',
              retroDemand: '98.86 Lakh',
              totalDemand: '1.39 Crore',
              totalRevenue: '1.39 Crore',
            },
          ],
        },
      ],
    };

    const result = mapWingData(mockData);

    expect(result).toHaveLength(2);

    // Wing "S"
    const wingS = result[0];
    expect(wingS.name).toBe('S');
    expect(wingS.letter).toBe('S');
    expect(wingS.isCommonAmenity).toBe(false);
    expect(wingS.stats.props).toBe(20);
    expect(wingS.stats.floors).toBe('G-9');

    expect(wingS.overallTax.to).toBe('4.74 Crore');
    expect(wingS.overallTax.amount).toBe('4.74 Crore');
    expect(wingS.revenueImpact.oldDemand).toBe('0');
    expect(wingS.revenueImpact.currentDemand).toBe('1.75 Crore');
    expect(wingS.revenueImpact.retroDemand).toBe('2.99 Crore');
    expect(wingS.revenueImpact.totalDemand).toBe('4.74 Crore');

    // Common Amenities
    const commonAmenity = result[1];
    expect(commonAmenity.name).toBe('Common Amenities');
    expect(commonAmenity.letter).toBe('CA');
    expect(commonAmenity.isCommonAmenity).toBe(true);
    expect(commonAmenity.stats.props).toBe(13);
    expect(commonAmenity.stats.floors).toBe('G-10');
    expect(commonAmenity.exemption.amount).toBe('1.39 Crore');
    expect(commonAmenity.exemption.count).toBe(13);
    expect(commonAmenity.overallTax.to).toBe('1.39 Crore');
    expect(commonAmenity.overallTax.amount).toBe('1.39 Crore');
    expect(commonAmenity.revenueImpact.oldDemand).toBe('0');
    expect(commonAmenity.revenueImpact.currentDemand).toBe('40.32 Lakh');
    expect(commonAmenity.revenueImpact.retroDemand).toBe('98.86 Lakh');
    expect(commonAmenity.revenueImpact.totalDemand).toBe('1.39 Crore');
  });

  it('should handle empty or null data safely', () => {
    expect(mapWingData(null)).toEqual([]);
    expect(mapWingData(undefined)).toEqual([]);
    expect(mapWingData({ propertyId: 1, propertyNo: '1', wardNo: '1', wings: [] })).toEqual([]);
  });
});
