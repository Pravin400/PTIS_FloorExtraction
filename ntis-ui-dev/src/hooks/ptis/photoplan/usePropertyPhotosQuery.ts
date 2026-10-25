'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';
import { getPhotoSlotsAction, getPropertyPhotosAction } from '@/app/[locale]/property-tax/ptis/media-fetch.action';
import { getPropertyPhotoTypesByScopeAction } from '@/app/[locale]/property-tax/ptis/PhotoPlanType.action';
import { getWingPhotoTypesWithStatusAction, getPhotosByWingAction } from '@/app/[locale]/property-tax/ptis/WingPhoto.action';
import { getPhotosBySocietyAction, getSocietyPhotoTypesWithStatusAction } from '@/app/[locale]/property-tax/ptis/SocietyPhoto.action';
import { getViewDocumentUrl, getDownloadDocumentUrl } from '@/lib/utils/document-utils';
import { useSearchParams } from 'next/navigation';

export interface UsePropertyPhotosQueryResult {
  loading: boolean;
  photoSlots: PropertyPhotoTypeWithStatusDto[];
  photos: PropertyPhotoDto[];
  error: string | null;
  refetch: () => Promise<void>;
  setPhotoSlots: React.Dispatch<React.SetStateAction<PropertyPhotoTypeWithStatusDto[]>>;
  setPhotos: React.Dispatch<React.SetStateAction<PropertyPhotoDto[]>>;
}

const isPlanPhotoItem = (item: { photoTypeCode?: string; photoTypeName?: string; photoTypeId?: number }) =>
  item.photoTypeId === 13 ||
  Boolean(item.photoTypeCode?.toUpperCase().includes('PLAN')) ||
  Boolean(item.photoTypeName?.toLowerCase().includes('plan'));

export function areSlotsEqual(a: PropertyPhotoTypeWithStatusDto[], b: PropertyPhotoTypeWithStatusDto[]) {
  if (a.length !== b.length) return false;
  return a.every((slot, i) => {
    const other = b[i];
    return (
      slot.photoTypeId === other?.photoTypeId &&
      slot.photoTypeCode === other?.photoTypeCode &&
      slot.hasPhoto === other?.hasPhoto &&
      slot.photoCount === other?.photoCount &&
      slot.propertyPhotoId === other?.propertyPhotoId &&
      slot.viewUrl === other?.viewUrl
    );
  });
}

export function arePhotosEqual(a: PropertyPhotoDto[], b: PropertyPhotoDto[]) {
  if (a.length !== b.length) return false;
  return a.every((photo, i) => {
    const other = b[i];
    return (
      photo.propertyPhotoId === other?.propertyPhotoId &&
      photo.photoTypeId === other?.photoTypeId &&
      photo.photoTypeCode === other?.photoTypeCode &&
      photo.viewUrl === other?.viewUrl &&
      photo.downloadUrl === other?.downloadUrl &&
      photo.documentGuid === other?.documentGuid &&
      photo.displayOrder === other?.displayOrder &&
      photo.remarks === other?.remarks &&
      photo.fileName === other?.fileName &&
      photo.mimeType === other?.mimeType &&
      photo.wingDetailId === other?.wingDetailId &&
      photo.wingName === other?.wingName &&
      photo.societyDetailId === other?.societyDetailId
    );
  });
}

let cachedPropTypesPromise: Promise<{ success: boolean; data?: import('@/types/photoplan.types').PropertyPhotoTypeRecord[] }> | null = null;

function getCachedPropertyPhotoTypes(): Promise<{ success: boolean; data?: import('@/types/photoplan.types').PropertyPhotoTypeRecord[] }> {
  if (!cachedPropTypesPromise) {
    cachedPropTypesPromise = getPropertyPhotoTypesByScopeAction('PROPERTY').then((res) => {
      if (!res.success) {
        cachedPropTypesPromise = null;
      }
      return res;
    });
  }
  return cachedPropTypesPromise;
}

