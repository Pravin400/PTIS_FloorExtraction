/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveRenterDetails, deleteRenterDetails, updateRenterDetails } from '@/lib/api/ptis/floorSubmission/renter.service';
import { getFloorById, getSubmissionDetails } from '@/lib/api/ptis/floorSubmission/floor-info.service';
import { apiClient } from '@/services/api.service';

// Mock the api service
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Renter Service Integration & Hydration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveRenterDetails - Single PUT with id-aligned nested arrays', () => {
    // The backend exposes existing renter rows ONLY through the nested
    // `renterDetails` / `renters` arrays of `GET /DataEntry/{id}` — the
    // standalone `/RenterDetails` / `/RenterMast` list endpoints return 405.
    const mockFloorGetResponse = {
      success: true,
      data: {
        propertyDetailsId: 100,
        floorId: '1',
        renterYesNo: true,
        renterDetails: [
          { id: 201, propertyDetailsId: 100, agreementId: 'AGR-OLD', incrementFrequency: 'Yearly', durationFrom: '2026-01-01T00:00:00' },
        ],
        renters: [
          { id: 301, propertyDetailsId: 100, financialYear: '2026', finalRent: 5000 },
        ],
      },
    };
    const mockFloorPutResponse = {
      success: true,
      data: {
        propertyDetailsId: 100,
        floorId: '1',
        renterYesNo: true,
      },
    };

    const incomingPayload = {
      propertyId: 100,
      propertyDetailsId: 100,
      renterYesNo: true,
      taxLiability: 'Taxable',
      renterName: 'John Doe',
      renterDetails: [
        // Update existing item 201 (will be id-aligned by date match)
        { agreementId: 'AGR-NEW', incrementFrequency: 'Monthly', incrementType: 'Percentage', incrementValue: 10, durationFrom: '2026-01-01', durationTo: '2026-12-31' },
        // Create new item
        { agreementId: 'AGR-TEMP', incrementFrequency: 'Yearly', durationFrom: '2027-01-01', durationTo: '2027-12-31' },
      ],
      renterMast: [
        // Update existing item 301 (will be id-aligned by FY match)
        { financialYear: '2026-27', finalRent: 6000 },
        // Create new item
        { financialYear: '2027-28', finalRent: 7000 },
      ],
    };

    it('should send a single PUT to /DataEntry/{id} with id-aligned nested renter arrays', async () => {
      vi.mocked(apiClient.put).mockResolvedValue(mockFloorPutResponse);
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) return mockFloorGetResponse;
        return { success: false };
      });
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      const result = await saveRenterDetails(100, incomingPayload);

      // Existing rows are sourced from the nested GET on the floor itself.
      expect(apiClient.get).toHaveBeenCalledWith('/DataEntry/100');

      // A single PUT to /DataEntry/{id} carries the full nested body.
      expect(apiClient.put).toHaveBeenCalledWith(
        '/DataEntry/100',
        expect.objectContaining({
          renterDetails: expect.arrayContaining([
            expect.objectContaining({ id: 201, agreementId: 'AGR-NEW' }),
            expect.objectContaining({ agreementId: 'AGR-TEMP' }),
          ]),
          renterMast: expect.arrayContaining([
            expect.objectContaining({ id: 301, financialYear: '2026' }),
            expect.objectContaining({ financialYear: '2027' }),
          ]),
        })
      );

      // The new form row (AGR-TEMP) must NOT carry the existing id 201.
      const putCall = vi.mocked(apiClient.put).mock.calls.find(([url]) => url === '/DataEntry/100');
      expect(putCall).toBeDefined();
      const putBody = putCall![1] as Record<string, any>;
      const newDetail = (putBody.renterDetails as any[]).find((d) => d.agreementId === 'AGR-TEMP');
      expect(newDetail.id).toBeUndefined();
      const newMast = (putBody.renterMast as any[]).find((m) => m.financialYear === '2027');
      expect(newMast.id).toBeUndefined();

      // No separate PUT/POST to /RenterDetails or /RenterMast — the floor PUT handles it.
      expect(apiClient.put).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterDetails\//), expect.any(Object));
      expect(apiClient.put).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterMast\//), expect.any(Object));
      expect(apiClient.post).not.toHaveBeenCalledWith('/RenterDetails', expect.any(Object));
      expect(apiClient.post).not.toHaveBeenCalledWith('/RenterMast', expect.any(Object));

      expect(result).toBeDefined();
    });

    it('should soft-delete stale db rows by sending them with isActive:false inside the PUT body', async () => {
      const emptyRenterPayload = {
        propertyId: 100,
        propertyDetailsId: 100,
        renterYesNo: true,
        renterDetails: [],
        renterMast: [],
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockFloorPutResponse);
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) return mockFloorGetResponse;
        return { success: false };
      });
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      await saveRenterDetails(100, emptyRenterPayload);

      // Stale rows are merged back into the PUT body with isActive:false
      // (separate /RenterDetails/{id} / /RenterMast/{id} DELETE endpoints
      // return 405 on this backend).
      expect(apiClient.put).toHaveBeenCalledWith(
        '/DataEntry/100',
        expect.objectContaining({
          renterDetails: expect.arrayContaining([
            expect.objectContaining({ id: 201, isActive: false }),
          ]),
          renterMast: expect.arrayContaining([
            expect.objectContaining({ id: 301, isActive: false }),
          ]),
        })
      );
    });

    it('should ignore duplicate record errors from the floor PUT and still complete', async () => {
      const dupPayload = {
        propertyId: 100,
        propertyDetailsId: 100,
        renterYesNo: true,
        renterDetails: [
          { agreementId: 'AGR-NEW-DUP', durationFrom: '2026-01-01' }
        ],
        renterMast: []
      };

      vi.mocked(apiClient.put).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) {
          return {
            success: false,
            statusCode: 409,
            error: "A record with the same details already exists."
          } as any;
        }
        return { success: true };
      });

      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) return mockFloorGetResponse;
        return { success: false };
      });
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      const result = await saveRenterDetails(100, dupPayload);

      // PUT was attempted with id stamped onto the matching detail row.
      expect(apiClient.put).toHaveBeenCalledWith(
        '/DataEntry/100',
        expect.objectContaining({
          renterDetails: expect.arrayContaining([
            expect.objectContaining({ id: 201, agreementId: 'AGR-NEW-DUP' }),
          ]),
        })
      );

      expect(result).toBeDefined();
    });
  });


  describe('deleteRenterDetails', () => {
    // The dedicated `/RenterDetails` / `/RenterMast` endpoints are unavailable
    // (405). Existing rows are read back from the floor envelope and then
    // soft-deleted by sending them inside the floor PUT with isActive:false.
    const mockFloorGetResponse = {
      success: true,
      data: {
        propertyDetailsId: 100,
        renterDetails: [
          { id: 201, propertyDetailsId: 100 },
        ],
        renters: [
          { id: 301, propertyDetailsId: 100 },
        ],
      },
    };

    it('should fetch existing rows from the floor envelope and soft-delete them via the floor PUT', async () => {
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) return mockFloorGetResponse;
        return { success: false };
      });
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });

      await deleteRenterDetails(100);

      // We do NOT call DELETE on the standalone endpoints (they 405).
      expect(apiClient.delete).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterDetails\//));
      expect(apiClient.delete).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterMast\//));

      // Existing rows ride along inside the PUT with isActive: false.
      expect(apiClient.put).toHaveBeenCalledWith('/DataEntry/100', expect.objectContaining({
        renterYesNo: false,
        isRenter: false,
        updatedBy: 0,
        renterDetails: expect.arrayContaining([
          expect.objectContaining({ id: 201, isActive: false }),
        ]),
        renterMast: expect.arrayContaining([
          expect.objectContaining({ id: 301, isActive: false }),
        ]),
      }));
    });
  });

  describe('floor-info.service Hydration on Retrieval', () => {
    // Renter children are nested inside the `GET /DataEntry/{id}` envelope —
    // there are no standalone GET endpoints. `renters` is the backend's
    // projection of `renterMast` in the response.
    const mockFloorApiResponse = {
      success: true,
      data: {
        propertyDetailsId: 100,
        floorId: '1',
        renterYesNo: true,
        renterDetails: [
          { id: 201, propertyDetailsId: 100, agreementId: 'AGR-100' },
        ],
        renters: [
          { id: 301, propertyDetailsId: 100, financialYear: '2026' },
        ],
      },
    };

    beforeEach(() => {
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) return mockFloorApiResponse;
        return { success: false };
      });
    });

    it('getFloorById should fetch the floor and project its nested renter arrays', async () => {
      const result = await getFloorById(100);

      expect(apiClient.get).toHaveBeenCalledWith('/DataEntry/100', { cache: 'no-store' });
      // The dead list endpoints must never be hit.
      expect(apiClient.get).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterDetails\?/));
      expect(apiClient.get).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterMast\?/));

      expect(result.renterDetails).toHaveLength(1);
      expect((result.renterDetails as any[])[0].id).toBe(201);

      expect(result.renterMast).toHaveLength(1);
      expect((result.renterMast as any[])[0].id).toBe(301);
    });

    it('getSubmissionDetails should fetch the floor and project its nested renter arrays', async () => {
      const result = await getSubmissionDetails(100);

      expect(result).not.toBeNull();
      expect(result!.renterDetails).toHaveLength(1);
      expect((result!.renterDetails as any[])[0].id).toBe(201);
      expect(result!.renterMast).toHaveLength(1);
      expect((result!.renterMast as any[])[0].id).toBe(301);
    });

    it('should correctly map PascalCase nested keys (regression test for database casing mismatch)', async () => {
      const mockFloorApiResponsePascal = {
        success: true,
        data: {
          PropertyDetailsId: 100,
          FloorId: '1',
          RenterYesNo: true,
          renterDetails: [
            { Id: 401, PropertyDetailsId: 100, AgreementId: 'AGR-PASCAL-100' },
          ],
          renters: [
            { Id: 501, PropertyDetailsId: 100, FinancialYear: '2026' },
          ],
        },
      };

      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) return mockFloorApiResponsePascal;
        return { success: false };
      });

      const result = await getFloorById(100);

      expect(result.renterDetails).toHaveLength(1);
      expect((result.renterDetails as any[])[0].id).toBe(401);
      expect((result.renterDetails as any[])[0].propertyDetailsId).toBe(100);

      expect(result.renterMast).toHaveLength(1);
      expect((result.renterMast as any[])[0].id).toBe(501);
      expect((result.renterMast as any[])[0].propertyDetailsId).toBe(100);
    });

    it('should filter out soft-deleted (isActive:false) rows so they do not resurface in the UI', async () => {
      const mockFloorApiResponseMixed = {
        success: true,
        data: {
          propertyDetailsId: 100,
          floorId: '1',
          renterYesNo: true,
          renterDetails: [
            { id: 201, propertyDetailsId: 100, agreementId: 'AGR-100', isActive: true },
            { id: 202, propertyDetailsId: 100, agreementId: 'AGR-DELETED', isActive: false },
          ],
          renters: [
            { id: 301, propertyDetailsId: 100, financialYear: '2026', isActive: true },
            { id: 302, propertyDetailsId: 100, financialYear: '2025', isActive: false },
          ],
        },
      };

      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/100')) return mockFloorApiResponseMixed;
        return { success: false };
      });

      const result = await getFloorById(100);

      expect((result.renterDetails as any[]).map((r) => r.id)).toEqual([201]);
      expect((result.renterMast as any[]).map((r) => r.id)).toEqual([301]);
    });

    it('should return empty/null safely and not trigger API requests when queried with invalid IDs (NaN or <= 0)', async () => {
      const getSpy = vi.spyOn(apiClient, 'get');

      const floorRes = await getFloorById('new');
      expect(floorRes).toEqual({});

      const subRes = await getSubmissionDetails(NaN);
      expect(subRes).toBeNull();

      expect(getSpy).not.toHaveBeenCalledWith(expect.stringContaining('NaN'), expect.any(Object));
      expect(getSpy).not.toHaveBeenCalledWith(expect.stringContaining('new'), expect.any(Object));

      getSpy.mockRestore();
    });
  });

  describe('updateRenterDetails', () => {
    // Existing rows come back nested inside `GET /DataEntry/{id}` — see the
    // comment block on `saveRenterDetails` for why the dedicated list
    // endpoints aren't usable on this backend.
    const mockFloorGetResponse = {
      success: true,
      data: {
        id: 228338,
        propertyDetailsId: 228338,
        floorId: '2',
        renterYesNo: true,
        renterDetails: [
          { id: 201, propertyDetailsId: 228338, agreementId: 'AGR-201' },
        ],
        renters: [
          { id: 301, propertyDetailsId: 228338, financialYear: '2026' },
        ],
      },
    };

    it('should update floor and return the hydrated floor with renter children', async () => {
      const mockPutResponse = {
        success: true,
        message: "Record updated successfully",
        data: {
          items: {
            id: 228338,
            propertyDetailsId: 228338,
            floorId: '2',
            renterYesNo: true,
          }
        }
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockPutResponse);
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/228338')) return mockFloorGetResponse;
        return { success: false };
      });

      const payload = { floorId: '2', renterYesNo: true };
      const result = await updateRenterDetails(228338, payload) as Record<string, any>;

      expect(apiClient.put).toHaveBeenCalledWith('/DataEntry/228338', expect.any(Object));
      expect(apiClient.get).toHaveBeenCalledWith('/DataEntry/228338');

      expect(result).toBeDefined();
      expect(result.id).toBe(228338);
    });

    it('should throw ApiError if PUT fails', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Invalid payload details"
      });

      await expect(updateRenterDetails(228338, {})).rejects.toThrow("Invalid payload details");
    });

    it('should align temporary client-side IDs onto existing database IDs and send them inside the /DataEntry PUT body', async () => {
      const mockPutResponse = {
        success: true,
        data: {
          items: {
            id: 228338,
            propertyDetailsId: 228338,
            floorId: '2',
            renterYesNo: true,
          }
        }
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockPutResponse);
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/228338')) return mockFloorGetResponse;
        return { success: false };
      });

      const payloadWithTempIds = {
        floorId: '2',
        renterYesNo: true,
        renterDetails: [
          { id: 1779361095325, agreementId: 'AGR-NEW-TEMP' }
        ],
        renterMast: [
          { id: 1779361095326, financialYear: '2026-27', finalRent: 6000 }
        ]
      };

      await updateRenterDetails(228338, payloadWithTempIds);

      // Temp ids are dropped and real db ids (201 / 301) are stamped onto the
      // form rows inside the single /DataEntry PUT body.
      expect(apiClient.put).toHaveBeenCalledWith(
        '/DataEntry/228338',
        expect.objectContaining({
          renterDetails: expect.arrayContaining([
            expect.objectContaining({ id: 201, agreementId: 'AGR-NEW-TEMP' }),
          ]),
          renterMast: expect.arrayContaining([
            expect.objectContaining({ id: 301, financialYear: '2026' }),
          ]),
        })
      );

      // No separate /RenterDetails/{id} or /RenterMast/{id} update calls.
      expect(apiClient.put).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterDetails\//), expect.any(Object));
      expect(apiClient.put).not.toHaveBeenCalledWith(expect.stringMatching(/^\/RenterMast\//), expect.any(Object));
    });

    it('should align temp IDs onto PascalCase database records so duplicates are not re-created', async () => {
      const mockPutResponse = {
        success: true,
        data: {
          items: {
            Id: 228338,
            PropertyDetailsId: 228338,
            FloorId: '2',
            RenterYesNo: true,
          }
        }
      };

      const mockFloorGetResponsePascal = {
        success: true,
        data: {
          Id: 228338,
          PropertyDetailsId: 228338,
          FloorId: '2',
          RenterYesNo: true,
          renterDetails: [
            { Id: 601, PropertyDetailsId: 228338, AgreementId: 'AGR-601' },
          ],
          renters: [
            { Id: 701, PropertyDetailsId: 228338, FinancialYear: '2026' },
          ],
        },
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockPutResponse);
      vi.mocked(apiClient.get).mockImplementation(async (url) => {
        if (url.includes('/DataEntry/228338')) return mockFloorGetResponsePascal;
        return { success: false };
      });

      const payloadWithTempIds = {
        floorId: '2',
        renterYesNo: true,
        renterDetails: [
          { id: 1779361095325, agreementId: 'AGR-NEW-TEMP' }
        ],
        renterMast: [
          { id: 1779361095326, financialYear: '2026-27', finalRent: 6000 }
        ]
      };

      await updateRenterDetails(228338, payloadWithTempIds);

      // PascalCase ids are normalized then stamped onto the form rows.
      expect(apiClient.put).toHaveBeenCalledWith(
        '/DataEntry/228338',
        expect.objectContaining({
          renterDetails: expect.arrayContaining([
            expect.objectContaining({ id: 601, agreementId: 'AGR-NEW-TEMP' }),
          ]),
          renterMast: expect.arrayContaining([
            expect.objectContaining({ id: 701, financialYear: '2026' }),
          ]),
        })
      );
    });
  });
});

