import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSocietyWingDetailsAction,
  getSocietyDetailsByPropertyAction,
  getAllActiveWingsAction,
  createSocietyDetailAction,
  updateSocietyDetailAction,
  deleteSocietyDetailAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Wing/action';
import { getSocietyWingDetails } from '@/lib/api/zone-property.service';
import {
  getSocietyDetailsByProperty,
  createSocietyDetail,
  updateSocietyDetail,
  deleteSocietyDetail,
} from '@/lib/api/societyDetails.services';
import { getAllActiveWings } from '@/lib/api/wing.service';

vi.mock('@/lib/api/zone-property.service', () => ({
  getSocietyWingDetails: vi.fn(),
}));

vi.mock('@/lib/api/societyDetails.services', () => ({
  getSocietyDetailsByProperty: vi.fn(),
  createSocietyDetail: vi.fn(),
  updateSocietyDetail: vi.fn(),
  deleteSocietyDetail: vi.fn(),
}));

vi.mock('@/lib/api/wing.service', () => ({
  getAllActiveWings: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: '1' }),
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Wing Server Actions in QuickDataEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSocietyWingDetailsAction', () => {
    it('returns error for invalid property ID', async () => {
      const result = await getSocietyWingDetailsAction(0);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Property ID');
    });

    it('returns data when service succeeds', async () => {
      const mockDetails = [
        {
          propertyId: 101,
          societyDetailId: 1,
          wingId: 1,
          wingNo: 'A',
          wardNo: '1',
          propertyNo: '101',
          wingName: 'A Wing',
          societyName: 'Test Society',
          societyAddress: '',
          secretaryName: '',
          managerName: '',
          landOwnerName: '',
          builderName: '',
          societyNameEnglish: '',
          societyAddressEnglish: '',
          secretaryNameEnglish: '',
          managerNameEnglish: '',
          landOwnerNameEnglish: '',
          builderNameEnglish: '',
          managerMobileNo: '',
          secretaryMobileNo: '',
          societyEmailId: '',
          secretaryEmailId: '',
          managerEmailId: '',
          propertyCount: 10,
          aminityCount: 2,
        },
      ];
      vi.mocked(getSocietyWingDetails).mockResolvedValue(mockDetails);

      const result = await getSocietyWingDetailsAction(101);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDetails);
    });
  });

  describe('getSocietyDetailsByPropertyAction', () => {
    it('returns items from service', async () => {
      const mockResponse = {
        items: [
          {
            id: 1,
            propertyId: 101,
            wingId: 1,
            wingName: 'A Wing',
            societyName: 'Test Society',
            societyAddress: '',
            secretaryName: '',
            managerName: '',
            landOwnerName: '',
            builderName: '',
            secretaryNameEnglish: '',
            societyNameEnglish: '',
            societyAddressEnglish: '',
            managerNameEnglish: '',
            landOwnerNameEnglish: '',
            builderNameEnglish: '',
            managerMobileNo: '',
            secretaryMobileNo: '',
            societyEmailId: '',
            secretaryEmailId: '',
            managerEmailId: '',
            markedForDeletion: false,
            isActive: true,
            createdDate: '2026-01-01',
            updatedDate: null,
          },
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 100,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };
      vi.mocked(getSocietyDetailsByProperty).mockResolvedValue(mockResponse);

      const result = await getSocietyDetailsByPropertyAction(101);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getAllActiveWingsAction', () => {
    it('returns active wings list', async () => {
      const mockWings = [
        {
          id: 1,
          wingNo: 'A',
          sequenceNo: 1,
          isActive: true,
          createdDate: '2026-01-01',
          updatedDate: null,
        },
      ];
      vi.mocked(getAllActiveWings).mockResolvedValue(mockWings);

      const result = await getAllActiveWingsAction();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWings);
    });
  });

  describe('createSocietyDetailAction', () => {
    it('creates wing and returns item', async () => {
      const createdItem = {
        id: 2,
        propertyId: 101,
        wingId: 2,
        wingName: 'B Wing',
        societyName: '',
        societyAddress: '',
        secretaryName: '',
        managerName: '',
        landOwnerName: '',
        builderName: '',
        secretaryNameEnglish: '',
        societyNameEnglish: '',
        societyAddressEnglish: '',
        managerNameEnglish: '',
        landOwnerNameEnglish: '',
        builderNameEnglish: '',
        managerMobileNo: '',
        secretaryMobileNo: '',
        societyEmailId: '',
        secretaryEmailId: '',
        managerEmailId: '',
        markedForDeletion: false,
        isActive: true,
        createdDate: '2026-01-01',
        updatedDate: null,
      };
      vi.mocked(createSocietyDetail).mockResolvedValue({
        success: true,
        message: 'Created',
        items: createdItem,
      });

      const result = await createSocietyDetailAction(101, {
        isActive: true,
        wingId: 2,
        wingName: 'B Wing',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdItem);
    });
  });

  describe('updateSocietyDetailAction', () => {
    it('updates wing and returns item', async () => {
      const updatedItem = {
        id: 2,
        propertyId: 101,
        wingId: 2,
        wingName: 'B-1 Wing',
        societyName: '',
        societyAddress: '',
        secretaryName: '',
        managerName: '',
        landOwnerName: '',
        builderName: '',
        secretaryNameEnglish: '',
        societyNameEnglish: '',
        societyAddressEnglish: '',
        managerNameEnglish: '',
        landOwnerNameEnglish: '',
        builderNameEnglish: '',
        managerMobileNo: '',
        secretaryMobileNo: '',
        societyEmailId: '',
        secretaryEmailId: '',
        managerEmailId: '',
        markedForDeletion: false,
        isActive: true,
        createdDate: '2026-01-01',
        updatedDate: null,
      };
      vi.mocked(updateSocietyDetail).mockResolvedValue({
        success: true,
        message: 'Updated',
        items: updatedItem,
      });

      const result = await updateSocietyDetailAction(101, 2, {
        wingName: 'B-1 Wing',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedItem);
    });
  });

  describe('deleteSocietyDetailAction', () => {
    it('deletes wing successfully', async () => {
      vi.mocked(deleteSocietyDetail).mockResolvedValue({
        success: true,
        message: 'Deleted',
      });

      const result = await deleteSocietyDetailAction(101, 2);
      expect(result.success).toBe(true);
    });
  });
});
