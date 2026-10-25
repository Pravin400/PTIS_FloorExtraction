'use client';

import React from 'react';
import { PhotoPlanNamingModal } from './PhotoPlanNamingModal';
import type { AdditionalImage } from './MediaImageCards';

interface PhotoPlanModalsProps {
  isNamingOpen: boolean;
  onCloseNaming: () => void;
  activeCategoryName: string;
  activeCategoryTypeId: number;
  activeCategoryTypeCode?: string;
  activeCategoryImagesLength: number;
  activeCategoryImagesMaxOrder: number;
  isReplacement: boolean;
  isPhotoUploading: boolean;
  handleNamingSubmit: (
    name: string,
    order: number,
    typeId: number,
    file?: File,
    remarks?: string
  ) => void;
  replaceImage: AdditionalImage | null;
}

export function PhotoPlanModals({
  isNamingOpen,
  onCloseNaming,
  activeCategoryName,
  activeCategoryTypeId,
  activeCategoryTypeCode = '',
  activeCategoryImagesLength,
  activeCategoryImagesMaxOrder,
  isReplacement,
  isPhotoUploading,
  handleNamingSubmit,
  replaceImage,
}: PhotoPlanModalsProps): React.ReactElement {
  const defaultDisplayOrder = isReplacement && replaceImage
    ? (replaceImage.displayOrder ?? 1)
    : (activeCategoryTypeCode === 'CHANGE_DETECTION'
        ? (activeCategoryImagesLength === 1 && activeCategoryImagesMaxOrder === 1 ? 2 : 1)
        : (activeCategoryImagesLength ? activeCategoryImagesMaxOrder + 1 : 1));

  const defaultName = isReplacement && replaceImage
    ? replaceImage.title
    : (activeCategoryTypeCode === 'CHANGE_DETECTION'
        ? (defaultDisplayOrder === 2 ? 'NEW' : 'OLD')
        : activeCategoryName);

  return (
    <>
      {isNamingOpen && (
        <PhotoPlanNamingModal
          open
          onClose={onCloseNaming}
          onSubmit={handleNamingSubmit}
          availableTypes={[{ label: activeCategoryName, value: String(activeCategoryTypeId) }]}
          defaultDisplayOrder={defaultDisplayOrder}
          defaultName={defaultName}
          isReplacement={isReplacement}
          defaultPhotoTypeId={activeCategoryTypeId}
          photoTypeCode={activeCategoryTypeCode}
          isLoading={isPhotoUploading}
          defaultRemarks={isReplacement && replaceImage ? replaceImage.remarks : ''}
        />
      )}
    </>
  );
}
