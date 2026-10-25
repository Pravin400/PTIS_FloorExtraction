import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  useMunicipalAssetDashboard, 
  deriveCategories, 
  deriveTypesByCategory 
} from '@/hooks/asset/municipal-Asset/useMunicipalAssetDashboard';
import type { DashboardStatsResponse, AssetCategory, AssetType } from '@/types/asset/municipal-Asset/municipal-asset.types';

const mockStats: DashboardStatsResponse = {
  totalAssets: 100,
  totalCategories: 2,
  categoryStats: [
    {
      categoryId: 1,
      categoryName: 'Buildings',
      totalCategoryItem: 50,
      registeredAssets: 40,
      totalValue: 100000,
      assetTypeStats: []
    }
  ]
};

const mockCategories: AssetCategory[] = [
  { id: 1, categoryName: 'Buildings', isActive: true, isMovable: false } as AssetCategory,
  { id: 2, categoryName: 'Land', isActive: true, isMovable: false } as AssetCategory
];

const mockTypes: AssetType[] = [
  { id: 10, typeName: 'Office', categoryId: 1, isActive: true } as AssetType,
  { id: 11, typeName: 'School', categoryId: 1, isActive: false } as AssetType
];

describe('useMunicipalAssetDashboard (Pure Functions)', () => {
  describe('deriveCategories', () => {
    it('should return empty array if masterCategories is empty', () => {
      expect(deriveCategories([], null)).toEqual([]);
    });

    it('should derive minimal categories correctly from masters', () => {
      const categories = deriveCategories(mockCategories, mockStats);
      expect(categories).toHaveLength(2);
      expect(categories[0].id).toBe(1);
      expect(categories[0].categoryName).toBe('Buildings');
      expect(categories[0].categoryCode).toBe('CAT-1');
      expect(categories[0].isActive).toBe(true);
    });
  });

  describe('deriveTypesByCategory', () => {
    it('should return empty object if masterTypes is empty', () => {
      expect(deriveTypesByCategory([])).toEqual({});
    });

    it('should derive types by category map from masterTypes', () => {
      const typesMap = deriveTypesByCategory(mockTypes);
      expect(Object.keys(typesMap)).toHaveLength(1);
      
      expect(typesMap[1]).toHaveLength(1);
      expect(typesMap[1][0].id).toBe(10);
      expect(typesMap[1][0].assetTypeName).toBe('Office');
      expect(typesMap[1][0].assetCategoryId).toBe(1);
    });
  });
});

describe('useMunicipalAssetDashboard (Hook)', () => {
  it('should initialize state correctly', () => {
    const { result } = renderHook(() => useMunicipalAssetDashboard(mockStats, mockCategories, mockTypes));

    expect(result.current.categories).toHaveLength(2);
    expect(result.current.dashboardStats).toEqual(mockStats);
    expect(result.current.selectedAssetType).toBeNull();
    
    // visibleExamples initializes to 5 per category
    expect(result.current.visibleExamples).toEqual({ '1': 5, '2': 5 });
  });

  it('should allow updating visible examples', () => {
    const { result } = renderHook(() => useMunicipalAssetDashboard(mockStats, mockCategories, mockTypes));
    
    act(() => {
      result.current.setVisibleExamples((prev) => ({ ...prev, '1': 10 }));
    });

    expect(result.current.visibleExamples).toEqual({ '1': 10, '2': 5 });
  });

  it('should allow setting selected asset type', () => {
    const { result } = renderHook(() => useMunicipalAssetDashboard(mockStats, mockCategories, mockTypes));
    
    act(() => {
      result.current.setSelectedAssetType({ id: 10, name: 'Office', assetCategoryId: 1, isActive: true } as unknown as import('@/types/asset/municipal-Asset/municipal-asset.types').AssetType);
    });

    expect(result.current.selectedAssetType).not.toBeNull();
    expect(result.current.selectedAssetType?.id).toBe(10);
  });
});
