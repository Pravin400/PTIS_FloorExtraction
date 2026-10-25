'use client';

import { useCallback, useState } from 'react';
import type { PropertyPhotoDto } from '@/types/asset/asset-register/media.types';
import { fetchGroupedAssetPhotosAction } from '@/app/[locale]/assets/municipal-Asset/asset-register/[categoryId]/action';
import { mapGroupedAssetPhotosToPanelPhotos } from '@/components/modules/assets/municipal-Asset/asset-register/registerMappers';

type UseAssetPhotoPanelParams = {
  isPanelVisible: boolean;
  togglePanel: () => void;
};

export function useAssetPhotoPanel({
  isPanelVisible,
  togglePanel,
}: UseAssetPhotoPanelParams) {
  const [panelPhotos, setPanelPhotos] = useState<PropertyPhotoDto[]>([]);
  const [isPhotosLoading, setIsPhotosLoading] = useState(false);
  const [activePhotoFetchAssetId, setActivePhotoFetchAssetId] = useState<number | null>(null);

  const openImagePanelByAssetId = useCallback(async (assetId: number) => {
    if (activePhotoFetchAssetId === assetId) {
      return;
    }

    setActivePhotoFetchAssetId(assetId);
    setIsPhotosLoading(true);
    setPanelPhotos([]);
    if (!isPanelVisible) {
      togglePanel();
    }
    try {
      const res = await fetchGroupedAssetPhotosAction(assetId);

      // Prevent race conditions: only update photos if this is still the active asset request
      setActivePhotoFetchAssetId((currentActiveId) => {
        if (currentActiveId === assetId && res?.success && res?.data) {
          const photos = mapGroupedAssetPhotosToPanelPhotos(res.data);
          setPanelPhotos(photos);
        }
        return currentActiveId;
      });
    } catch (error) {
      console.error('Error fetching asset photos:', error);
    } finally {
      setActivePhotoFetchAssetId((prev) => (prev === assetId ? null : prev));
      setIsPhotosLoading(false);
    }
  }, [activePhotoFetchAssetId, isPanelVisible, togglePanel]);

  const handlePanelToggle = useCallback((onClosed?: () => void) => {
    const nextVisible = !isPanelVisible;
    togglePanel();
    if (!nextVisible) {
      onClosed?.();
      setPanelPhotos([]);
    }
  }, [isPanelVisible, togglePanel]);

  const closePanelFromQueryTransition = useCallback(() => {
    togglePanel();
    setPanelPhotos([]);
  }, [togglePanel]);

  return {
    panelPhotos,
    isPhotosLoading,
    openImagePanelByAssetId,
    handlePanelToggle,
    closePanelFromQueryTransition,
  };
}
