import { describe, it, expect, vi, beforeEach } from 'vitest';
import { launchPhotoPlanDrawingToolAction } from '@/app/[locale]/property-tax/ptis/PhotoPlan.action';
import { photoPlanService } from '@/lib/api/ptis/photoplan/photoplan.service';

vi.mock('@/lib/api/ptis/photoplan/photoplan.service', () => ({
  photoPlanService: {
    launchDrawingTool: vi.fn(),
  },
}));

describe('launchPhotoPlanDrawingToolAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates parameters directly to photoPlanService.launchDrawingTool and returns launchUrl on success', async () => {
    vi.mocked(photoPlanService.launchDrawingTool).mockResolvedValue({
      success: true,
      launchUrl: 'https://ptisplanapp.tabamc.in/launch?token=123',
    });

    const result = await launchPhotoPlanDrawingToolAction(
      101,
      'THANE_Survey',
      'https://ptisthane.scipl.info/en/property-tax/ptis',
      'tejas',
      'Tejas Kishor',
      '42',
      'UK1',
      '182',
      '0',
      'https://ptisthaneapi.scipl.info.in'
    );

    expect(result).toEqual({
      success: true,
      data: { launchUrl: 'https://ptisplanapp.tabamc.in/launch?token=123' },
    });

    expect(photoPlanService.launchDrawingTool).toHaveBeenCalledWith({
      propertyId: 101,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info/en/property-tax/ptis',
      ptisUsername: 'tejas',
      ptisDisplayName: 'Tejas Kishor',
      ptisUserId: '42',
      wardNo: 'UK1',
      propertyNo: '182',
      partitionNo: '0',
      ptisBackendUri: 'https://ptisthaneapi.scipl.info.in',
      type: undefined,
      isAmenity: undefined,
      entityType: undefined,
      societyDetailId: undefined,
      wingDetailId: undefined,
      photoTypeId: undefined,
    });
  });

  it('passes optional parameters directly to photoPlanService.launchDrawingTool', async () => {
    vi.mocked(photoPlanService.launchDrawingTool).mockResolvedValue({
      success: true,
      launchUrl: 'https://ptisplanapp.tabamc.in/launch?token=456',
    });

    const result = await launchPhotoPlanDrawingToolAction(
      202,
      'THANE_Survey',
      'https://ptisthane.scipl.info'
    );

    expect(result).toEqual({
      success: true,
      data: { launchUrl: 'https://ptisplanapp.tabamc.in/launch?token=456' },
    });

    expect(photoPlanService.launchDrawingTool).toHaveBeenCalledWith({
      propertyId: 202,
      councilName: 'THANE_Survey',
      returnUrl: 'https://ptisthane.scipl.info',
      ptisUsername: undefined,
      ptisDisplayName: undefined,
      ptisUserId: undefined,
      wardNo: undefined,
      propertyNo: undefined,
      partitionNo: undefined,
      ptisBackendUri: undefined,
      type: undefined,
      isAmenity: undefined,
      entityType: undefined,
      societyDetailId: undefined,
      wingDetailId: undefined,
      photoTypeId: undefined,
    });
  });

  it('returns failure result when photoPlanService.launchDrawingTool fails', async () => {
    vi.mocked(photoPlanService.launchDrawingTool).mockResolvedValue({
      success: false,
      error: 'Council THANE_Survey not found',
    });

    const result = await launchPhotoPlanDrawingToolAction(
      303,
      'THANE_Survey',
      'https://ptisthane.scipl.info'
    );

    expect(result).toEqual({
      success: false,
      error: 'Council THANE_Survey not found',
    });
  });

  it('returns default error message when service fails without explicit error text', async () => {
    vi.mocked(photoPlanService.launchDrawingTool).mockResolvedValue({
      success: false,
    });

    const result = await launchPhotoPlanDrawingToolAction(
      404,
      'THANE_Survey',
      'https://ptisthane.scipl.info'
    );

    expect(result).toEqual({
      success: false,
      error: 'Failed to retrieve launch URL from drawing tool service.',
    });
  });

  it('catches and formats unhandled exceptions thrown during service invocation', async () => {
    vi.mocked(photoPlanService.launchDrawingTool).mockRejectedValue(new Error('Fatal launch exception'));

    const result = await launchPhotoPlanDrawingToolAction(
      505,
      'THANE_Survey',
      'https://ptisthane.scipl.info'
    );

    expect(result).toEqual({
      success: false,
      error: 'Fatal launch exception',
    });
  });
});
