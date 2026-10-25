'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type {
  AssetRegisterRow,
  AssetRegisterTableProps,
} from '@/types/asset/asset-register/municipal-asset-register.types';
import {
  useAssetRegisterQueryState,
  VIEW_IMAGE_QUERY_KEY,
} from '@/hooks/asset/asset-register/useAssetRegisterQueryState';
import { useQueryTransition } from '@/hooks/useQueryTransition';
import { AssetRegisterTableContent } from './table/AssetRegisterTableContent';
import { AssetRegisterTablePagination } from './table/AssetRegisterTablePagination';
import { useSubunitPaginationState } from './table/useSubunitPaginationState';
import { AssetDocumentsModal, type AssetDocumentModalItem } from './media/AssetDocumentsModal';
import { fetchAssetDocumentsAction } from '@/app/[locale]/assets/municipal-Asset/asset-register/actions';

export function AssetRegisterTable({
  assets,
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  controls,
  initialSubunitData,
}: AssetRegisterTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('assetRegister');
  const { updateQueries } = useQueryTransition();

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedAssetForDocs, setSelectedAssetForDocs] = useState<AssetRegisterRow | null>(null);
  const [modalDocumentItems, setModalDocumentItems] = useState<AssetDocumentModalItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [initialDocMediaType, setInitialDocMediaType] = useState<'photo' | 'document'>('photo');
  const documentRequestIdRef = useRef(0);

  const activeViewImageAssetId = useMemo(() => {
    const raw = searchParams.get(VIEW_IMAGE_QUERY_KEY);
    if (!raw) return null;
    const p = Number(raw);
    return Number.isFinite(p) && p > 0 ? p : null;
  }, [searchParams]);

  const activeExpandAssetId = useMemo(() => {
    const raw = searchParams.get('expandAssetId');
    if (!raw) return null;
    const p = Number(raw);
    return Number.isFinite(p) && p > 0 ? p : null;
  }, [searchParams]);

  // Derive openSubunitRows directly from current URL query
  const [openSubunitRows, setOpenSubunitRows] = useState<Record<number, boolean>>(() => {
    return activeExpandAssetId ? { [activeExpandAssetId]: true } : {};
  });

  const { updateActionQuery } = useAssetRegisterQueryState({
    searchParams,
    pathname,
    isPanelVisible: isDocModalOpen,
    onClosePanelFromQuery: () => {
      documentRequestIdRef.current += 1;
      setIsDocModalOpen(false);
      setSelectedAssetForDocs(null);
      setModalDocumentItems([]);
      setIsLoadingDocs(false);
    },
    setOpenSubunitRows,
  });

  // Restore selected asset and documents modal when viewImageAssetId is present in the URL
  useEffect(() => {
    if (activeViewImageAssetId == null) return;
    if (selectedAssetForDocs?.id === activeViewImageAssetId && isDocModalOpen) return;

    const matchedAsset = assets.find((a) => a.id === activeViewImageAssetId);
    const rowToUse: AssetRegisterRow = matchedAsset || { id: activeViewImageAssetId, assetCode: String(activeViewImageAssetId) } as AssetRegisterRow;

    const requestId = ++documentRequestIdRef.current;
    queueMicrotask(() => {
      if (requestId === documentRequestIdRef.current) {
        setSelectedAssetForDocs(rowToUse);
        setIsDocModalOpen(true);
        setModalDocumentItems([]);
        setIsLoadingDocs(true);
      }
    });

    fetchAssetDocumentsAction(rowToUse.id!, rowToUse.csn || rowToUse.assetCode)
      .then((res) => {
        if (requestId === documentRequestIdRef.current && res.success && Array.isArray(res.documents)) {
          const mapped: AssetDocumentModalItem[] = res.documents.map((doc, index: number) => ({
            id: String(doc.id || doc.documentGuid || index),
            name: String(doc.fileName || doc.name || `Document ${index + 1}`),
            groupName: String(doc.documentTypeName || doc.photoTypeName || doc.bindingPurpose || 'Document'),
            fileName: doc.fileName ? String(doc.fileName) : undefined,
            contentType: doc.contentType ? String(doc.contentType) : undefined,
            isPdf: doc.contentType === 'application/pdf' || String(doc.fileName || '').toLowerCase().endsWith('.pdf'),
            isImage: String(doc.contentType || '').toLowerCase().startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(doc.fileName || '')),
            url: typeof doc.customUrl === 'string' ? doc.customUrl : undefined,
          }));
          setModalDocumentItems(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load asset documents for query asset ID:', err);
      })
      .finally(() => {
        if (requestId === documentRequestIdRef.current) {
          setIsLoadingDocs(false);
        }
      });
  }, [activeViewImageAssetId, assets, isDocModalOpen, selectedAssetForDocs?.id]);

  // Derive expanded sub-units from SSR props
  const expandedAssets = useMemo(() => {
    if (initialSubunitData && initialSubunitData.parentId === activeExpandAssetId) {
      return { [initialSubunitData.parentId]: initialSubunitData.items };
    }
    return {};
  }, [initialSubunitData, activeExpandAssetId]);

  const subunitMeta = useMemo(() => {
    if (initialSubunitData && initialSubunitData.parentId === activeExpandAssetId) {
      return { [initialSubunitData.parentId]: initialSubunitData.meta };
    }
    return {};
  }, [initialSubunitData, activeExpandAssetId]);

  const {
    subunitSearchMap,
    subunitPageSizeMap,
    subunitPageMap,
    handleSubunitSearchChange,
    handleSubunitPageSizeChange,
    handleSubunitPageChange,
  } = useSubunitPaginationState();

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateQueries({ page: String(newPage) });
    },
    [updateQueries]
  );

  const handlePageSizeChange = (newSize: number) => {
    updateQueries({ pageSize: String(newSize), page: '1' });
  };

  const handleViewImage = useCallback(
    async (row: AssetRegisterRow, mediaType: 'photo' | 'document' = 'photo') => {
      if (row.id == null) return;
      const requestId = ++documentRequestIdRef.current;
      setSelectedAssetForDocs(row);
      setInitialDocMediaType(mediaType);
      setIsDocModalOpen(true);
      setModalDocumentItems([]);
      setIsLoadingDocs(true);
      updateActionQuery(VIEW_IMAGE_QUERY_KEY, String(row.id));

      try {
        const res = await fetchAssetDocumentsAction(row.id, row.csn || row.assetCode);
        if (requestId === documentRequestIdRef.current && res.success && Array.isArray(res.documents)) {
          const mapped: AssetDocumentModalItem[] = res.documents.map((doc, index: number) => ({
            id: String(doc.id || doc.documentGuid || index),
            name: String(doc.fileName || doc.name || `Document ${index + 1}`),
            groupName: String(doc.documentTypeName || doc.photoTypeName || doc.bindingPurpose || 'Document'),
            fileName: doc.fileName ? String(doc.fileName) : undefined,
            contentType: doc.contentType ? String(doc.contentType) : undefined,
            isPdf: doc.contentType === 'application/pdf' || String(doc.fileName || '').toLowerCase().endsWith('.pdf'),
            isImage: String(doc.contentType || '').toLowerCase().startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(doc.fileName || '')),
            url: typeof doc.customUrl === 'string' ? doc.customUrl : undefined,
          }));
          setModalDocumentItems(mapped);
        }
      } catch (err) {
        console.error('Failed to load asset documents:', err);
      } finally {
        if (requestId === documentRequestIdRef.current) {
          setIsLoadingDocs(false);
        }
      }
    },
    [updateActionQuery]
  );

  const handleCloseDocModal = useCallback(() => {
    documentRequestIdRef.current += 1;
    setIsDocModalOpen(false);
    setSelectedAssetForDocs(null);
    setModalDocumentItems([]);
    setIsLoadingDocs(false);
    updateActionQuery(VIEW_IMAGE_QUERY_KEY, null);
  }, [updateActionQuery]);

  const handleToggleExpand = useCallback(
    (parentRow: AssetRegisterRow) => {
      const parentId = parentRow.id;
      if (parentId == null) return;

      if (openSubunitRows[parentId]) {
        setOpenSubunitRows((previous) => ({ ...previous, [parentId]: false }));
      }

      updateQueries({
        expandAssetId: openSubunitRows[parentId] ? null : String(parentId),
        subPage: null,
        subPageSize: null,
        subSearch: null,
      });
    },
    [openSubunitRows, setOpenSubunitRows, updateQueries]
  );

  const activeSubSearch = searchParams.get('subSearch') || '';
  const activeSubPageSize = Number(searchParams.get('subPageSize')) || 10;
  const activeSubPage = Number(searchParams.get('subPage')) || 1;

  const mergedSubunitSearchMap = useMemo(() => {
    if (activeExpandAssetId != null) {
      return { ...subunitSearchMap, [activeExpandAssetId]: activeSubSearch };
    }
    return subunitSearchMap;
  }, [subunitSearchMap, activeExpandAssetId, activeSubSearch]);

  const mergedSubunitPageSizeMap = useMemo(() => {
    if (activeExpandAssetId != null) {
      return { ...subunitPageSizeMap, [activeExpandAssetId]: activeSubPageSize };
    }
    return subunitPageSizeMap;
  }, [subunitPageSizeMap, activeExpandAssetId, activeSubPageSize]);

  const mergedSubunitPageMap = useMemo(() => {
    if (activeExpandAssetId != null) {
      return { ...subunitPageMap, [activeExpandAssetId]: activeSubPage };
    }
    return subunitPageMap;
  }, [subunitPageMap, activeExpandAssetId, activeSubPage]);

  const handleViewDetails = useCallback((row: AssetRegisterRow) => {
    if (row.id != null) {
      const segments = pathname.split('/').filter(Boolean);
      const locale = segments[0] || 'en';
      router.push(`/${locale}/assets/municipal-Asset/asset-detail-view/${row.id}`);
    }
  }, [pathname, router]);

  const handleEdit = useCallback((row: AssetRegisterRow) => {
    if (row.id != null) {
      const segments = pathname.split('/').filter(Boolean);
      const locale = segments[0] || 'en';
      const params = new URLSearchParams();
      params.set('mode', 'edit');
      if (row.categoryName && row.categoryName !== '-') params.set('category', row.categoryName);
      if (row.assetCategoryId != null) params.set('categoryId', String(row.assetCategoryId));
      if (row.assetTypeName && row.assetTypeName !== '-') params.set('assetType', row.assetTypeName);
      if (row.assetTypeId != null) params.set('typeId', String(row.assetTypeId));
      params.set('assetId', String(row.id));

      router.push(`/${locale}/assets/municipal-Asset/new-add-new-asset?${params.toString()}`);
    }
  }, [pathname, router]);

  const handlePrint = useCallback((row: AssetRegisterRow) => {
    if (row.id != null) {
      const segments = pathname.split('/').filter(Boolean);
      const locale = segments[0] || 'en';
      router.push(`/${locale}/assets/municipal-Asset/asset-report/${row.id}`);
    }
  }, [pathname, router]);

  const handleGisMap = useCallback((row: AssetRegisterRow) => {
    if (row.id != null) {
      const segments = pathname.split('/').filter(Boolean);
      const locale = segments[0] || 'en';
      const params = new URLSearchParams();
      params.set('assetId', String(row.id));
      if (row.mpmsNo && row.mpmsNo !== '-') {
        params.set('mpmsNo', row.mpmsNo);
      }
      router.push(`/${locale}/assets/gismapviewer?${params.toString()}`);
    }
  }, [pathname, router]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, pageNumber - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [pageNumber, totalPages]);

  const handleSubunitSearch = useCallback((parentId: number, searchVal: string) => {
    handleSubunitSearchChange(parentId, searchVal);
    updateQueries({
      subSearch: searchVal || null,
      subPage: null,
    });
  }, [handleSubunitSearchChange, updateQueries]);

  const handleSubunitPageSize = useCallback((parentId: number, size: number) => {
    handleSubunitPageSizeChange(parentId, size);
    updateQueries({
      subPageSize: size === 10 ? null : String(size),
      subPage: null,
    });
  }, [handleSubunitPageSizeChange, updateQueries]);

  const handleSubunitPage = useCallback((parentId: number, page: number) => {
    handleSubunitPageChange(parentId, page);
    updateQueries({
      subPage: page === 1 ? null : String(page),
    });
  }, [handleSubunitPageChange, updateQueries]);

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {controls}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col flex-1">
        <AssetRegisterTableContent
          assets={assets}
          openSubunitRows={openSubunitRows}
          expandedAssets={expandedAssets}
          subunitMeta={subunitMeta}
          subunitSearchMap={mergedSubunitSearchMap}
          subunitPageSizeMap={mergedSubunitPageSizeMap}
          subunitPageMap={mergedSubunitPageMap}
          noRecordsLabel={t('No_asset_records') || 'No asset records found for this category'}
          handleToggleExpand={handleToggleExpand}
          handleViewImage={handleViewImage}
          handleViewDetails={handleViewDetails}
          handleEdit={handleEdit}
          handlePrint={handlePrint}
          handleGisMap={handleGisMap}
          handleSubunitSearchChange={handleSubunitSearch}
          handleSubunitPageSizeChange={handleSubunitPageSize}
          handleSubunitPageChange={handleSubunitPage}
        />

        <AssetRegisterTablePagination
          totalCount={totalCount}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          handlePageChange={handlePageChange}
          handlePageSizeChange={handlePageSizeChange}
        />

        {/* New Asset Documents Modal */}
        <AssetDocumentsModal
          isOpen={isDocModalOpen}
          onClose={handleCloseDocModal}
          assetTitle={selectedAssetForDocs?.assetName || selectedAssetForDocs?.assetCode || ''}
          documents={modalDocumentItems}
          isLoading={isLoadingDocs}
          initialMediaType={initialDocMediaType}
        />
      </div>
    </div>
  );
}
