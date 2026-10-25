'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getDocumentBlobUrl } from '@/lib/utils/document-client-utils';
import { useApartmentWingUrlParams } from '@/hooks/property-tax/apartment';
import type { BuildingPermissionData } from '@/types/ptis.types';
import {
  BuildingPermissionRecord,
  mapToBuildingPermissionRecords,
} from '@/types/property-tax/apartment/building-permission-records.types';
import {
  extractCertificateTypeOptions,
  calculateLevelCounts,
  filterBuildingRows,
  resolveSelectedCertTypeValue,
  buildBuildingEditUrl,
} from './building-permission-helpers';

export interface UseBuildingPermissionRecordsProps {
  propRecords?: BuildingPermissionRecord[];
  rawGridData?: unknown;
  propMasterTypes?: unknown[] | null;
  initialCertificateType?: string | null;
  buildingPermissionData?: BuildingPermissionData | null;
  propertyId?: number | string | null;
  wardId?: string | number | null;
  wardNo?: string | null;
  propertyNo?: string | null;
  societyDetailId?: number | null;
  wingDetailsId?: number | null;
  wingName?: string | null;
  locale: string;
}

export function useBuildingPermissionRecords({
  propRecords,
  rawGridData,
  propMasterTypes,
  initialCertificateType,
  buildingPermissionData,
  propertyId,
  wardId,
  wardNo,
  propertyNo,
  societyDetailId,
  wingDetailsId,
  wingName,
  locale,
}: UseBuildingPermissionRecordsProps) {
  const router = useRouter();
  const t = useTranslations('ptisRedesign');
  const { setWingParams } = useApartmentWingUrlParams();

  const [selectedCertType, setSelectedCertType] = useState<string>(initialCertificateType || 'ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [activeViewingKey, setActiveViewingKey] = useState<string | null>(null);
  const [activeEditingKey, setActiveEditingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewerData, setViewerData] = useState<{
    isOpen: boolean; url: string; name: string; label?: string; contentType?: string;
  } | null>(null);

  const effectiveGridData = rawGridData ?? null;
  const effectiveMasterTypes = (propMasterTypes && propMasterTypes.length > 0) ? propMasterTypes : null;

  const rows = useMemo(() => {
    if (propRecords && propRecords.length > 0) return propRecords;
    return mapToBuildingPermissionRecords(effectiveGridData, buildingPermissionData, wingDetailsId, effectiveMasterTypes);
  }, [propRecords, effectiveGridData, buildingPermissionData, wingDetailsId, effectiveMasterTypes]);

  const handleFilterSelect = useCallback((typeKey: string) => {
    setSelectedCertType(typeKey);
    setWingParams({ certType: typeKey === 'ALL' ? null : typeKey });
  }, [setWingParams]);

  const handleLevelSelect = useCallback((levelKey: string) => {
    setSelectedLevel((prev) => (prev.toLowerCase() === levelKey.toLowerCase() ? 'ALL' : levelKey));
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedCertType('ALL');
    setSelectedLevel('ALL');
    setWingParams({ certType: null });
  }, [setWingParams]);

  const certificateTypeOptions = useMemo(() => {
    const allLabel = t('buildingPermission.allCertificates') || 'All Certificates';
    return extractCertificateTypeOptions(rows, effectiveMasterTypes, allLabel);
  }, [rows, effectiveMasterTypes, t]);

  const selectedCertTypeValue = useMemo(
    () => resolveSelectedCertTypeValue(selectedCertType, certificateTypeOptions, rows),
    [selectedCertType, certificateTypeOptions, rows]
  );

  const hasFloorLevel = useMemo(() => rows.some((r) => (r.level || '').toLowerCase().includes('floor')), [rows]);
  const levelCounts = useMemo(() => calculateLevelCounts(rows), [rows]);
  const displayedRows = useMemo(() => filterBuildingRows(rows, selectedLevel, selectedCertType), [rows, selectedLevel, selectedCertType]);

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
        copyMsg = t('buildingPermission.copied') || copyMsg;
      } catch {
        // fallback safely
      }
      toast.success(copyMsg);
      setTimeout(() => { setCopiedKey((prev) => (prev === key ? null : prev)); }, 2000);
    }
  };

  const handleEditRecord = useCallback((_record?: BuildingPermissionRecord, rowKey?: string) => {
    const targetPropId = propertyId || (societyDetailId ? String(societyDetailId) : '');
    if (!targetPropId) {
      toast.error('Property ID or Society ID is required to edit building permissions.');
      return;
    }
    const editKey = rowKey || (_record ? String(_record.id || `${_record.permitNo}-${_record.certificateTypeId}`) : 'edit-all');
    setActiveEditingKey(editKey);
    router.push(buildBuildingEditUrl({
      targetPropId, wardNo, wardId, propertyNo, societyDetailId, wingName, wingDetailsId,
      record: _record, selectedLevel, selectedCertType, rows, locale,
    }));
  }, [propertyId, societyDetailId, wardNo, wardId, propertyNo, wingName, wingDetailsId, selectedLevel, selectedCertType, rows, locale, router]);

  const handleViewDocument = useCallback(async (record: BuildingPermissionRecord, rowKey?: string) => {
    if (!record.documentGuid) {
      handleEditRecord(record);
      return;
    }
    const key = rowKey || String(record.id || `${record.permitNo}-${record.certificateTypeId}`);
    setActiveViewingKey(key);
    try {
      const res = await getDocumentBlobUrl(record.documentGuid, locale);
      const isImg = res.contentType?.toLowerCase().startsWith('image/');
      const defaultExt = isImg ? (res.contentType.toLowerCase().includes('png') ? 'png' : 'jpg') : 'pdf';
      setViewerData({
        isOpen: true,
        url: res.url,
        name: record.fileName || `${record.permitNo}.${defaultExt}`,
        label: record.permitNo,
        contentType: res.contentType,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('buildingPermission.viewDocumentError') || 'Failed to view document');
    } finally {
      setActiveViewingKey(null);
    }
  }, [locale, handleEditRecord, t]);

  return {
    rows,
    displayedRows,
    certificateTypeOptions,
    selectedCertTypeValue,
    selectedCertType,
    selectedLevel,
    setSelectedLevel,
    levelCounts,
    hasFloorLevel,
    activeViewingKey,
    activeEditingKey,
    copiedKey,
    viewerData,
    closeViewer,
    handleFilterSelect,
    handleLevelSelect,
    handleClearAllFilters,
    handleCopyNumber,
    handleEditRecord,
    handleViewDocument,
  };
}
