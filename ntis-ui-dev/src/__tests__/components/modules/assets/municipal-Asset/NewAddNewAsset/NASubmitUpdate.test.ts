import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSubmitInput, persistSubmitPayload, buildAssetMasterRequest } from '@/lib/utils/asset-utils/new-add-new-asset/submit/submit-asset-form.utils';
import { buildAssetSubmitFormData } from '@/hooks/asset/municipal-Asset/new-add-new-asset/useAssetSubmit.utils';
import { assetMasterService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-master.service';

import type { MockedFunction } from 'vitest';
import type { BuildingBasicInfoFormData } from '@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types';

vi.mock('@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-master.service', () => ({
  assetMasterService: {
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
  },
}));

describe('Asset Save/Update Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildAssetMasterRequest preserves id and assetId when editing existing asset', () => {
    const formData: Partial<BuildingBasicInfoFormData> = {
      id: 390621,
      assetId: 390621,
      assetName: 'Town Hall',
      categoryId: 1,
      typeId: 2,
    };

    const dto = buildAssetMasterRequest(formData as BuildingBasicInfoFormData);
    expect(dto.id).toBe(390621);
    expect(dto.assetId).toBe(390621);
  });

  it('buildAssetSubmitFormData packs id and assetId into FormData and dto', () => {
    const formData: Partial<BuildingBasicInfoFormData> = {
      id: 390621,
      assetId: 390621,
      assetName: 'Town Hall',
      categoryId: 1,
      typeId: 2,
    };

    const clientFormData = buildAssetSubmitFormData(formData as BuildingBasicInfoFormData, null, null);
    expect(clientFormData.get('id')).toBe('390621');
    expect(clientFormData.get('assetId')).toBe('390621');

    const parsed = parseSubmitInput(clientFormData);
    expect(parsed.formData.id).toBe(390621);
    expect(parsed.formData.assetId).toBe(390621);
  });

  it('persistSubmitPayload executes updateAsset (PUT) when isUpdate is true', async () => {
    (assetMasterService.updateAsset as MockedFunction<typeof assetMasterService.updateAsset>).mockResolvedValue({ success: true, data: { id: 390621 } as unknown as import('@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types').AssetMasterResponse });

    const result = await persistSubmitPayload(true, 390621, { assetName: 'Town Hall' });
    expect(assetMasterService.updateAsset).toHaveBeenCalledWith(390621, { assetName: 'Town Hall' });
    expect(assetMasterService.createAsset).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('persistSubmitPayload executes createAsset (POST) only when isUpdate is false', async () => {
    (assetMasterService.createAsset as MockedFunction<typeof assetMasterService.createAsset>).mockResolvedValue({ success: true, data: { id: 390622 } as unknown as import('@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types').AssetMasterResponse });

    const result = await persistSubmitPayload(false, NaN, { assetName: 'Brand New Asset' });
    expect(assetMasterService.createAsset).toHaveBeenCalledWith({ assetName: 'Brand New Asset' });
    expect(assetMasterService.updateAsset).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
