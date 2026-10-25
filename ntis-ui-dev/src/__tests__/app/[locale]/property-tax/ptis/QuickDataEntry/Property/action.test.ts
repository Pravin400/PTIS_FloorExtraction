import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deletePropertyDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Property/action';
import { deletePropertyDetails } from '@/lib/api/ptis/propertybasicdetails/property-basic-details.service';
import { getFloorSubmissionsByOwner } from '@/lib/api/ptis/floorSubmission';
import { ApiError } from '@/lib/utils/api';

vi.mock('@/lib/api/ptis/propertybasicdetails/property-basic-details.service', () => ({
  deletePropertyDetails: vi.fn(),
  getPropertyBasicDetails: vi.fn(),
  getPropertyCategories: vi.fn(),
  getPropertyTypes: vi.fn(),
  getWingMaster: vi.fn(),
  getMoujaMaster: vi.fn(),
  updatePropertyBasicDetails: vi.fn(),
  getTaxZones: vi.fn(),
}));

vi.mock('@/lib/api/ptis/floorSubmission', () => ({
  getFloorSubmissionsByOwner: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(() => {
    const t = (key: string) => key;
    return Promise.resolve(t);
  }),
}));

describe('deletePropertyDetailsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success immediately without calling deletePropertyDetails when no floor submissions exist', async () => {
    vi.mocked(getFloorSubmissionsByOwner).mockResolvedValue([]);

    const result = await deletePropertyDetailsAction(123);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
    expect(deletePropertyDetails).not.toHaveBeenCalled();
  });

  it('should call deletePropertyDetails and return success when floor submissions exist and delete succeeds', async () => {
    vi.mocked(getFloorSubmissionsByOwner).mockResolvedValue([{ id: 1 }]);
    vi.mocked(deletePropertyDetails).mockResolvedValue({
      success: true,
      statusCode: 200,
      data: null,
    });

    const result = await deletePropertyDetailsAction(123);

    expect(result.success).toBe(true);
    expect(deletePropertyDetails).toHaveBeenCalledWith(123);
  });

  it('should return success when floor submissions exist but deletePropertyDetails throws ApiError with status 404', async () => {
    vi.mocked(getFloorSubmissionsByOwner).mockResolvedValue([{ id: 1 }]);
    vi.mocked(deletePropertyDetails).mockRejectedValue(
      new ApiError(404, 'Not Found', 'Failed to delete details')
    );

    const result = await deletePropertyDetailsAction(123);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('should return success when floor submissions exist but deletePropertyDetails throws a generic Error with "not found" in message', async () => {
    vi.mocked(getFloorSubmissionsByOwner).mockResolvedValue([{ id: 1 }]);
    vi.mocked(deletePropertyDetails).mockRejectedValue(
      new Error('Resource was not found on the server')
    );

    const result = await deletePropertyDetailsAction(123);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('should return failure when floor submissions exist but deletePropertyDetails throws a standard error', async () => {
    vi.mocked(getFloorSubmissionsByOwner).mockResolvedValue([{ id: 1 }]);
    vi.mocked(deletePropertyDetails).mockRejectedValue(new Error('Database connection failed'));

    const result = await deletePropertyDetailsAction(123);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return success when floor submissions exist but deletePropertyDetails throws ApiError with status 400', async () => {
    vi.mocked(getFloorSubmissionsByOwner).mockResolvedValue([{ id: 1 }]);
    vi.mocked(deletePropertyDetails).mockRejectedValue(
      new ApiError(400, 'Bad Request', 'No details found')
    );

    const result = await deletePropertyDetailsAction(123);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('should return success when floor submissions exist but deletePropertyDetails throws a generic Error with "not present" in message', async () => {
    vi.mocked(getFloorSubmissionsByOwner).mockResolvedValue([{ id: 1 }]);
    vi.mocked(deletePropertyDetails).mockRejectedValue(
      new Error('Renter details are not present for this property')
    );

    const result = await deletePropertyDetailsAction(123);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});