export function usePropertyPhotosQuery(
  propertyId?: number,
  isPanelOpen?: boolean,
  isDrawerOpen?: boolean,
  initialPhotoSlots: PropertyPhotoTypeWithStatusDto[] = [],
  initialPhotos: PropertyPhotoDto[] = [],
  societyId?: number | null,
  societyPhotoFallbackGuid?: string,
  societyPhotoFallbackUrl?: string,
  propWingDetailId?: number | null,
  isMainProperty?: boolean
): UsePropertyPhotosQueryResult {
  const searchParams = useSearchParams();
  const [activeWingParams, setActiveWingParams] = useState<{
    wingId: number | null;
    wingDetailId: number | null;
    societyId: number | null;
  } | null>(null);

  useEffect(() => {
    const handleParamsChange = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, string | null>>).detail;
      if (!detail) return;
      const wId = detail.wingId ? Number(detail.wingId) : null;
      const wdId = detail.wingDetailId ? Number(detail.wingDetailId) : null;
      const sId = (detail.societyDetailId || detail.societyId) ? Number(detail.societyDetailId || detail.societyId) : null;
      setActiveWingParams({ wingId: wId, wingDetailId: wdId, societyId: sId });
    };
    window.addEventListener('ptis:wing-params-changed', handleParamsChange);
    return () => window.removeEventListener('ptis:wing-params-changed', handleParamsChange);
  }, []);

  const wingIdParam = (searchParams?.get('wingId') || searchParams?.get('wingid')) ? Number(searchParams.get('wingId') || searchParams.get('wingid')) : null;
  const wingDetailIdParam = (searchParams?.get('wingDetailId') || searchParams?.get('wingdetailid')) ? Number(searchParams.get('wingDetailId') || searchParams.get('wingdetailid')) : null;
  const effectiveWingDetailId = activeWingParams?.wingDetailId !== undefined
    ? activeWingParams.wingDetailId
    : (wingDetailIdParam ?? (propWingDetailId && propWingDetailId > 0 ? propWingDetailId : null));
  const effectiveWingId = activeWingParams?.wingId !== undefined ? activeWingParams.wingId : wingIdParam;
  const targetWingId = effectiveWingDetailId && effectiveWingDetailId > 0 ? effectiveWingDetailId : effectiveWingId;

  const searchSocietyId = (searchParams?.get('societyDetailId') || searchParams?.get('societydetailid') || searchParams?.get('societyId') || searchParams?.get('societyid'))
    ? Number(searchParams.get('societyDetailId') || searchParams.get('societydetailid') || searchParams.get('societyId') || searchParams.get('societyid'))
    : null;
  const targetSocietyId = activeWingParams?.societyId !== undefined ? activeWingParams.societyId : (societyId && societyId > 0 ? societyId : searchSocietyId);

  const currentKey = propertyId
    ? `${propertyId}:${targetWingId ?? 0}:${targetSocietyId ?? 0}:${isMainProperty ?? true}`
    : '';

  const hasInitialSlots = Boolean(propertyId && initialPhotoSlots.length > 0);
  const hasInitialPhotos = Boolean(propertyId && initialPhotos.length > 0);
  const hasCompleteInitialData = hasInitialSlots && hasInitialPhotos;

  const [slotsLoadedKey, setSlotsLoadedKey] = useState<string>(() =>
    hasInitialSlots ? currentKey : ''
  );
  const [photosLoadedKey, setPhotosLoadedKey] = useState<string>(() =>
    hasInitialPhotos ? currentKey : ''
  );
  const [photoSlots, setPhotoSlots] = useState<PropertyPhotoTypeWithStatusDto[]>(initialPhotoSlots);
  const [photos, setPhotos] = useState<PropertyPhotoDto[]>(initialPhotos);
  const [loading, setLoading] = useState<boolean>(() =>
    Boolean(propertyId && !hasCompleteInitialData)
  );
  const [error, setError] = useState<string | null>(null);

  const [prevInitialSlots, setPrevInitialSlots] = useState(initialPhotoSlots);
  const [prevInitialPhotos, setPrevInitialPhotos] = useState(initialPhotos);
  const lastFetchKeyRef = useRef<string | null>(hasCompleteInitialData ? currentKey : null);

  if (!areSlotsEqual(initialPhotoSlots, prevInitialSlots)) {
    setPrevInitialSlots(initialPhotoSlots);
    setPhotoSlots(initialPhotoSlots);
    if (initialPhotoSlots.length > 0 && currentKey) {
      setSlotsLoadedKey(currentKey);
    }
  }

  if (!arePhotosEqual(initialPhotos, prevInitialPhotos)) {
    setPrevInitialPhotos(initialPhotos);
    setPhotos(initialPhotos);
    if (initialPhotos.length > 0 && currentKey) {
      setPhotosLoadedKey(currentKey);
    }
  }

  const [prevPropertyId, setPrevPropertyId] = useState(propertyId);
  const isDifferentProperty = Boolean(propertyId && prevPropertyId && propertyId !== prevPropertyId);

  if (propertyId !== prevPropertyId) {
    setPrevPropertyId(propertyId);
    if (!propertyId) {
      setPhotoSlots([]);
      setPhotos([]);
      setSlotsLoadedKey('');
      setPhotosLoadedKey('');
      setLoading(false);
      setError(null);
    }
  }

  const isStale = Boolean(propertyId && (slotsLoadedKey !== currentKey || photosLoadedKey !== currentKey));
  const effectiveLoading = Boolean(
    propertyId &&
    (isDifferentProperty || (photoSlots.length === 0 && initialPhotoSlots.length === 0)) &&
    (loading || isStale)
  );
  const effectivePhotoSlots = isDifferentProperty
    ? []
    : (photoSlots.length > 0 ? photoSlots : initialPhotoSlots);
  const effectivePhotos = isDifferentProperty
    ? []
    : (photos.length > 0 ? photos : initialPhotos);

  useEffect(() => {
    if (!propertyId) {
      lastFetchKeyRef.current = null;
      return;
    }

    if (lastFetchKeyRef.current === currentKey) {
      return;
    }
    lastFetchKeyRef.current = currentKey;

    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout | undefined;

    void Promise.resolve().then(() => {
      if (!isSubscribed) return null;
      setLoading(true);
      setError(null);

      timeoutId = setTimeout(() => {
        if (isSubscribed) {
          setLoading(false);
          setError('Media request timed out. Please retry.');
        }
      }, 15000);

      const promises: Promise<unknown>[] = [
        getPhotoSlotsAction(propertyId),
        getPropertyPhotosAction(propertyId),
        getCachedPropertyPhotoTypes(),
      ];

      if (isMainProperty !== false && targetWingId && targetWingId > 0) {
        promises.push(getWingPhotoTypesWithStatusAction(targetWingId));
        promises.push(getPhotosByWingAction(targetWingId));
      } else {
        promises.push(Promise.resolve({ success: true, data: [] }));
        promises.push(Promise.resolve({ success: true, data: [] }));
      }

      if (isMainProperty !== false && targetSocietyId && targetSocietyId > 0) {
        promises.push(getSocietyPhotoTypesWithStatusAction(targetSocietyId));
        promises.push(getPhotosBySocietyAction(targetSocietyId));
      } else {
        promises.push(Promise.resolve({ success: true, data: [] }));
        promises.push(Promise.resolve({ success: true, data: [] }));
      }

      return Promise.allSettled(promises);
    })
      .then((settled) => {
        if (!settled || !isSubscribed) return;
        const [slotsSettled, photosSettled, propTypesSettled, wingSlotsSettled, wingPhotosSettled, socSlotsSettled, socPhotosSettled] = settled;

        const sRes = slotsSettled.status === 'fulfilled'
          ? (slotsSettled.value as { success: boolean; error?: string; data?: PropertyPhotoTypeWithStatusDto[] })
          : undefined;
        const pRes = photosSettled.status === 'fulfilled'
          ? (photosSettled.value as { success: boolean; error?: string; data?: PropertyPhotoDto[] })
          : undefined;

        const isSlotsSuccess = Boolean(sRes?.success);
        const isPhotosSuccess = Boolean(pRes?.success);

        if (!isSlotsSuccess && !isPhotosSuccess) {
          const errMessage =
            (sRes && !sRes.success ? sRes.error : null) ||
            (pRes && !pRes.success ? pRes.error : null) ||
            'Failed to load property media';
          setError(errMessage);
          return;
        }

        if (!isSlotsSuccess) {
          setError(sRes?.error || 'Failed to load photo slots');
        } else if (!isPhotosSuccess) {
          setError(pRes?.error || 'Failed to load property photos');
        }

        const slots = isSlotsSuccess ? [...(sRes?.data || [])] : [];
        const fetchedPhotos = isPhotosSuccess ? [...(pRes?.data || [])] : [];

        // Dynamically ensure all active slots from ptis.PropertyPhotoType for PROPERTY scope exist
        const pTypesRes = propTypesSettled.status === 'fulfilled'
          ? (propTypesSettled.value as { success: boolean; data?: import('@/types/photoplan.types').PropertyPhotoTypeRecord[] })
          : undefined;
        if (pTypesRes?.success && Array.isArray(pTypesRes.data)) {
          pTypesRes.data.forEach((pt) => {
            if (pt.isActive === false) return;
            const ptCode = (pt.photoTypeCode || '').toUpperCase();
            const existingIdx = slots.findIndex(
              (s) =>
                (s.photoTypeCode && s.photoTypeCode.toUpperCase() === ptCode) ||
                s.photoTypeId === pt.id
            );
            if (existingIdx === -1) {
              slots.push({
                photoTypeId: pt.id,
                photoTypeCode: pt.photoTypeCode,
                photoTypeName: pt.photoTypeName,
                photoScope: pt.photoScope || 'PROPERTY',
                displayOrder: pt.displayOrder || 1,
                hasPhoto: false,
                photoCount: 0,
              });
            } else {
              if (!slots[existingIdx].photoScope) {
                slots[existingIdx].photoScope = pt.photoScope || 'PROPERTY';
              }
            }
          });
        }

        const wingSlotsRes = wingSlotsSettled.status === 'fulfilled' ? (wingSlotsSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;
        const wingPhotosRes = wingPhotosSettled.status === 'fulfilled' ? (wingPhotosSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;
        const socSlotsRes = socSlotsSettled.status === 'fulfilled' ? (socSlotsSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;
        const socPhotosRes = socPhotosSettled.status === 'fulfilled' ? (socPhotosSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;

        const wSlotsRes = wingSlotsRes;
        if (wSlotsRes && wSlotsRes.success && wSlotsRes.data) {
          const mappedWingSlots = wSlotsRes.data.map((ws: Record<string, unknown>) => ({
            photoTypeId: Number(ws.photoTypeId),
            photoTypeCode: String(ws.photoTypeCode || ws.photoTypeSlotCode || ''),
            photoTypeName: String(ws.photoTypeName || ws.photoTypeSlotName || ''),
            displayOrder: Number(ws.displayOrder || 0),
            hasPhoto: Boolean(ws.hasPhoto),
            photoCount: Number(ws.photoCount || 0),
            propertyPhotoId: Number(ws.wingPhotoId || ws.propertyPhotoId || 0),
            remarks: ws.remarks ? String(ws.remarks) : undefined,
            documentBindingId: ws.documentBindingId ? Number(ws.documentBindingId) : undefined,
            documentGuid: ws.documentGuid ? String(ws.documentGuid) : undefined,
            fileName: ws.fileName ? String(ws.fileName) : undefined,
            mimeType: ws.mimeType ? String(ws.mimeType) : undefined,
            viewUrl: ws.viewUrl ? String(ws.viewUrl) : undefined
          }));
          mappedWingSlots.forEach(ws => {
            const existingIdx = slots.findIndex((s) => 
              (s.photoTypeCode && ws.photoTypeCode && s.photoTypeCode.toUpperCase() === ws.photoTypeCode.toUpperCase()) ||
              (s.photoTypeId === ws.photoTypeId && s.photoTypeCode?.toUpperCase().startsWith('WING_'))
            );
            if (existingIdx !== -1) {
              slots[existingIdx] = { ...slots[existingIdx], ...ws };
            } else {
              slots.push(ws as PropertyPhotoTypeWithStatusDto);
            }
          });
        }

        const wPhotosRes = wingPhotosRes as { success: boolean; data?: Record<string, unknown>[] } | undefined;
        if (wPhotosRes && wPhotosRes.success && wPhotosRes.data) {
          const mappedWingPhotos = wPhotosRes.data.map((wp: Record<string, unknown>) => ({
            propertyPhotoId: Number(wp.wingPhotoId || wp.propertyPhotoId || 0),
            propertyId: Number(wp.wingId || wp.propertyId || 0),
            photoTypeId: Number(wp.photoTypeId || 0),
            photoTypeCode: String(wp.photoTypeCode || ''),
            photoTypeName: String(wp.photoTypeName || ''),
            displayOrder: Number(wp.displayOrder || 0),
            remarks: wp.remarks ? String(wp.remarks) : undefined,
            documentBindingId: wp.documentBindingId ? Number(wp.documentBindingId) : undefined,
            documentGuid: wp.documentGuid ? String(wp.documentGuid) : undefined,
            fileName: wp.fileName ? String(wp.fileName) : undefined,
            mimeType: wp.mimeType ? String(wp.mimeType) : undefined,
            viewUrl: wp.viewUrl ? String(wp.viewUrl) : undefined,
            downloadUrl: wp.downloadUrl ? String(wp.downloadUrl) : undefined,
            wingDetailId: wp.wingDetailId ? Number(wp.wingDetailId) : undefined,
            wingName: wp.wingName ? String(wp.wingName) : undefined,
          }));
          mappedWingPhotos.filter(wp => !isPlanPhotoItem(wp)).forEach(wp => {
            const existingIdx = fetchedPhotos.findIndex((p) => 
              p.propertyPhotoId === wp.propertyPhotoId && 
              (p.wingDetailId === wp.wingDetailId || (!p.wingDetailId && !wp.wingDetailId))
            );
            if (existingIdx !== -1) {
              fetchedPhotos[existingIdx] = { ...fetchedPhotos[existingIdx], ...wp };
            } else {
              fetchedPhotos.push(wp as PropertyPhotoDto);
            }
          });
        }

        const sSlotsRes = socSlotsRes as { success: boolean; data?: Record<string, unknown>[] } | undefined;
        if (sSlotsRes && sSlotsRes.success && sSlotsRes.data) {
          const mappedSocSlots = sSlotsRes.data.map((ss: Record<string, unknown>) => ({
            photoTypeId: Number(ss.photoTypeId),
            photoTypeCode: String(ss.photoTypeCode || ss.photoTypeSlotCode || ''),
            photoTypeName: String(ss.photoTypeName || ss.photoTypeSlotName || ''),
            displayOrder: Number(ss.displayOrder || 0),
            hasPhoto: Boolean(ss.hasPhoto),
            photoCount: Number(ss.photoCount || 0),
            propertyPhotoId: Number(ss.societyPhotoId || ss.propertyPhotoId || 0),
            remarks: ss.remarks ? String(ss.remarks) : undefined,
            documentBindingId: ss.documentBindingId ? Number(ss.documentBindingId) : undefined,
            documentGuid: ss.documentGuid ? String(ss.documentGuid) : undefined,
            fileName: ss.fileName ? String(ss.fileName) : undefined,
            mimeType: ss.mimeType ? String(ss.mimeType) : undefined,
            viewUrl: ss.viewUrl ? String(ss.viewUrl) : undefined,
          }));
          mappedSocSlots.filter(ss => !isPlanPhotoItem(ss)).forEach(ss => {
            const existingIdx = slots.findIndex((s) => 
              (s.photoTypeCode && ss.photoTypeCode && s.photoTypeCode.toUpperCase() === ss.photoTypeCode.toUpperCase()) ||
              (s.photoTypeId === ss.photoTypeId && s.photoTypeCode?.toUpperCase().startsWith('SOCIETY_'))
            );
            if (existingIdx !== -1) {
              slots[existingIdx] = { ...slots[existingIdx], ...ss };
            } else {
              slots.push(ss as PropertyPhotoTypeWithStatusDto);
            }
          });
        }

        const sPhotosRes = socPhotosRes as { success: boolean; data?: Record<string, unknown>[] } | undefined;
        if (sPhotosRes && sPhotosRes.success && sPhotosRes.data) {
          const mappedSocPhotos = sPhotosRes.data.map((sp: Record<string, unknown>) => ({
            propertyPhotoId: Number(sp.societyPhotoId || sp.propertyPhotoId || 0),
            propertyId: Number(sp.societyId || sp.propertyId || 0),
            photoTypeId: Number(sp.photoTypeId || 0),
            photoTypeCode: String(sp.photoTypeCode || ''),
            photoTypeName: String(sp.photoTypeName || ''),
            displayOrder: Number(sp.displayOrder || 0),
            remarks: sp.remarks ? String(sp.remarks) : undefined,
            documentBindingId: sp.documentBindingId ? Number(sp.documentBindingId) : undefined,
            documentGuid: sp.documentGuid ? String(sp.documentGuid) : undefined,
            fileName: sp.fileName ? String(sp.fileName) : undefined,
            mimeType: sp.mimeType ? String(sp.mimeType) : undefined,
            viewUrl: sp.viewUrl ? String(sp.viewUrl) : undefined,
            downloadUrl: sp.downloadUrl ? String(sp.downloadUrl) : undefined,
            societyDetailId: targetSocietyId || undefined,
          }));
          mappedSocPhotos.filter(sp => !isPlanPhotoItem(sp)).forEach(sp => {
            const existingIdx = fetchedPhotos.findIndex((p) => 
              p.propertyPhotoId === sp.propertyPhotoId && 
              p.photoTypeCode?.toUpperCase() === sp.photoTypeCode?.toUpperCase()
            );
            if (existingIdx !== -1) {
              fetchedPhotos[existingIdx] = { ...fetchedPhotos[existingIdx], ...sp };
            } else {
              fetchedPhotos.push(sp as PropertyPhotoDto);
            }
          });
        }

        const isSocietyPhoto = (p: PropertyPhotoDto) => Boolean(
          p.photoTypeCode?.toUpperCase().includes('SOCIETY') ||
          p.photoTypeName?.toLowerCase().includes('society')
        );

        if (societyPhotoFallbackGuid || societyPhotoFallbackUrl) {
          const hasSoc = fetchedPhotos.some(isSocietyPhoto);
          if (!hasSoc) {
            const resolvedFallbackUrl = societyPhotoFallbackUrl || (societyPhotoFallbackGuid ? getViewDocumentUrl(societyPhotoFallbackGuid) : undefined);
            fetchedPhotos.push({
              propertyPhotoId: 0,
              propertyId: propertyId || 0,
              photoTypeId: 5,
              photoTypeCode: 'SOCIETY_PLACE',
              photoTypeName: 'Society Place Photo',
              displayOrder: 1,
              documentGuid: societyPhotoFallbackGuid,
              viewUrl: resolvedFallbackUrl,
              downloadUrl: societyPhotoFallbackGuid ? getDownloadDocumentUrl(societyPhotoFallbackGuid) : undefined,
              societyDetailId: targetSocietyId || undefined,
            });
          }
        }

        // Update society slot photo status according to whether matching photo exists
        const socPhotos = fetchedPhotos.filter(isSocietyPhoto);
        slots.forEach((slot, idx) => {
          const isSocSlot = Boolean(
            slot.photoTypeCode?.toUpperCase().includes('SOCIETY') ||
            slot.photoTypeName?.toLowerCase().includes('society')
          );
          if (isSocSlot) {
            const matchingSoc = socPhotos.find(
              (sp) =>
                (sp.photoTypeId && slot.photoTypeId && Number(sp.photoTypeId) === Number(slot.photoTypeId)) ||
                (sp.photoTypeCode && slot.photoTypeCode && sp.photoTypeCode.toUpperCase() === slot.photoTypeCode.toUpperCase())
            );
            if (matchingSoc) {
              slots[idx] = {
                ...slot,
                hasPhoto: true,
                documentGuid: matchingSoc.documentGuid || slot.documentGuid,
                viewUrl: matchingSoc.viewUrl || slot.viewUrl,
                propertyPhotoId: matchingSoc.propertyPhotoId || slot.propertyPhotoId,
              };
            } else {
              slots[idx] = {
                ...slot,
                hasPhoto: false,
                photoCount: 0,
                documentGuid: undefined,
                viewUrl: undefined,
                propertyPhotoId: undefined,
              };
            }
          }
        });

        if (isSlotsSuccess) {
          setPhotoSlots(slots);
          setSlotsLoadedKey(currentKey);
        }
        if (isPhotosSuccess) {
          setPhotos(fetchedPhotos);
          setPhotosLoadedKey(currentKey);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to load property media');
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (isSubscribed) setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      isSubscribed = false;
    };
  }, [propertyId, targetWingId, targetSocietyId, isPanelOpen, isDrawerOpen, societyPhotoFallbackGuid, societyPhotoFallbackUrl, isMainProperty, currentKey]);

  const refetch = useCallback(async () => {
    if (!propertyId) return;
    lastFetchKeyRef.current = `${propertyId}:${targetWingId ?? 0}:${targetSocietyId ?? 0}:${isMainProperty ?? true}`;
    setLoading(true);
    setError(null);
    try {
      const promises: Promise<unknown>[] = [
        getPhotoSlotsAction(propertyId),
        getPropertyPhotosAction(propertyId),
        getCachedPropertyPhotoTypes(),
      ];

      if (targetWingId && targetWingId > 0) {
        promises.push(getWingPhotoTypesWithStatusAction(targetWingId));
        promises.push(getPhotosByWingAction(targetWingId));
      } else {
        promises.push(Promise.resolve({ success: true, data: [] }));
        promises.push(Promise.resolve({ success: true, data: [] }));
      }

      if (targetSocietyId && targetSocietyId > 0) {
        promises.push(getSocietyPhotoTypesWithStatusAction(targetSocietyId));
        promises.push(getPhotosBySocietyAction(targetSocietyId));
      } else {
        promises.push(Promise.resolve({ success: true, data: [] }));
        promises.push(Promise.resolve({ success: true, data: [] }));
      }

      const [slotsSettled, photosSettled, propTypesSettled, wingSlotsSettled, wingPhotosSettled, socSlotsSettled, socPhotosSettled] = await Promise.allSettled(promises);

      const sRes = slotsSettled.status === 'fulfilled'
        ? (slotsSettled.value as { success: boolean; error?: string; data?: PropertyPhotoTypeWithStatusDto[] })
        : undefined;
      const pRes = photosSettled.status === 'fulfilled'
        ? (photosSettled.value as { success: boolean; error?: string; data?: PropertyPhotoDto[] })
        : undefined;

      const isSlotsSuccess = Boolean(sRes?.success);
      const isPhotosSuccess = Boolean(pRes?.success);

      if (!isSlotsSuccess && !isPhotosSuccess) {
        const errMessage =
          (sRes && !sRes.success ? sRes.error : null) ||
          (pRes && !pRes.success ? pRes.error : null) ||
          'Failed to reload property media';
        setError(errMessage);
        return;
      }

      if (!isSlotsSuccess) {
        setError(sRes?.error || 'Failed to reload photo slots');
      } else if (!isPhotosSuccess) {
        setError(pRes?.error || 'Failed to reload property photos');
      }

      const fetchedSlots = isSlotsSuccess ? [...(sRes?.data || [])] : [];
      const fetchedPhotos = isPhotosSuccess ? [...(pRes?.data || [])] : [];

      const pTypesRes = propTypesSettled.status === 'fulfilled'
        ? (propTypesSettled.value as { success: boolean; data?: import('@/types/photoplan.types').PropertyPhotoTypeRecord[] })
        : undefined;
      if (pTypesRes?.success && Array.isArray(pTypesRes.data)) {
        pTypesRes.data.forEach((pt) => {
          if (pt.isActive === false) return;
          const ptCode = (pt.photoTypeCode || '').toUpperCase();
          const existingIdx = fetchedSlots.findIndex(
            (s) =>
              (s.photoTypeCode && s.photoTypeCode.toUpperCase() === ptCode) ||
              s.photoTypeId === pt.id
          );
          if (existingIdx === -1) {
            fetchedSlots.push({
              photoTypeId: pt.id,
              photoTypeCode: pt.photoTypeCode,
              photoTypeName: pt.photoTypeName,
              photoScope: pt.photoScope || 'PROPERTY',
              displayOrder: pt.displayOrder || 1,
              hasPhoto: false,
              photoCount: 0,
            });
          } else {
            if (!fetchedSlots[existingIdx].photoScope) {
              fetchedSlots[existingIdx].photoScope = pt.photoScope || 'PROPERTY';
            }
          }
        });
      }

      const wingSlotsRes = wingSlotsSettled.status === 'fulfilled' ? (wingSlotsSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;
      const wingPhotosRes = wingPhotosSettled.status === 'fulfilled' ? (wingPhotosSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;
      const socSlotsRes = socSlotsSettled.status === 'fulfilled' ? (socSlotsSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;
      const socPhotosRes = socPhotosSettled.status === 'fulfilled' ? (socPhotosSettled.value as { success: boolean; data?: Record<string, unknown>[] }) : undefined;

      const wSlotsRes = wingSlotsRes;
      if (wSlotsRes && wSlotsRes.success && wSlotsRes.data) {
        const mappedWingSlots = wSlotsRes.data.map((ws: Record<string, unknown>) => ({
          photoTypeId: Number(ws.photoTypeId),
          photoTypeCode: String(ws.photoTypeCode || ws.photoTypeSlotCode || ''),
          photoTypeName: String(ws.photoTypeName || ws.photoTypeSlotName || ''),
          displayOrder: Number(ws.displayOrder || 0),
          hasPhoto: Boolean(ws.hasPhoto),
          photoCount: Number(ws.photoCount || 0),
          propertyPhotoId: Number(ws.wingPhotoId || ws.propertyPhotoId || 0),
          remarks: ws.remarks ? String(ws.remarks) : undefined,
          documentBindingId: ws.documentBindingId ? Number(ws.documentBindingId) : undefined,
          documentGuid: ws.documentGuid ? String(ws.documentGuid) : undefined,
          fileName: ws.fileName ? String(ws.fileName) : undefined,
          mimeType: ws.mimeType ? String(ws.mimeType) : undefined,
          viewUrl: ws.viewUrl ? String(ws.viewUrl) : undefined
        }));
        mappedWingSlots.forEach(ws => {
          const existingIdx = fetchedSlots.findIndex((s) => 
            (s.photoTypeCode && ws.photoTypeCode && s.photoTypeCode.toUpperCase() === ws.photoTypeCode.toUpperCase()) ||
            (s.photoTypeId === ws.photoTypeId && s.photoTypeCode?.toUpperCase().startsWith('WING_'))
          );
          if (existingIdx !== -1) {
            fetchedSlots[existingIdx] = { ...fetchedSlots[existingIdx], ...ws };
          } else {
            fetchedSlots.push(ws as PropertyPhotoTypeWithStatusDto);
          }
        });
      }

      const wPhotosRes = wingPhotosRes as { success: boolean; data?: Record<string, unknown>[] } | undefined;
      if (wPhotosRes && wPhotosRes.success && wPhotosRes.data) {
        const mappedWingPhotos = wPhotosRes.data.map((wp: Record<string, unknown>) => ({
          propertyPhotoId: Number(wp.wingPhotoId || wp.propertyPhotoId || 0),
          propertyId: Number(wp.wingId || wp.propertyId || 0),
          photoTypeId: Number(wp.photoTypeId || 0),
          photoTypeCode: String(wp.photoTypeCode || ''),
          photoTypeName: String(wp.photoTypeName || ''),
          displayOrder: Number(wp.displayOrder || 0),
          remarks: wp.remarks ? String(wp.remarks) : undefined,
          documentBindingId: wp.documentBindingId ? Number(wp.documentBindingId) : undefined,
          documentGuid: wp.documentGuid ? String(wp.documentGuid) : undefined,
          fileName: wp.fileName ? String(wp.fileName) : undefined,
          mimeType: wp.mimeType ? String(wp.mimeType) : undefined,
          viewUrl: wp.viewUrl ? String(wp.viewUrl) : undefined,
          downloadUrl: wp.downloadUrl ? String(wp.downloadUrl) : undefined,
          wingDetailId: wp.wingDetailId ? Number(wp.wingDetailId) : undefined,
          wingName: wp.wingName ? String(wp.wingName) : undefined,
        }));
        mappedWingPhotos.filter(wp => !isPlanPhotoItem(wp)).forEach(wp => {
          const existingIdx = fetchedPhotos.findIndex((p) => 
            p.propertyPhotoId === wp.propertyPhotoId && 
            (p.wingDetailId === wp.wingDetailId || (!p.wingDetailId && !wp.wingDetailId))
          );
          if (existingIdx !== -1) {
            fetchedPhotos[existingIdx] = { ...fetchedPhotos[existingIdx], ...wp };
          } else {
            fetchedPhotos.push(wp as PropertyPhotoDto);
          }
        });
      }

      const sSlotsRes = socSlotsRes as { success: boolean; data?: Record<string, unknown>[] } | undefined;
      if (sSlotsRes && sSlotsRes.success && sSlotsRes.data) {
        const mappedSocSlots = sSlotsRes.data.map((ss: Record<string, unknown>) => ({
          photoTypeId: Number(ss.photoTypeId),
          photoTypeCode: String(ss.photoTypeCode || ss.photoTypeSlotCode || ''),
          photoTypeName: String(ss.photoTypeName || ss.photoTypeSlotName || ''),
          displayOrder: Number(ss.displayOrder || 0),
          hasPhoto: Boolean(ss.hasPhoto),
          photoCount: Number(ss.photoCount || 0),
          propertyPhotoId: Number(ss.societyPhotoId || ss.propertyPhotoId || 0),
          remarks: ss.remarks ? String(ss.remarks) : undefined,
          documentBindingId: ss.documentBindingId ? Number(ss.documentBindingId) : undefined,
          documentGuid: ss.documentGuid ? String(ss.documentGuid) : undefined,
          fileName: ss.fileName ? String(ss.fileName) : undefined,
          mimeType: ss.mimeType ? String(ss.mimeType) : undefined,
          viewUrl: ss.viewUrl ? String(ss.viewUrl) : undefined,
        }));
        mappedSocSlots.filter(ss => !isPlanPhotoItem(ss)).forEach(ss => {
          const existingIdx = fetchedSlots.findIndex((s) => 
            (s.photoTypeCode && ss.photoTypeCode && s.photoTypeCode.toUpperCase() === ss.photoTypeCode.toUpperCase()) ||
            (s.photoTypeId === ss.photoTypeId && s.photoTypeCode?.toUpperCase().startsWith('SOCIETY_'))
          );
          if (existingIdx !== -1) {
            fetchedSlots[existingIdx] = { ...fetchedSlots[existingIdx], ...ss };
          } else {
            fetchedSlots.push(ss as PropertyPhotoTypeWithStatusDto);
          }
        });
      }

      const sPhotosRes = socPhotosRes as { success: boolean; data?: Record<string, unknown>[] } | undefined;
      if (sPhotosRes && sPhotosRes.success && sPhotosRes.data) {
        const mappedSocPhotos = sPhotosRes.data.map((sp: Record<string, unknown>) => ({
          propertyPhotoId: Number(sp.societyPhotoId || sp.propertyPhotoId || 0),
          propertyId: Number(sp.societyId || sp.propertyId || 0),
          photoTypeId: Number(sp.photoTypeId || 0),
          photoTypeCode: String(sp.photoTypeCode || ''),
          photoTypeName: String(sp.photoTypeName || ''),
          displayOrder: Number(sp.displayOrder || 0),
          remarks: sp.remarks ? String(sp.remarks) : undefined,
          documentBindingId: sp.documentBindingId ? Number(sp.documentBindingId) : undefined,
          documentGuid: sp.documentGuid ? String(sp.documentGuid) : undefined,
          fileName: sp.fileName ? String(sp.fileName) : undefined,
          mimeType: sp.mimeType ? String(sp.mimeType) : undefined,
          viewUrl: sp.viewUrl ? String(sp.viewUrl) : undefined,
          downloadUrl: sp.downloadUrl ? String(sp.downloadUrl) : undefined,
          societyDetailId: targetSocietyId || undefined,
        }));
        mappedSocPhotos.filter(sp => !isPlanPhotoItem(sp)).forEach(sp => {
          const existingIdx = fetchedPhotos.findIndex((p) => 
            p.propertyPhotoId === sp.propertyPhotoId && 
            p.photoTypeCode?.toUpperCase() === sp.photoTypeCode?.toUpperCase()
          );
          if (existingIdx !== -1) {
            fetchedPhotos[existingIdx] = { ...fetchedPhotos[existingIdx], ...sp };
          } else {
            fetchedPhotos.push(sp as PropertyPhotoDto);
          }
        });
      }

      const isSocietyPhoto = (p: PropertyPhotoDto) => Boolean(
        p.photoTypeCode?.toUpperCase().includes('SOCIETY') ||
        p.photoTypeName?.toLowerCase().includes('society')
      );
      const socPhotos = fetchedPhotos.filter(isSocietyPhoto);
      fetchedSlots.forEach((slot, idx) => {
        const isSocSlot = Boolean(
          slot.photoTypeCode?.toUpperCase().includes('SOCIETY') ||
          slot.photoTypeName?.toLowerCase().includes('society')
        );
        if (isSocSlot) {
          const matchingSoc = socPhotos.find(
            (sp) =>
              (sp.photoTypeId && slot.photoTypeId && Number(sp.photoTypeId) === Number(slot.photoTypeId)) ||
              (sp.photoTypeCode && slot.photoTypeCode && sp.photoTypeCode.toUpperCase() === slot.photoTypeCode.toUpperCase())
          );
          if (matchingSoc) {
            fetchedSlots[idx] = {
              ...slot,
              hasPhoto: true,
              documentGuid: matchingSoc.documentGuid || slot.documentGuid,
              viewUrl: matchingSoc.viewUrl || slot.viewUrl,
              propertyPhotoId: matchingSoc.propertyPhotoId || slot.propertyPhotoId,
            };
          } else {
            fetchedSlots[idx] = {
              ...slot,
              hasPhoto: false,
              photoCount: 0,
              documentGuid: undefined,
              viewUrl: undefined,
              propertyPhotoId: undefined,
            };
          }
        }
      });

      if (isSlotsSuccess) {
        setPhotoSlots(fetchedSlots);
      }
      if (isPhotosSuccess) {
        setPhotos(fetchedPhotos);
      }
      if (isSlotsSuccess && isPhotosSuccess) {
        const key = lastFetchKeyRef.current || currentKey;
        setSlotsLoadedKey(key);
        setPhotosLoadedKey(key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload property media');
    } finally {
      setLoading(false);
    }
  }, [propertyId, targetWingId, targetSocietyId, isMainProperty, currentKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMediaUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId?: number; societyDetailId?: number; societyId?: number }>;
      const updatedPropId = customEvent.detail?.propertyId;
      if (updatedPropId && propertyId && updatedPropId !== propertyId) return;

      if (propertyId) {
        void refetch();
      }
    };

    window.addEventListener('ptis:media-updated', handleMediaUpdated);
    return () => window.removeEventListener('ptis:media-updated', handleMediaUpdated);
  }, [propertyId, refetch]);

  return {
    loading: effectiveLoading,
    photoSlots: effectivePhotoSlots,
    photos: effectivePhotos,
    error,
    refetch,
    setPhotoSlots,
    setPhotos,
  };
}
