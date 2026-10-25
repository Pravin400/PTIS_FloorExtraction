import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PhotoCategory } from '@/types/asset/media.types';
import { mergeCategories } from '@/lib/utils/asset-utils/asset-photo-plan-localization';
import { usePhotoPlanMutations } from './useAssetPhotoPlanMutations';
import { useAssetPhotoPlanViewerNav } from './useAssetPhotoPlanViewerNav';
import { useMediaDrawerState } from '@/hooks/ptis/photoplan/useMediaDrawerState';
import {
  resolveInitialImageIndex,
  resolveInitialViewMode,
  resolveCategorySwitchState,
  resolveResyncState,
  type ViewMode,
} from '@/lib/utils/asset-utils/new-add-new-asset/basic-info/photo-plan-viewer-state.utils';
import type { UsePhotoPlanDrawerStateProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function usePhotoPlanDrawerState({
  categories,
  onCategoriesChange,
  propertyId,
  initialCategoryIndex = 0,
  onFileStaged,
  onFileUnstaged,
  onFileReplaced,
  onDbPhotoRemoved,
}: UsePhotoPlanDrawerStateProps) {
  const { openDrawer } = useMediaDrawerState();
  const searchParams = useSearchParams();

  const [selectedCategoryIndex, setSelectedCategoryIndexState] = useState(() =>
    initialCategoryIndex >= 0 && initialCategoryIndex < categories.length ? initialCategoryIndex : 0
  );

  const initialCat = categories[selectedCategoryIndex];

  const [selectedImageIndex, setSelectedImageIndexState] = useState<number | null>(() =>
    resolveInitialImageIndex(initialCat, searchParams)
  );

  const [viewMode, setViewModeState] = useState<ViewMode>(() =>
    resolveInitialViewMode(initialCat, searchParams)
  );

  const [rotation, setRotation] = useState(0);

  const [cachedCategories, setCachedCategories] = useState<PhotoCategory[]>(() =>
    categories.map((cat) => ({ ...cat, images: cat.images || [] }))
  );
  const [prevCategories, setPrevCategories] = useState<PhotoCategory[]>(categories);

  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setCachedCategories((prev) => mergeCategories(prev, categories));
  }

  const updateUrlParams = useCallback((newParams: Record<string, string | null>) => {
    if (typeof window === 'undefined') return;
    const current = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) current.delete(key);
      else current.set(key, value);
    });
    window.history.replaceState(null, '', `${window.location.pathname}?${current.toString()}`);
  }, []);

  const setSelectedImageIndex = useCallback((idx: number | null) => setSelectedImageIndexState(idx), []);

  const setViewMode = useCallback((mode: ViewMode) => setViewModeState(mode), []);

  const setSelectedCategoryIndex = useCallback((idx: number) => {
    setSelectedCategoryIndexState(idx);
    const { imageIndex, viewMode: nextViewMode } = resolveCategorySwitchState(cachedCategories[idx]);
    setSelectedImageIndexState(imageIndex);
    setViewModeState(nextViewMode);
  }, [cachedCategories]);

  const setViewerIndexAndMode = useCallback((idx: number | null, mode: ViewMode) => {
    setSelectedImageIndexState(idx);
    setViewModeState(mode);
  }, []);

  const [prevInitialCategoryIndex, setPrevInitialCategoryIndex] = useState(initialCategoryIndex);

  if (initialCategoryIndex !== prevInitialCategoryIndex) {
    setPrevInitialCategoryIndex(initialCategoryIndex);
    setSelectedCategoryIndexState(initialCategoryIndex);
    const resynced = resolveResyncState(initialCategoryIndex, categories, searchParams);
    setSelectedImageIndexState(resynced.imageIndex);
    setViewModeState(resynced.viewMode);
  }

  useEffect(() => {
    updateUrlParams({
      photoCategoryIndex: selectedCategoryIndex.toString(),
      selectedImageIndex: selectedImageIndex !== null ? selectedImageIndex.toString() : null,
      viewMode,
    });
  }, [selectedCategoryIndex, selectedImageIndex, viewMode, updateUrlParams]);

  const activeCategory = cachedCategories[selectedCategoryIndex], activeCategoryId = activeCategory?.photoTypeId;

  const handleUpdate = useCallback((newCats: PhotoCategory[]) => { setCachedCategories(newCats); onCategoriesChange(newCats); }, [onCategoriesChange]);

  const mutations = usePhotoPlanMutations({
    propertyId,
    categories: cachedCategories,
    onCategoriesChange: handleUpdate,
    selectedCategoryIndex,
    selectedImageIndex,
    setSelectedImageIndex,
    viewMode,
    setViewMode,
    setViewerIndexAndMode,
    onFileStaged,
    onFileUnstaged,
    onFileReplaced,
    onDbPhotoRemoved,
  });

  const { handleAddPhoto } = mutations;

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      handleAddPhoto();
      updateUrlParams({ action: null });
    }
  }, [searchParams, handleAddPhoto, updateUrlParams]);

  const { handleNext, handlePrev, handleDownload } = useAssetPhotoPlanViewerNav(
    selectedImageIndex, activeCategory, setSelectedImageIndex, setRotation
  );

  return {
    selectedCategoryIndex, setSelectedCategoryIndex,
    selectedImageIndex, setSelectedImageIndex,
    viewMode, setViewMode,
    rotation, setRotation,
    cachedCategories, activeCategory, activeCategoryId,
    isLoadingPhotos: false, fetchError: null as string | null,
    loadPhotos: useCallback(async () => { }, []),
    mutations, isUploading: mutations.isUploading,
    handleNext, handlePrev, handleDownload, openDrawer,
  };
}

