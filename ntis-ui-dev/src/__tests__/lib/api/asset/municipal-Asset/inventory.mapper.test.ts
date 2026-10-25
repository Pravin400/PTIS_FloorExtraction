import { mapInventoryToUI } from '@/lib/api/asset/municipal-Asset/inventory.mapper';

describe('inventory.mapper', () => {
  it('mapInventoryToUI handles empty data correctly', () => {
    const result = mapInventoryToUI(null);
    expect(result.inventoryItems).toEqual([]);
    expect(result.detailedInventoryItems).toEqual([]);
  });
});
