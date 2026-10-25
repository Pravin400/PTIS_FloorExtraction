import { describe, it, expect } from 'vitest';
import {
  parseSafeIsoDate,
  resolveInventoryIds,
  buildInventoryBatchApiPayload,
  validateInventoryQuantity,
  validateInventoryUnitValue,
} from '@/lib/utils/asset-utils/new-add-new-asset/inventory-batch-payload.utils';

describe('inventory-batch-payload.utils', () => {
  describe('parseSafeIsoDate', () => {
    it('returns undefined for undefined, null, or empty string', () => {
      expect(parseSafeIsoDate(undefined)).toBeUndefined();
      expect(parseSafeIsoDate(null)).toBeUndefined();
      expect(parseSafeIsoDate('')).toBeUndefined();
      expect(parseSafeIsoDate('   ')).toBeUndefined();
    });

    it('parses valid ISO and YYYY-MM-DD date strings without fabricating timestamp', () => {
      const result = parseSafeIsoDate('2025-05-15');
      expect(result).toBeDefined();
      expect(result?.startsWith('2025-05-15')).toBe(true);
    });

    it('parses valid DD/MM/YYYY date strings correctly', () => {
      const result = parseSafeIsoDate('25/12/2024');
      expect(result).toBeDefined();
      expect(result?.startsWith('2024-12-25')).toBe(true);
    });

    it('returns undefined for impossible or invalid dates', () => {
      expect(parseSafeIsoDate('invalid-date')).toBeUndefined();
      expect(parseSafeIsoDate('32/01/2024')).toBeUndefined();
      expect(parseSafeIsoDate('29/02/2023')).toBeUndefined(); // Non-leap year
    });
  });

  describe('validateInventoryQuantity', () => {
    it('accepts valid positive integers', () => {
      expect(validateInventoryQuantity(1).isValid).toBe(true);
      expect(validateInventoryQuantity(100).value).toBe(100);
      expect(validateInventoryQuantity('5').value).toBe(5);
    });

    it('rejects zero, negative, decimal, NaN, and extreme quantities', () => {
      expect(validateInventoryQuantity(0).isValid).toBe(false);
      expect(validateInventoryQuantity(-5).isValid).toBe(false);
      expect(validateInventoryQuantity(2.5).isValid).toBe(false);
      expect(validateInventoryQuantity('invalid').isValid).toBe(false);
      expect(validateInventoryQuantity(15000).isValid).toBe(false);
    });
  });

  describe('validateInventoryUnitValue', () => {
    it('accepts zero and positive values', () => {
      expect(validateInventoryUnitValue(0).isValid).toBe(true);
      expect(validateInventoryUnitValue(1500).value).toBe(1500);
      expect(validateInventoryUnitValue('250.50').value).toBe(250.5);
    });

    it('rejects negative numbers and non-numeric values', () => {
      expect(validateInventoryUnitValue(-10).isValid).toBe(false);
      expect(validateInventoryUnitValue('invalid').isValid).toBe(false);
    });
  });

  describe('resolveInventoryIds', () => {
    const categories = [
      { id: 10, typeName: 'Furniture' },
      { id: 20, typeName: 'IT Equipment' },
    ];
    const itemNames = [
      { id: 101, subTypeName: 'Office Chair', categoryId: 10 },
      { id: 102, subTypeName: 'Executive Desk', categoryId: 10 },
      { id: 201, subTypeName: 'Laptop', categoryId: 20 },
    ];
    const itemModels = [
      { id: 1001, modelName: 'ErgoComfort Plus', itemId: 101 },
      { id: 2001, modelName: 'ThinkPad X1', itemId: 201 },
    ];
    const conditions = [
      { id: 1, conditionName: 'Good', conditionFactor: 1.0 },
      { id: 2, conditionName: 'Damaged', conditionFactor: 0.2 },
    ];
    const departments = [
      { id: 5, label: 'Admin', value: 'admin' },
      { id: 6, label: 'IT Department', value: 'it' },
    ];

    it('resolves valid hierarchical ids accurately', () => {
      const result = resolveInventoryIds(
        {
          category: 'Furniture',
          itemName: 'Office Chair',
          modelName: 'ErgoComfort Plus',
          condition: 'Good',
          owningDepartment: 'Admin',
        },
        categories,
        itemNames,
        itemModels,
        conditions,
        departments
      );

      expect(result.c).toBe(10);
      expect(result.n).toBe(101);
      expect(result.m).toBe(1001);
      expect(result.cond?.id).toBe(1);
      expect(result.d).toBe(5);
      expect(result.isValid).toBe(true);
    });

    it('prioritizes direct numeric IDs when matching valid hierarchy', () => {
      const result = resolveInventoryIds(
        {
          itemCategoryId: 20,
          itemId: 201,
          inventoryItemModelId: 2001,
          inventoryItemConditionId: 2,
          owningDepartmentId: 6,
        },
        categories,
        itemNames,
        itemModels,
        conditions,
        departments
      );

      expect(result.c).toBe(20);
      expect(result.n).toBe(201);
      expect(result.m).toBe(2001);
      expect(result.cond?.id).toBe(2);
      expect(result.d).toBe(6);
      expect(result.isValid).toBe(true);
    });

    it('rejects direct Item ID when it does not belong to the selected Category', () => {
      const result = resolveInventoryIds(
        {
          itemCategoryId: 10, // Furniture
          itemId: 201, // Laptop (belongs to IT Equipment 20)
        },
        categories,
        itemNames,
        itemModels,
        conditions,
        departments
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not belong to the selected Category');
    });

    it('rejects direct Model ID when it does not belong to the selected Item', () => {
      const result = resolveInventoryIds(
        {
          itemCategoryId: 10,
          itemId: 101, // Office Chair
          inventoryItemModelId: 2001, // ThinkPad X1 (belongs to Laptop 201)
        },
        categories,
        itemNames,
        itemModels,
        conditions,
        departments
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not belong to the selected Item');
    });

    it('does NOT silently fallback to first condition or department when unmatched', () => {
      const result = resolveInventoryIds(
        {
          category: 'Unknown Category',
          itemName: 'Unknown Item',
          condition: 'NonExistentCondition',
          owningDepartment: 'NonExistentDepartment',
        },
        categories,
        itemNames,
        itemModels,
        conditions,
        departments
      );

      expect(result.c).toBe(0);
      expect(result.n).toBe(0);
      expect(result.m).toBe(0);
      expect(result.cond).toBeUndefined();
      expect(result.d).toBe(0);
    });
  });

  describe('buildInventoryBatchApiPayload', () => {
    it('creates payload accurately for valid inputs', () => {
      const payload = buildInventoryBatchApiPayload(
        999,
        {
          c: 10,
          n: 101,
          m: 1001,
          cond: { id: 2, conditionFactor: 0.2 },
          d: 5,
        },
        {
          quantity: 3,
          unitValue: 1500,
          purchaseDate: '2024-01-10',
          specifications: 'Black ergonomic mesh',
        }
      );

      expect(payload.parentAssetId).toBe(999);
      expect(payload.inventoryItemCategoryId).toBe(10);
      expect(payload.inventoryItemNameId).toBe(101);
      expect(payload.inventoryItemModelId).toBe(1001);
      expect(payload.quantity).toBe(3);
      expect(payload.unitValue).toBe(1500);
      expect(payload.units).toHaveLength(3);
      expect(payload.units[0].conditionFactor).toBe(0.2);
      expect(payload.units[0].inventoryItemConditionId).toBe(2);
    });

    it('throws an error for invalid quantity instead of silently converting to 1', () => {
      expect(() =>
        buildInventoryBatchApiPayload(
          999,
          { c: 10, n: 101, m: 0, cond: null, d: 0 },
          { quantity: -5, unitValue: 100 }
        )
      ).toThrowError(/Quantity must be greater than zero/);

      expect(() =>
        buildInventoryBatchApiPayload(
          999,
          { c: 10, n: 101, m: 0, cond: null, d: 0 },
          { quantity: 0, unitValue: 100 }
        )
      ).toThrowError(/Quantity must be greater than zero/);

      expect(() =>
        buildInventoryBatchApiPayload(
          999,
          { c: 10, n: 101, m: 0, cond: null, d: 0 },
          { quantity: 2.5, unitValue: 100 }
        )
      ).toThrowError(/Quantity must be a valid whole integer/);
    });

    it('throws an error for negative unit value', () => {
      expect(() =>
        buildInventoryBatchApiPayload(
          999,
          { c: 10, n: 101, m: 0, cond: null, d: 0 },
          { quantity: 2, unitValue: -50 }
        )
      ).toThrowError(/Unit value cannot be negative/);
    });

    it('throws an error when hierarchy error is passed in ids', () => {
      expect(() =>
        buildInventoryBatchApiPayload(
          999,
          {
            c: 10,
            n: 201,
            m: 0,
            cond: null,
            d: 0,
            isValid: false,
            error: 'Item does not belong to category',
          },
          { quantity: 2, unitValue: 100 }
        )
      ).toThrowError(/Inventory hierarchy validation failed/);
    });
  });
});
