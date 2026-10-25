import { describe, it, expect, vi, beforeEach } from 'vitest';
import { photoPlanService, invalidatePhotoPlanCache } from '@/lib/api/ptis/photoplan/photoplan.service';
import { apiClient } from '@/services/api.service';
import * as documentService from '@/lib/api/document.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api/document.service', () => ({
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

describe('photoPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidatePhotoPlanCache();
  });

  describe('getPhotosByProperty', () => {
    it('returns formatted photos list on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          success: true,
          items: [{ propertyPhotoId: 101, propertyId: 42, documentGuid: 'guid-123' }],
          message: 'Success',
        },
      });

      const res = await photoPlanService.getPhotosByProperty(42);
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].propertyPhotoId).toBe(101);
    });

    it('returns error result when API call fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Failed to fetch property photos',
      });

      const res = await photoPlanService.getPhotosByProperty(42);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Failed to fetch property photos');
    });
  });

  describe('getGroupedPhotosByProperty', () => {
    it('returns grouped photo gallery on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          success: true,
          items: {
            propertyId: 42,
            categories: [],
          },
        },
      });

      const res = await photoPlanService.getGroupedPhotosByProperty(42);
      expect(res.success).toBe(true);
      expect(res.data?.propertyId).toBe(42);
    });

    it('returns error result on API failure', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: 'Not found',
      });

      const res = await photoPlanService.getGroupedPhotosByProperty(42);
      expect(res.success).toBe(false);
    });
  });

  describe('getPhotoTypesWithStatus', () => {
    it('returns photo types list with status', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          success: true,
          items: [{ photoTypeId: 1, photoTypeCode: 'PROP', photoTypeName: 'Property Photo', hasPhoto: true, photoCount: 1 }],
        },
      });

      const res = await photoPlanService.getPhotoTypesWithStatus(42);
      expect(res.success).toBe(true);
      expect(res.data?.[0].photoTypeCode).toBe('PROP');
    });
  });

  describe('uploadPhotoViaGlobalApi', () => {
    it('uploads file via global document API and finds newly created photo ID', async () => {
      const file = new File(['dummy content'], 'photo.png', { type: 'image/png' });
      vi.mocked(documentService.uploadDocument).mockResolvedValueOnce({
        documentGuid: 'new-guid-999',
        documentId: 50,
        documentBindingId: 100,
        storagePath: '/storage/new-guid-999.png',
      } as unknown as Awaited<ReturnType<typeof documentService.uploadDocument>>);

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          success: true,
          items: [
            {
              propertyPhotoId: 777,
              documentGuid: 'new-guid-999',
              documentBindingId: 100,
              propertyId: 42,
              photoTypeId: 2,
              displayOrder: 1,
            },
          ],
        },
      });

      const res = await photoPlanService.uploadPhotoViaGlobalApi(file, 42, 2, 0, 1, 'Front Photo', 'PROP');
      expect(res.success).toBe(true);
      expect(res.data?.propertyPhotoId).toBe(777);
      expect(res.data?.documentGuid).toBe('new-guid-999');
    });

    it('returns failure result if document upload throws an error', async () => {
      const file = new File(['dummy content'], 'photo.png', { type: 'image/png' });
      vi.mocked(documentService.uploadDocument).mockRejectedValueOnce(new Error('Network upload timeout'));

      const res = await photoPlanService.uploadPhotoViaGlobalApi(file, 42, 2, 0);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Network upload timeout');
    });
  });

  describe('replacePhotoViaGlobalApi', () => {
    it('replaces photo using global API and performs best-effort cleanup of old document', async () => {
      const file = new File(['dummy content'], 'replaced.png', { type: 'image/png' });
      vi.mocked(documentService.uploadDocument).mockResolvedValueOnce({
        documentGuid: 'replaced-guid-888',
        documentId: 55,
        documentBindingId: 105,
        storagePath: '/storage/replaced.png',
      } as unknown as Awaited<ReturnType<typeof documentService.uploadDocument>>);

      vi.mocked(documentService.deleteDocument).mockResolvedValueOnce({ success: true, statusCode: 200 });

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          success: true,
          items: [
            {
              propertyPhotoId: 500,
              documentGuid: 'replaced-guid-888',
              documentBindingId: 105,
              propertyId: 42,
              photoTypeId: 3,
            },
          ],
        },
      });

      const res = await photoPlanService.replacePhotoViaGlobalApi(
        file,
        'old-guid-111',
        42,
        3,
        500,
        undefined,
        'Replaced photo',
        'PLAN'
      );

      expect(res.success).toBe(true);
      expect(res.data?.documentGuid).toBe('replaced-guid-888');
      expect(documentService.deleteDocument).toHaveBeenCalledWith('old-guid-111');
    });
  });

  describe('Photo type management endpoints', () => {
    it('updates property photo type name', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { success: true, items: {} },
      });

      const res = await photoPlanService.updatePropertyPhotoType(10, 'PROP', 'Property Main Photo');
      expect(res.success).toBe(true);
    });

    it('creates new property photo type', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { success: true, items: { id: 25 } },
      });

      const res = await photoPlanService.createPropertyPhotoType('CUSTOM', 'Custom Photo', 5);
      expect(res.success).toBe(true);
    });

    it('deletes property photo type', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { success: true, items: {} },
      });

      const res = await photoPlanService.deletePropertyPhotoType(10);
      expect(res.success).toBe(true);
    });

    it('purges property photo type and associated photos', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { success: true, items: {} },
      });

      const res = await photoPlanService.purgePropertyPhotoType(10);
      expect(res.success).toBe(true);
    });
  });
});
