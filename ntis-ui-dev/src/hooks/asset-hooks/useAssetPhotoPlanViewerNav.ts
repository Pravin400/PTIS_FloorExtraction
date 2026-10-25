import { useCallback } from 'react';
import type { PhotoCategory } from '@/types/asset/media.types';
import { downloadDocumentClient } from '@/lib/utils/document-client-utils';

export function useAssetPhotoPlanViewerNav(
  selectedImageIndex: number | null,
  activeCategory: PhotoCategory | undefined,
  setSelectedImageIndex: (idx: number | null) => void,
  setRotation: (rotation: number) => void
) {
  const handleNext = useCallback(() => {
    if (selectedImageIndex !== null && activeCategory) {
      setRotation(0);
      setSelectedImageIndex((selectedImageIndex + 1) % activeCategory.images.length);
    }
  }, [selectedImageIndex, activeCategory, setSelectedImageIndex, setRotation]);

  const handlePrev = useCallback(() => {
    if (selectedImageIndex !== null && activeCategory) {
      setRotation(0);
      const len = activeCategory.images.length;
      setSelectedImageIndex((selectedImageIndex - 1 + len) % len);
    }
  }, [selectedImageIndex, activeCategory, setSelectedImageIndex, setRotation]);

  const handleDownload = useCallback(() => {
    const img = selectedImageIndex !== null ? activeCategory?.images[selectedImageIndex] : null;
    if (!img) return;

    if (img.documentGuid) {
      void downloadDocumentClient(
        img.documentGuid,
        `${img.title.replace(/\s+/g, '_')}.png`
      );
      return;
    }

    const downloadHref = img.downloadUrl || img.src;
    if (downloadHref) {
      Object.assign(document.createElement('a'), {
        href: downloadHref, download: `${img.title.replace(/\s+/g, '_')}.png`
      }).click();
    }
  }, [selectedImageIndex, activeCategory]);

  return { handleNext, handlePrev, handleDownload };
}
