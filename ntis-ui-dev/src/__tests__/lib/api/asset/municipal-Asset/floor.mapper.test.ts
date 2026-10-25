import { mapFloorDetailsToUI } from '@/lib/api/asset/municipal-Asset/floor.mapper';
import type { ApiFloorMasterItem } from '@/types/asset/municipal-Asset/asset-detail-api.types';

describe('floor.mapper', () => {
  it('mapFloorDetailsToUI handles empty data correctly', () => {
    const result = mapFloorDetailsToUI([] as ApiFloorMasterItem[]);
    expect(result).toEqual([]);
  });
});
