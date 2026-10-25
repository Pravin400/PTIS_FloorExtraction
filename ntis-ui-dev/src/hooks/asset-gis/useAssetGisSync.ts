'use client';

import { useState, useEffect, useRef } from 'react';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { normalizeOwnerId } from '@/lib/utils/asset-gis-utils';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import {
  fetchAssetPhotoGalleryAction,
  fetchAssetDocumentsAction,
  fetchAssetDetailsAction,
  fetchBatchAssetPhotosAction,
} from '@/app/[locale]/assets/municipal-Asset/asset-register/actions';
import { getAssetPopupDetailsAction } from '@/app/[locale]/assets/gismapviewer/actions';
import { logger } from '@/lib/utils/logger';
import type { AssetGisDashboardProps } from '@/types/asset-gis.types';

export function useAssetGisSync(initialData?: AssetGisDashboardProps['initialData'], assetIdQuery?: string | null) {
  const activeModule = useCouncilBoundaryStore((s) => s.activeModule);
  const selectedProperty = useCouncilBoundaryStore((s) => s.selectedProperty) as Record<string, unknown> | null;
  const propertyDetail = useCouncilBoundaryStore((s) => s.propertyDetail) as Record<string, unknown> | null;
  const fetchPropertyDetail = useCouncilBoundaryStore((s) => s.fetchPropertyDetail);

  const [tenantIds, setTenantIds] = useState<string[]>([]);
  const [currentTenantIdx, setCurrentTenantIdx] = useState(0);
  const lastFetchedOwnerIdRef = useRef<string | number | null>(null);
  const lastFetchedAssetIdRef = useRef<string | number | null>(null);

  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [realAssetPhotos, setRealAssetPhotos] = useState<Array<{ url: string; label: string; type: 'photo' | 'plan' }>>([]);
  const [isLoadingRealPhotos, setIsLoadingRealPhotos] = useState(false);
  const [realAssetDocuments, setRealAssetDocuments] = useState<Array<Record<string, unknown>>>([]);
  const [isLoadingRealDocuments, setIsLoadingRealDocuments] = useState(false);
  const [hasRealAssetData, setHasRealAssetData] = useState(false);
  const [childAssets, setChildAssets] = useState<Array<Record<string, unknown>>>([]);
  const [isLoadingChildAssets, setIsLoadingChildAssets] = useState(false);
  const [childAssetPhotoMap, setChildAssetPhotoMap] = useState<Record<number, { photoUrl?: string; planUrl?: string; photoCount?: number; planCount?: number }>>({});
  const [childCarouselOverride, setChildCarouselOverride] = useState<Array<{ url: string; label: string }> | null>(null);

  // 1. SSR Initial Data Hydration
  useEffect(() => {
    const initDataRecord = (initialData && typeof initialData === 'object' && 'initData' in initialData ? initialData.initData : initialData) as Record<string, unknown> | undefined;
    const detail = (initDataRecord?.propertyDetail || initDataRecord?.deepLinkCoords) as Record<string, unknown> | Array<Record<string, unknown>> | undefined;
    if (!detail) return;

    const item = (Array.isArray(detail) ? (detail[0] || {}) : detail) as Record<string, unknown>;
    const lat = Number(item.latitude || item.Latitude || item.ASS_Latitude || item.assLatitude || item.lat || 0);
    const lng = Number(item.longitude || item.Longitude || item.ASS_Longitude || item.assLongitude || item.lng || 0);

    const payload = {
      ...item,
      assetId: item.assetId || assetIdQuery,
      id: item.assetId || item.id || assetIdQuery,
      assetNo: item.assetNo || item.mpmsid || assetIdQuery,
      MPMS_ID: item.mpmsid || item.assetNo || assetIdQuery,
      OwnerID: item.OwnerID || item.ownerID || item.ownerId || item.mpmsid || item.assetNo || assetIdQuery,
      latitude: lat,
      longitude: lng,
      ASS_Latitude: lat,
      ASS_Longitude: lng,
    };

    const store = useCouncilBoundaryStore.getState();
    store.setSelectedPropertyWithSource(payload, 'search');
    useCouncilBoundaryStore.setState({ propertyDetail: payload, polygonReady: true });

    queueMicrotask(() => {
      const photos = item.photos as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(photos) && photos.length > 0) {
        setHasRealAssetData(true);
        setRealAssetPhotos(
          photos.map((p: Record<string, unknown>) => ({
            url: (p.fileUrl || p.photoUrl || p.planUrl || (p.documentGuid ? `/api/documents/${p.documentGuid}/view` : (p.fileName ? `/api/documents/${p.fileName}` : ''))) as string,
            label: (p.label || p.photoTypeName || 'Asset Photo') as string,
            type: (p.photoType === 'plan' || (String(p.photoTypeName || '')).toLowerCase().includes('plan')) ? ('plan' as const) : ('photo' as const),
          })).filter((p: { url: string }) => Boolean(p.url))
        );
      }
      const docs = item.documents as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(docs) && docs.length > 0) {
        setRealAssetDocuments(
          docs.map((d: Record<string, unknown>) => ({
            id: d.documentId || d.id || d.documentBindingId,
            documentGuid: d.documentGuid,
            fileName: d.fileName || d.documentName || 'Document.pdf',
            name: d.documentName || d.fileName || 'Legal Document',
            documentTypeName: d.documentName || d.documentCode || 'Document',
            bindingPurpose: d.documentName,
            contentType: d.mimeType || d.contentType || 'application/pdf',
            customUrl: d.fileUrl || (d.documentGuid ? `/api/documents/${d.documentGuid}/download` : (d.fileName ? `/api/documents/${d.fileName}` : undefined)),
            fileSize: d.fileSizeBytes || d.fileSize,
          }))
        );
      }

      const mainId = normalizeOwnerId(payload.OwnerID || payload.assetId || payload.MPMS_ID || '');
      if (mainId) {
        setTenantIds([mainId]);
      }
    });
  }, [initialData, assetIdQuery]);

  // 2. Query Parameter Auto-selection
  useEffect(() => {
    if (!assetIdQuery) return;
    const cleanId = decodeURIComponent(assetIdQuery).trim();
    if (!cleanId) return;
    if (initialData?.propertyDetail && (initialData.propertyDetail as Record<string, unknown>).assetName) return;

    const payload = {
      assetId: cleanId,
      id: cleanId,
      MPMS_ID: cleanId,
      mpmsId: cleanId,
      assetNo: cleanId,
      AssetNo: cleanId,
      OwnerID: cleanId,
      ownerID: cleanId,
      BuildingID: cleanId,
      buildingID: cleanId
    };

    const store = useCouncilBoundaryStore.getState();
    store.setSelectedPropertyWithSource(payload, 'search');
  }, [assetIdQuery, initialData?.propertyDetail]);

  // 3. Selection change reset
  useEffect(() => {
    if (!selectedProperty) return;
    const mainId = normalizeOwnerId(String(selectedProperty.OwnerID || selectedProperty.ownerId || selectedProperty.ownerID || ''));
    if (mainId) {
      queueMicrotask(() => {
        setTenantIds([mainId]);
        setCurrentTenantIdx(0);
        setCarouselIndex(0);
        setFailedImages({});
      });
    }
  }, [selectedProperty]);

  // 4. Tenant list extraction from property detail
  useEffect(() => {
    const tenants = propertyDetail?.tenants as Array<Record<string, unknown>> | undefined;
    if (propertyDetail && tenants && Array.isArray(tenants) && tenants.length > 0) {
      const dbTenantIds = tenants
        .map((t: Record<string, unknown>) => normalizeOwnerId(String(t.ownerID || t.ownerId || '')))
        .filter((id: string) => id && id !== '0' && id !== 'null');

      if (dbTenantIds.length > 0 && JSON.stringify(dbTenantIds) !== JSON.stringify(tenantIds)) {
        queueMicrotask(() => {
          setTenantIds(dbTenantIds);
        });
      }
    }
  }, [propertyDetail, tenantIds]);

  // 5. Tenant Property Details Fetching
  useEffect(() => {
    if (!selectedProperty || activeModule === 'ASSET') return;
    const currentId = tenantIds[currentTenantIdx]
      || (selectedProperty.MPMS_ID as string)
      || (selectedProperty.mpms_id as string)
      || (selectedProperty.mpmsId as string)
      || (selectedProperty.MPMS_OWNER as string)
      || (selectedProperty.mpmsOwner as string)
      || (selectedProperty.OwnerID as string)
      || (selectedProperty.ownerId as string)
      || (selectedProperty.ownerID as string)
      || (selectedProperty.PtaxBuilID as string)
      || (selectedProperty.ptaxbuilid as string);

    if (currentId && lastFetchedOwnerIdRef.current !== currentId) {
      fetchPropertyDetail(currentId);
      lastFetchedOwnerIdRef.current = currentId;
    }
  }, [selectedProperty, currentTenantIdx, tenantIds, activeModule, fetchPropertyDetail]);

  // 6. Real Asset Media and Documents Fetching
  useEffect(() => {
    const data = selectedProperty;
    const lookupKey = activeModule === 'ASSET' && data
      ? (data.assetMasterId ?? data.AssetMasterId ?? data.assetId ?? data.AssetId ?? data.targetId ?? data.TargetId ?? data.id ?? data.Id ?? data.assetNo ?? data.AssetNo ?? data.MPMS_ID ?? data.mpmsId ?? data.OwnerID ?? data.ownerID) as string | number | undefined
      : null;

    if (!lookupKey || lookupKey === '0' || lookupKey === 'null') {
      lastFetchedAssetIdRef.current = null;
      queueMicrotask(() => {
        setRealAssetPhotos([]);
        setRealAssetDocuments([]);
        setChildAssets([]);
        setHasRealAssetData(false);
      });
      return;
    }

    if (lastFetchedAssetIdRef.current === lookupKey) return;
    lastFetchedAssetIdRef.current = lookupKey;

    let isMounted = true;
    setIsLoadingRealPhotos(true);
    setIsLoadingRealDocuments(true);
    setIsLoadingChildAssets(true);
    setHasRealAssetData(false);

    const loadAssetGis360 = async () => {
      try {
        const popupRes = await getAssetPopupDetailsAction(lookupKey);

        if (!isMounted) return;

        if (popupRes.success && popupRes.data) {
          const detail = popupRes.data;

          const currentStoreProp = useCouncilBoundaryStore.getState().propertyDetail;
          useCouncilBoundaryStore.setState({
            propertyDetail: {
              ...(currentStoreProp || {}),
              ...detail,
              assetId: detail.assetId,
              assetNo: detail.assetNo,
              assetName: detail.assetName,
              assetRegionalName: detail.assetRegionalName,
              address: detail.address,
              plotNo: detail.plotNo,
              citySurveyNo: detail.citySurveyNo,
              plotArea: detail.plotArea,
              parentAssetId: detail.parentAssetId,
              parentAssetName: detail.parentAssetName,
              parentAssetNo: detail.parentAssetNo,
              parentAddress: detail.parentAddress,
              childShops: detail.childUnits || detail.childShops,
              childUnits: detail.childUnits || detail.childShops,
            }
          });

          if (detail.photos && detail.photos.length > 0) {
            setHasRealAssetData(true);
            setRealAssetPhotos(
              (detail.photos as unknown as Array<Record<string, unknown>>)
                .map((p) => ({
                  url: String(p.fileUrl || (p.documentGuid ? getViewDocumentUrl(String(p.documentGuid)) : (p.fileName ? `/api/documents/${p.fileName}` : ''))),
                  label: String(p.label || p.photoTypeName || 'Asset Photo'),
                  type: (p.photoType === 'plan' || String(p.photoTypeName || '').toLowerCase().includes('plan')) ? 'plan' as const : 'photo' as const,
                }))
                .filter((p) => Boolean(p.url))
            );
          } else {
            setRealAssetPhotos([]);
          }

          if (detail.documents && detail.documents.length > 0) {
            setRealAssetDocuments(
              (detail.documents as unknown as Array<Record<string, unknown>>).map((d) => ({
                id: d.documentId,
                documentGuid: d.documentGuid,
                fileName: d.fileName || d.documentName || 'Document.pdf',
                name: d.documentName || d.fileName || 'Legal Document',
                documentTypeName: d.documentTypeName || d.documentDefinitionName || 'Document',
                bindingPurpose: d.documentDefinitionName,
                contentType: d.contentType || 'application/pdf',
                customUrl: d.fileUrl || (d.documentGuid ? `/api/documents/${d.documentGuid}/download` : (d.fileName ? `/api/documents/${d.fileName}` : undefined)),
              }))
            );
          } else {
            setRealAssetDocuments([]);
          }

          const rawChildren = (detail.childUnits || detail.childShops || []) as Array<Record<string, unknown>>;
          if (rawChildren.length > 0) {
            setChildAssets(rawChildren);
          } else if (selectedProperty?.childAssets && Array.isArray(selectedProperty.childAssets) && selectedProperty.childAssets.length > 0) {
            setChildAssets(selectedProperty.childAssets as Array<Record<string, unknown>>);
          } else if (selectedProperty?.childShops && Array.isArray(selectedProperty.childShops) && selectedProperty.childShops.length > 0) {
            setChildAssets(selectedProperty.childShops as Array<Record<string, unknown>>);
          }

          const childIds = rawChildren
            .map((c) => Number(c.id || c.assetId || c.AssetId))
            .filter((id) => Number.isFinite(id) && id > 0);

          if (childIds.length > 0) {
            try {
              const photoMap = await fetchBatchAssetPhotosAction(childIds.map(id => ({ id })));
              if (photoMap && isMounted) {
                setChildAssetPhotoMap(photoMap);
              }
            } catch (batchErr) {
              logger.warn('Batch photo fetch fallback:', { error: batchErr as Error });
            }
          }
          return;
        }

        const numericId = Number(lookupKey);
        if (Number.isFinite(numericId) && numericId > 0) {
          const [photosRes, docsRes, childRes] = await Promise.allSettled([
            fetchAssetPhotoGalleryAction(numericId),
            fetchAssetDocumentsAction(numericId),
            fetchAssetDetailsAction(numericId),
          ]);

          if (!isMounted) return;

          if (photosRes.status === 'fulfilled' && Array.isArray(photosRes.value) && photosRes.value.length > 0) {
            setHasRealAssetData(true);
            setRealAssetPhotos(photosRes.value);
          }

          if (docsRes.status === 'fulfilled' && docsRes.value && docsRes.value.success && docsRes.value.documents) {
            const docsList = docsRes.value.documents;
            if (Array.isArray(docsList) && docsList.length > 0) {
              setRealAssetDocuments(docsList);
            }
          }

          if (childRes.status === 'fulfilled' && childRes.value && childRes.value.success && childRes.value.data) {
            const assetDet = childRes.value.data as Record<string, unknown>;
            const rawChildren = ((assetDet.childUnits ?? assetDet.childShops ?? []) as Array<Record<string, unknown>>);
            if (rawChildren.length > 0) {
              setChildAssets(rawChildren);
            } else if (selectedProperty?.childAssets && Array.isArray(selectedProperty.childAssets) && selectedProperty.childAssets.length > 0) {
              setChildAssets(selectedProperty.childAssets as Array<Record<string, unknown>>);
            } else if (selectedProperty?.childShops && Array.isArray(selectedProperty.childShops) && selectedProperty.childShops.length > 0) {
              setChildAssets(selectedProperty.childShops as Array<Record<string, unknown>>);
            }
          }
        }
      } catch (err: unknown) {
        logger.error('[useAssetGisSync] Failed to fetch 360 asset details:', { error: err as Error });
      } finally {
        if (isMounted) {
          setIsLoadingRealPhotos(false);
          setIsLoadingRealDocuments(false);
          setIsLoadingChildAssets(false);
        }
      }
    };

    void loadAssetGis360();

    return () => {
      isMounted = false;
    };
  }, [activeModule, selectedProperty]);

  const handleOpenChildImageModal = (photos: Array<{ url: string; label: string }>, clickedUrl: string) => {
    if (!photos || photos.length === 0) return;
    setChildCarouselOverride(photos);
    const clickedIdx = photos.findIndex((p) => p.url === clickedUrl);
    setCarouselIndex(clickedIdx >= 0 ? clickedIdx : 0);
    setImageModalUrl(clickedUrl);
  };

  const handleCloseImageModal = () => {
    setImageModalUrl(null);
    setChildCarouselOverride(null);
  };

  return {
    tenantIds,
    currentTenantIdx,
    setCurrentTenantIdx,
    imageModalUrl,
    setImageModalUrl,
    carouselIndex,
    setCarouselIndex,
    failedImages,
    setFailedImages,
    realAssetPhotos,
    isLoadingRealPhotos,
    realAssetDocuments,
    isLoadingRealDocuments,
    hasRealAssetData,
    childAssets,
    isLoadingChildAssets,
    childAssetPhotoMap,
    childCarouselOverride,
    handleOpenChildImageModal,
    handleCloseImageModal,
  };
}
