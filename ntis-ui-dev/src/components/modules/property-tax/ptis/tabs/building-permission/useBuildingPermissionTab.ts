'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { getDocumentBlobUrl } from '@/lib/utils/document-client-utils';
import type { BuildingPermissionData, BuildingPermissionItem } from '@/types/ptis.types';
import {
  buildIndividualEditUrl,
  extractIndividualCertificateTypeOptions,
  filterIndividualItems,
} from './building-permission-tab-helpers';

export interface UseBuildingPermissionTabProps {
  data?: BuildingPermissionData;
  propertyId?: number | string | null;
  wardNo?: string | null;
  wardId?: number | string | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  societyDetailId?: number | string | null;
  categoryId?: number | null;
}

export function useBuildingPermissionTab({
  data,
  propertyId,
  wardNo,
  wardId,
  propertyNo,
  partitionNo,
  societyDetailId,
  categoryId,
}: UseBuildingPermissionTabProps) {
  const t = useTranslations('ptis');
  const locale = useLocale();
  const router = useRouter();

  const [activeViewingKey, setActiveViewingKey] = useState<string | null>(null);
  const [activeEditingKey, setActiveEditingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedCertType, setSelectedCertType] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'all' | 'attached'>('all');
  const [viewerData, setViewerData] = useState<{
    isOpen: boolean; url: string; name: string; label?: string; contentType?: string;
  } | null>(null);

  const items = useMemo(() => {
    return (data?.items || []).filter(Boolean).filter((item) => {
      const hasContent = !!(item.certificateNo?.trim() || item.issueDate?.trim() || item.documentGuid?.trim());
      return item.hasCertificate || hasContent;
    });
  }, [data?.items]);

  const certificateTypeOptions = useMemo(() => {
    const allLabel = t('building.allCertificates') || 'All Certificates';
    return extractIndividualCertificateTypeOptions(items, allLabel);
  }, [items, t]);

  const displayedItems = useMemo(() => {
    return filterIndividualItems(items, selectedCertType);
  }, [items, selectedCertType]);

  const attachedCount = useMemo(() => items.filter((i) => Boolean(i.documentGuid)).length, [items]);

  const closeViewer = useCallback(() => {
    if (viewerData?.url) URL.revokeObjectURL(viewerData.url);
    setViewerData(null);
  }, [viewerData]);

  useEffect(() => {
    return () => { if (viewerData?.url) URL.revokeObjectURL(viewerData.url); };
  }, [viewerData]);

  const handleCopyNumber = (e: React.MouseEvent, num: string | null | undefined, key: string) => {
    e.stopPropagation();
    if (!num || num === '-' || num.trim() === '') return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num.trim());
      setCopiedKey(key);
      let copyMsg = 'Certificate number copied!';
      try {
        copyMsg = t('building.copied') || t('common.copied') || copyMsg;
      } catch {
        // Fallback safely if translation key is missing
      }
      toast.success(copyMsg);
      setTimeout(() => { setCopiedKey((prev) => (prev === key ? null : prev)); }, 2000);
    }
  };

  const handleViewDocument = useCallback(async (item: BuildingPermissionItem, rowKey: string) => {
    if (!item.documentGuid) {
      toast.info(t('building.noDocumentAttached') || 'No document file attached for this certificate.');
      return;
    }
    setActiveViewingKey(rowKey);
    try {
      const res = await getDocumentBlobUrl(item.documentGuid, locale);
      const isImg = res.contentType?.toLowerCase().startsWith('image/');
      const defaultExt = isImg ? (res.contentType.toLowerCase().includes('png') ? 'png' : 'jpg') : 'pdf';
      const resolvedName = item.fileName || `${item.certificateNo || 'Document'}.${defaultExt}`;
      setViewerData({
        isOpen: true,
        url: res.url,
        name: resolvedName,
        label: item.certificateTypeName,
        contentType: res.contentType,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to view document');
    } finally {
      setActiveViewingKey(null);
    }
  }, [locale, t]);

  const handleEditCertificate = useCallback((e: React.MouseEvent, item: BuildingPermissionItem, rowKey?: string) => {
    e.stopPropagation();
    const resolvedPropId = propertyId || (item as { propertyId?: number }).propertyId;
    if (!resolvedPropId) {
      toast.error('Property ID is required to edit certificates.');
      return;
    }
    const editKey = rowKey || (item.propertyCertificateId ? String(item.propertyCertificateId) : 'edit');
    setActiveEditingKey(editKey);
    const editUrl = buildIndividualEditUrl({
      resolvedPropId, wardNo, wardId, propertyNo, partitionNo, societyDetailId, categoryId, item, locale,
    });
    router.push(editUrl);
  }, [propertyId, wardNo, wardId, propertyNo, partitionNo, societyDetailId, categoryId, locale, router]);

  const handleToolbarEdit = useCallback(() => {
    const resolvedPropId = propertyId || (items[0] as { propertyId?: number } | undefined)?.propertyId;
    if (!resolvedPropId) {
      toast.error('Property ID is required to edit certificates.');
      return;
    }
    setActiveEditingKey('toolbar-edit');
    const editUrl = buildIndividualEditUrl({
      resolvedPropId, wardNo, wardId, propertyNo, partitionNo, societyDetailId, categoryId, locale,
    });
    router.push(editUrl);
  }, [propertyId, items, wardNo, wardId, propertyNo, partitionNo, societyDetailId, categoryId, locale, router]);

  return {
    items,
    displayedItems,
    attachedCount,
    filterMode,
    setFilterMode,
    selectedCertType,
    setSelectedCertType,
    certificateTypeOptions,
    activeViewingKey,
    activeEditingKey,
    copiedKey,
    viewerData,
    closeViewer,
    handleCopyNumber,
    handleViewDocument,
    handleEditCertificate,
    handleToolbarEdit,
  };
}
