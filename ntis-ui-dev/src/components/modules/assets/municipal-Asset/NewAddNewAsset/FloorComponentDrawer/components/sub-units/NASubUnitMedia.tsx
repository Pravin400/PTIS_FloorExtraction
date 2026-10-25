'use client';

import type { NASubUnitMediaProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { NAAssetMedia } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/components/NAAssetMedia';

export function NASubUnitMedia({
  initialPhotoSlots,
  initialPhotos,
  isFetchingDb = false,
  onFileStaged,
  onFileUnstaged,
  onFileReplaced,
  onDbPhotoRemoved,
}: NASubUnitMediaProps) {
  return (
    <NAAssetMedia
      initialPhotoSlots={Array.isArray(initialPhotoSlots) ? initialPhotoSlots : undefined}
      initialPhotos={Array.isArray(initialPhotos) ? initialPhotos : undefined}
      isFetchingDb={isFetchingDb}
      onFileStaged={onFileStaged}
      onFileUnstaged={onFileUnstaged}
      onFileReplaced={onFileReplaced}
      onDbPhotoRemoved={onDbPhotoRemoved}
    />
  );
}


