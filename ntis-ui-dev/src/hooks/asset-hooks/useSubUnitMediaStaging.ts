/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchAssetPhotosAction, fetchAssetPhotoTypesAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/asset-photos.actions';
import { buildInitialPhotoSlots, buildInitialPhotos } from '@/lib/utils/asset-utils/media-utils';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';

// Fetches photo types + existing DB photos for the unit this hook instance was
// created for. The host (SubUnitDetailedConfigurator) is now remounted via a
// `key={unit.dbId ?? unit.id}` prop at all 4 call sites (ChildAssetDrawer,
// RoomWiseSubmissionStep, UnitPoolPanel, StandaloneSubUnitStep) whenever the
// active unit changes, so this hook only ever runs for one fixed unit during
// its lifetime — the mount-time load below is a one-shot initial fetch, not a
// reactive re-fetch keyed off unit identity changing under it.
export function useSubUnitMediaStaging(unit: any, staged: any) {
  const [stagedFiles, setStagedFiles] = useState<Record<string, File[]>>(() => {
    return (staged as any)?.stagedFiles || unit.stagedFiles || {};
  });

  const [availableTypes, setAvailableTypes] = useState<PropertyPhotoTypeWithStatusDto[]>([]);
  const [existingDbPhotos, setExistingDbPhotos] = useState<PropertyPhotoDto[]>([]);
  const [isFetchingDb, setIsFetchingDb] = useState(true);

  const lastLoadedIdRef = useRef<number | null>(null);

  const subUnitAssetId = Number(unit.dbId || unit.id || unit.assetId || 0);
  
  const loadExistingDocuments = useCallback(async () => {
    setIsFetchingDb(true);
    try {
      const catId = unit.categoryId || (unit as any).assetCategoryId || (staged as any)?.categoryId || 1;
      const typeId = unit.typeId || (unit as any).assetTypeId || (staged as any)?.typeId || 2;
      const typesRes = await fetchAssetPhotoTypesAction(subUnitAssetId, typeId, catId);
      const fetchedTypes: PropertyPhotoTypeWithStatusDto[] = (typesRes.success && typesRes.data) ? typesRes.data : [];
      setAvailableTypes(fetchedTypes);

      let fetchedDbPhotos: PropertyPhotoDto[] = [];
      if (subUnitAssetId > 0) {
        const photosRes = await fetchAssetPhotosAction(subUnitAssetId);
        if (photosRes.success && Array.isArray(photosRes.data)) {
          fetchedDbPhotos = [...photosRes.data];
        }
      }

      setExistingDbPhotos(fetchedDbPhotos);
    } catch (err) {
      console.error("Failed to fetch subunit photos", err);
    } finally {
      setIsFetchingDb(false);
    }
  }, [unit, staged, subUnitAssetId]);

  useEffect(() => {
    const currentId = Number(
      unit.assetId ??
      unit.AssetId ??
      unit.dbId ??
      unit.id ??
      (unit as any).subUnitsDetailsId ??
      0
    );
    if (currentId > 0 && lastLoadedIdRef.current === currentId) return;
    lastLoadedIdRef.current = currentId;
    loadExistingDocuments();
  }, [unit, loadExistingDocuments]);

  const initialPhotoSlots = useMemo(() => {
    return buildInitialPhotoSlots(
      availableTypes,
      existingDbPhotos,
      null,
      null,
      {},
      stagedFiles
    );
  }, [availableTypes, existingDbPhotos, stagedFiles]);

  const initialPhotos = useMemo(() => {
    return buildInitialPhotos(
      availableTypes,
      existingDbPhotos,
      subUnitAssetId,
      null,
      null,
      {},
      stagedFiles
    );
  }, [availableTypes, existingDbPhotos, subUnitAssetId, stagedFiles]);

  const handleFileStaged = useCallback((photoTypeCode: string, file: File) => {
    setStagedFiles((prev) => {
      const existing = prev[photoTypeCode] || [];
      if (existing.includes(file)) return prev;
      return {
        ...prev,
        [photoTypeCode]: [...existing, file],
      };
    });
  }, []);

  const handleFileUnstaged = useCallback((photoTypeCode: string, fileOrIndex: File | number) => {
    setStagedFiles((prev) => {
      if (!prev[photoTypeCode]) return prev;
      return {
        ...prev,
        [photoTypeCode]: typeof fileOrIndex === 'number'
          ? prev[photoTypeCode].filter((_, i) => i !== fileOrIndex)
          : prev[photoTypeCode].filter((f) => f !== fileOrIndex),
      };
    });
  }, []);

  const handleFileReplaced = useCallback((
    photoTypeCode: string,
    newFile: File,
    oldFile?: File,
    targetImg?: any,
    index?: number
  ) => {
    const targetDbId = targetImg?.propertyPhotoId || targetImg?.photoId;
    const targetDocGuid = targetImg?.documentGuid;
    const targetSrc = targetImg?.src;
    const targetPhotoTypeId = targetImg?.photoTypeId;

    setExistingDbPhotos((prev) =>
      prev.filter((p) => {
        if (targetDbId && (p.propertyPhotoId === targetDbId || (p as any).photoId === targetDbId)) return false;
        if (targetDocGuid && p.documentGuid === targetDocGuid) return false;
        if (targetSrc && (p.viewUrl === targetSrc || p.downloadUrl === targetSrc)) return false;
        if (targetPhotoTypeId && p.photoTypeId === targetPhotoTypeId && (!p.displayOrder || p.displayOrder === targetImg?.displayOrder)) return false;
        return true;
      })
    );

    setStagedFiles((prev) => {
      const currentList: File[] = prev[photoTypeCode] || [];

      if (oldFile && currentList.includes(oldFile)) {
        return {
          ...prev,
          [photoTypeCode]: currentList.map((f) => (f === oldFile ? newFile : f)),
        };
      }

      const dbPhotosInCat = existingDbPhotos.filter(
        (p) => p.photoTypeCode === photoTypeCode || p.photoTypeId === targetPhotoTypeId
      );
      const stagedIndex =
        typeof index === 'number' && index >= dbPhotosInCat.length ? index - dbPhotosInCat.length : -1;

      if (stagedIndex >= 0 && stagedIndex < currentList.length) {
        const updated = [...currentList];
        updated[stagedIndex] = newFile;
        return {
          ...prev,
          [photoTypeCode]: updated,
        };
      }

      if (currentList.length === 0) {
        return {
          ...prev,
          [photoTypeCode]: [newFile],
        };
      }

      return {
        ...prev,
        [photoTypeCode]: [...currentList, newFile],
      };
    });
  }, [existingDbPhotos]);

  return {
    stagedFiles,
    setStagedFiles,
    availableTypes,
    existingDbPhotos,
    isFetchingDb,
    initialPhotoSlots,
    initialPhotos,
    handleFileStaged,
    handleFileUnstaged,
    handleFileReplaced,
  };
}
