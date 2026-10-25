import { useState, useCallback, useEffect, useRef } from 'react';
import { getDocumentBlobUrl } from '@/lib/utils/document-client-utils';
import type { PropertyPhotoDto } from '@/types/photoplan.types';
import { fetchPropertyPhotosSafeAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';

export interface UsePropertyPhotoViewerProps {
  propertyId?: number | null;
  isDrawerOpen: boolean;
}

interface ViewerPhoto extends PropertyPhotoDto {
  resolvedUrl?: string;
}

const MAX_VISIBLE_PROPERTY_PHOTOS = 4;

function isViewerPhoto(photo: ViewerPhoto | null): photo is ViewerPhoto {
  return photo !== null;
}

export function usePropertyPhotoViewer({
  propertyId,
  isDrawerOpen,
}: UsePropertyPhotoViewerProps) {
  const [photos, setPhotos] = useState<ViewerPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [hoverPreview, setHoverPreview] = useState<{ src: string; title: string } | null>(null);

  // Track the propertyId+open combo to avoid duplicate API calls
  const fetchRef = useRef<{ open: boolean; propertyId: number | null }>({
    open: false,
    propertyId: null,
  });
  const objectUrlsRef = useRef<string[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revokeObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    objectUrlsRef.current = [];
  }, []);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Fetch photos when drawer opens
  useEffect(() => {
    if (!isDrawerOpen || !propertyId) return;

    // Prevent duplicate calls from strict mode / rapid open-close
    if (fetchRef.current.open && fetchRef.current.propertyId === propertyId) return;
    fetchRef.current = { open: true, propertyId };

    let cancelled = false;

    const fetchPhotos = async () => {
      try {
        setIsLoading(true);
      
        const data = await fetchPropertyPhotosSafeAction(propertyId);
        const resolvedPhotos: Array<ViewerPhoto | null> = [];

        for (const photo of data) {
          if (resolvedPhotos.filter(isViewerPhoto).length >= MAX_VISIBLE_PROPERTY_PHOTOS) {
            break;
          }

          const documentGuid = photo.documentGuid?.trim();
          if (!documentGuid) {
            continue;
          }

          try {
            const { url } = await getDocumentBlobUrl(documentGuid);
            resolvedPhotos.push({
              ...photo,
              documentGuid,
              resolvedUrl: url,
            });
          } catch {
            resolvedPhotos.push(null);
          }
        }

        const normalizedPhotos = resolvedPhotos.filter(isViewerPhoto);

        if (!cancelled) {
          revokeObjectUrls();
          objectUrlsRef.current = normalizedPhotos
            .map((photo) => photo.resolvedUrl)
            .filter((url): url is string => !!url);
          setPhotos(normalizedPhotos);
          setTotalPhotos(data.length);
          setHasPhotos(normalizedPhotos.length > 0);
          setHoverPreview(null);
          if (normalizedPhotos.length > 0) {
            setSelectedImageIndex(0);
          }
          if (normalizedPhotos.length === 0) {
            setSelectedImageIndex(0);
          }
        } else {
          normalizedPhotos.forEach((photo) => {
            if (photo.resolvedUrl) {
              URL.revokeObjectURL(photo.resolvedUrl);
            }
          });
        }
      } catch {
        if (!cancelled) {
          revokeObjectUrls();
          setPhotos([]);
          setHasPhotos(false);
          setTotalPhotos(0);
          setHoverPreview(null);
          setSelectedImageIndex(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPhotos();

    return () => {
      cancelled = true;
      fetchRef.current = { open: false, propertyId: null };
      clearHoverTimeout();
      revokeObjectUrls();
    };
  }, [clearHoverTimeout, isDrawerOpen, propertyId, revokeObjectUrls]);

  useEffect(() => {
    return () => {
      clearHoverTimeout();
      revokeObjectUrls();
    };
  }, [clearHoverTimeout, revokeObjectUrls]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const getPhotoUrl = useCallback((photo: ViewerPhoto) => {
    if (photo.resolvedUrl?.trim()) {
      return photo.resolvedUrl;
    }

    return '';
  }, []);

  const getPhotoTitle = useCallback((photo: ViewerPhoto, index: number) => {
    const photoTypeName = photo.photoTypeName?.trim();
    if (photoTypeName) {
      return photoTypeName;
    }

    const remarks = photo.remarks?.trim();
    if (remarks) {
      return remarks;
    }

    return `Photo ${index + 1}`;
  }, []);

  const handleImageHover = useCallback(
    (photo: ViewerPhoto, index: number) => {
      clearHoverTimeout();

      const previewSrc = getPhotoUrl(photo);
      if (!previewSrc) {
        return;
      }

      setSelectedImageIndex(index);
      setHoverPreview({
        src: previewSrc,
        title: getPhotoTitle(photo, index),
      });
    },
    [clearHoverTimeout, getPhotoTitle, getPhotoUrl]
  );

  const handleImageLeave = useCallback(() => {
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPreview(null);
      hoverTimeoutRef.current = null;
    }, 150);
  }, [clearHoverTimeout]);

  const cancelImageLeave = useCallback(() => {
    clearHoverTimeout();
  }, [clearHoverTimeout]);

  const currentPhoto = photos[selectedImageIndex] || null;

  return {
    photos,
    isLoading,
    hasPhotos,
    totalPhotos,
    visiblePhotoCount: photos.length,
    hoverPreview,
    selectedImageIndex,
    setSelectedImageIndex,
    currentPhoto,
    getPhotoUrl,
    getPhotoTitle,
    handleNext,
    handlePrev,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
  };
}
