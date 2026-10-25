import { mapAssetMasterToUI } from '@/lib/api/asset/municipal-Asset/master.mapper';
import type { ApiAssetMasterResponse } from '@/types/asset/municipal-Asset/asset-detail-api.types';

describe('master.mapper', () => {
  it('mapAssetMasterToUI falls back safely on empty payload', () => {
    const mockDTO = {} as ApiAssetMasterResponse;
    const result = mapAssetMasterToUI(mockDTO);
    
    expect(result).toBeDefined();
  });
});
