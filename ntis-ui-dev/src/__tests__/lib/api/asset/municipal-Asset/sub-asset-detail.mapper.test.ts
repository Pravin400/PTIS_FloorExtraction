import { describe, it, expect } from 'vitest';
import { mapSubAssetToUI } from '@/lib/api/asset/municipal-Asset/sub-asset-detail.mapper';
import type { SubAssetApiResponse } from '@/types/asset/municipal-Asset/sub-asset-detail-api.types';

describe('mapSubAssetToUI', () => {
  it('maps raw API response to UI data correctly', () => {
    const mockApiResponse: Partial<SubAssetApiResponse> = {
      assetId: 999,
      shopUnitName: 'S-01',
      typeOfUseName: 'Commercial',
      parentAssetId: 100,
      parentAssetName: 'Main Plaza',
    };

    const result = mapSubAssetToUI(mockApiResponse as SubAssetApiResponse);

    expect(result.subAssetId).toBe('999');
    expect(result.shopName).toBe('S-01');
    expect(result.subAssetUsage).toBe('Commercial');
    expect(result.parentAssetId).toBe('100');
    expect(result.parentAssetName).toBe('Main Plaza');
  });

  it('provides safe fallbacks for missing data', () => {
    const mockApiResponse: Partial<SubAssetApiResponse> = {
      assetId: 555,
    };

    const result = mapSubAssetToUI(mockApiResponse as SubAssetApiResponse);

    expect(result.subAssetId).toBe('555');
    expect(result.shopName).toBe('-');
    expect(result.parentAssetId).toBe('');
  });
});
