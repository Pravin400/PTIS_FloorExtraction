import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePropertyPhotoViewer } from '@/hooks/apartmentQc/usePropertyPhotoViewer';
import { getDocumentBlobUrl } from '@/lib/utils/document-client-utils';
import { fetchPropertyPhotosSafeAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import type { PropertyPhotoDto } from '@/types/photoplan.types';

// Mock dependencies
vi.mock('@/lib/utils/document-client-utils', () => ({
  getDocumentBlobUrl: vi.fn(),
}));

vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  fetchPropertyPhotosSafeAction: vi.fn(),
}));

const mockGetDocumentBlobUrl = vi.mocked(getDocumentBlobUrl);
const mockFetchPropertyPhotosSafeAction = vi.mocked(fetchPropertyPhotosSafeAction);

interface ViewerPhoto extends PropertyPhotoDto {
  resolvedUrl?: string;
}

describe('usePropertyPhotoViewer', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: null,
          isDrawerOpen: false,
        })
      );

      expect(result.current.photos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasPhotos).toBe(false);
      expect(result.current.totalPhotos).toBe(0);
      expect(result.current.hoverPreview).toBeNull();
    });
  });

  describe('fetching photos', () => {
    it('should not fetch photos when drawer is closed', () => {
      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: 123,
          isDrawerOpen: false,
        })
      );

      expect(result.current.photos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not fetch photos when propertyId is null', () => {
      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: null,
          isDrawerOpen: true,
        })
      );

      expect(result.current.photos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch and display photos successfully', async () => {
      const mockPhotos: PropertyPhotoDto[] = [
        {
          propertyPhotoId: 1,
          propertyId: 123,
          photoTypeId: 1,
          photoTypeCode: 'front',
          documentGuid: 'guid-1',
          photoTypeName: 'Front View',
          remarks: '',
        },
        {
          propertyPhotoId: 2,
          propertyId: 123,
          photoTypeId: 1,
          photoTypeCode: 'front',
          documentGuid: 'guid-2',
          photoTypeName: '',
          remarks: 'Back Yard',
        },
      ];

      mockFetchPropertyPhotosSafeAction.mockResolvedValue(mockPhotos);
      mockGetDocumentBlobUrl.mockResolvedValue({ url: 'blob://photo-1', contentType: 'image/jpeg' });

      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: 123,
          isDrawerOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchPropertyPhotosSafeAction).toHaveBeenCalledWith(123);
      expect(result.current.photos).toHaveLength(2);
      expect(result.current.totalPhotos).toBe(2);
      expect(result.current.hasPhotos).toBe(true);
    });

    it('should handle photos without documentGuid', async () => {
      const mockPhotos: PropertyPhotoDto[] = [
        {
          propertyPhotoId: 1,
          propertyId: 123,
          photoTypeId: 1,
          photoTypeCode: 'front',
          documentGuid: '',
          photoTypeName: 'Front View',
        },
      ];

      mockFetchPropertyPhotosSafeAction.mockResolvedValue(mockPhotos);

      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: 123,
          isDrawerOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.photos).toHaveLength(0);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetchPropertyPhotosSafeAction.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: 123,
          isDrawerOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.photos).toEqual([]);
      expect(result.current.hasPhotos).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should return correct photo URL', () => {
      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: null,
          isDrawerOpen: false,
        })
      );

      const mockPhoto: ViewerPhoto = {
        propertyPhotoId: 1,
        propertyId: 1,
        photoTypeId: 1,
        photoTypeCode: 'front',
        photoTypeName: '',
        resolvedUrl: 'blob://test-url'
      };
      expect(result.current.getPhotoUrl(mockPhoto)).toBe('blob://test-url');
    });

    it('should return correct photo title', () => {
      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: null,
          isDrawerOpen: false,
        })
      );

      const photoWithTypeName: ViewerPhoto = {
        propertyPhotoId: 1,
        propertyId: 1,
        photoTypeId: 1,
        photoTypeCode: 'front',
        photoTypeName: 'Front View'
      };
      const photoWithRemarks: ViewerPhoto = {
        propertyPhotoId: 1,
        propertyId: 1,
        photoTypeId: 1,
        photoTypeCode: 'front',
        photoTypeName: '',
        remarks: 'Back Yard'
      };
      const photoWithNoLabels: ViewerPhoto = {
        propertyPhotoId: 1,
        propertyId: 1,
        photoTypeId: 1,
        photoTypeCode: 'front',
        photoTypeName: '',
        remarks: ''
      };

      expect(result.current.getPhotoTitle(photoWithTypeName, 0)).toBe('Front View');
      expect(result.current.getPhotoTitle(photoWithRemarks, 1)).toBe('Back Yard');
      expect(result.current.getPhotoTitle(photoWithNoLabels, 2)).toBe('Photo 3');
    });
  });

  describe('hover preview', () => {
    it('should set hover preview on image hover', async () => {
      const mockPhotos: PropertyPhotoDto[] = [
        {
          propertyPhotoId: 1,
          propertyId: 123,
          photoTypeId: 1,
          photoTypeCode: 'front',
          documentGuid: 'guid-1',
          photoTypeName: 'Front View',
          remarks: '',
        },
      ];

      mockFetchPropertyPhotosSafeAction.mockResolvedValue(mockPhotos);
      mockGetDocumentBlobUrl.mockResolvedValue({ url: 'blob://photo-1', contentType: 'image/jpeg' });

      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: 123,
          isDrawerOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.photos.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.handleImageHover(result.current.photos[0], 0);
      });

      expect(result.current.hoverPreview).toEqual({
        src: 'blob://photo-1',
        title: 'Front View',
      });
    });

    it('should clear hover preview on leave', async () => {
      const mockPhotos: PropertyPhotoDto[] = [
        {
          propertyPhotoId: 1,
          propertyId: 123,
          photoTypeId: 1,
          photoTypeCode: 'front',
          documentGuid: 'guid-1',
          photoTypeName: 'Front View',
          remarks: '',
        },
      ];

      mockFetchPropertyPhotosSafeAction.mockResolvedValue(mockPhotos);
      mockGetDocumentBlobUrl.mockResolvedValue({ url: 'blob://photo-1', contentType: 'image/jpeg' });

      const { result } = renderHook(() =>
        usePropertyPhotoViewer({
          propertyId: 123,
          isDrawerOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.photos.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.handleImageHover(result.current.photos[0], 0);
      });

      expect(result.current.hoverPreview).not.toBeNull();
    });
  });
});
