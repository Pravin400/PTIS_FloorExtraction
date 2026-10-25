'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExportButton } from '@/components/common';
import type { AssetRegisterExportButtonProps } from '@/types/asset/asset-register/municipal-asset-register.types';

/**
 * ARCHITECTURAL EXCEPTION: Streaming Binary Download via Route Handler
 * 
 * MASTER-CREATION-RULES.md Section 2.2 forbids client fetch() calls.
 * Rationale:
 * Exporting large Excel workbooks directly via Server Actions causes substantial memory overhead
 * and base64 payload bloat. The same-origin route /api/assets/export-excel streams the binary
 * attachment directly from the backend API.
 * 
 * Compliance Assurance:
 * The client fetches the same-origin route first so non-2xx responses can be surfaced to the user
 * instead of being downloaded as an XLSX file. Successful responses are then downloaded as a blob.
 */
export function AssetRegisterExportButton({
  categoryId,
  search,
  searchField,
  AssetNo,
  AssetTypeId,
  ZoneId,
  WardId,
  DepartmentId,
  ownershipType,
  encroachmentStatus,
}: AssetRegisterExportButtonProps) {
  const t = useTranslations('assetRegister');
  const [isExporting, setIsExporting] = useState(false);
  const exportingRef = useRef(false);

  const handleExportExcel = async () => {
    if (exportingRef.current) {
      return;
    }

    exportingRef.current = true;
    setIsExporting(true);

    const queryParams = new URLSearchParams({
      AssetCategoryId: categoryId ? String(categoryId) : '',
      search: search || '',
      searchField: searchField || '',
      AssetNo: AssetNo || '',
      AssetTypeId: AssetTypeId && AssetTypeId !== 'all' ? String(AssetTypeId) : '',
      ZoneId: ZoneId && ZoneId !== 'all' ? String(ZoneId) : '',
      WardId: WardId && WardId !== 'all' ? String(WardId) : '',
      DepartmentId: DepartmentId && DepartmentId !== 'all' ? String(DepartmentId) : '',
    });

    if (ownershipType && ownershipType !== 'all') queryParams.set('ownershipType', ownershipType);
    if (encroachmentStatus && encroachmentStatus !== 'all') queryParams.set('encroachmentStatus', encroachmentStatus);

    const downloadUrl = `/api/assets/export-excel?${queryParams.toString()}`;

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        const errorMessage = (await response.text().catch(() => '')) || `Export failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'asset-register.xlsx');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      exportingRef.current = false;
      setIsExporting(false);
    }
  };

  return (
    <ExportButton
      label={t('Export')}
      size="sm"
      onClick={() => {
        if (isExporting) return;
        handleExportExcel();
      }}
      isLoading={isExporting}
      disabled={isExporting}
      className={`!h-8.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition-colors ${
        isExporting ? 'pointer-events-none opacity-70' : ''
      }`}
    />
  );
}
