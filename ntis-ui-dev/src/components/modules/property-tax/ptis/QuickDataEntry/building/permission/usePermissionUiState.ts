import { useState, useEffect } from 'react';
import type { ApplicationLevel, CertificateData, UnitSelectionItem } from '@/types/building-permission.types';
import type { FieldErrors, ViewerData, CertificateGridItems } from './building-permission.types';
import { checkCertificateHasSavedData } from './check-certificate-saved-data';

interface UsePermissionUiStateParams {
  selectedTypeId: number;
  setSelectedTypeId: (id: number) => void;
  level: ApplicationLevel;
  setLevel: (lvl: ApplicationLevel) => void;
  selectedWingDetailId: number | null;
  setWingFilter: (val: string) => void;
  selectedUnitIds: Set<number>;
  filteredUnits: UnitSelectionItem[];
  units: UnitSelectionItem[];
  gridItems: CertificateGridItems | null;
  societyId?: number | null;
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
  setCertificateNumber: (val: string) => void;
  setCertificateDate: (val: string) => void;
  setAttachedFiles: (files: File[]) => void;
  searchParams: { toString(): string };
  router: { replace: (url: string) => void };
  pathname: string;
}

export function usePermissionUiState(p: UsePermissionUiStateParams) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveFirst, setShowActiveFirst] = useState(false);
  const [enabledStateMap, setEnabledStateMap] = useState<Record<number, boolean>>({});
  const [removedAttachmentTypeIds, setRemovedAttachmentTypeIds] = useState<Set<number>>(new Set());
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'direct' | 'wing' | 'apartment' | 'none'>('all');
  const [viewerData, setViewerData] = useState<ViewerData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [uploadedFileNamesMap, setUploadedFileNamesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    return () => {
      if (viewerData?.url?.startsWith('blob:')) URL.revokeObjectURL(viewerData.url);
    };
  }, [viewerData]);

  const handleToggleEnabled = (typeId: number, checked: boolean) => {
    if (checked) {
      setEnabledStateMap((prev) => ({ ...prev, [typeId]: true }));
      p.setSelectedTypeId(typeId);
      setFieldErrors({});
      setActionError(null);
      return;
    }
    const hasData = checkCertificateHasSavedData({
      typeId,
      selectedTypeId: p.selectedTypeId,
      level: p.level,
      selectedUnitIds: p.selectedUnitIds,
      filteredUnits: p.filteredUnits,
      units: p.units,
      gridItems: p.gridItems,
      societyId: p.societyId,
      selectedWingDetailId: p.selectedWingDetailId,
      isApartmentIndividual: p.isApartmentIndividual,
      initialData: p.initialData,
    });
    if (hasData) return;
    setEnabledStateMap((prev) => ({ ...prev, [typeId]: false }));
    if (p.selectedTypeId === typeId) {
      p.setCertificateNumber('');
      p.setCertificateDate('');
      p.setAttachedFiles([]);
      setFieldErrors({});
    }
  };

  const handleSelectLevel = (lvl: ApplicationLevel) => {
    p.setLevel(lvl);
    setEnabledStateMap({});
    setRemovedAttachmentTypeIds(new Set());
    if (lvl === 'Unit' && p.selectedWingDetailId) p.setWingFilter(String(p.selectedWingDetailId));
    const params = new URLSearchParams(p.searchParams.toString());
    params.set('level', lvl);
    if (lvl === 'Apartment') p.router.replace(`${p.pathname}?${params.toString()}`);
    else window.history.replaceState(null, '', `?${params.toString()}`);
  };

  return {
    searchTerm,
    setSearchTerm,
    showActiveFirst,
    setShowActiveFirst,
    enabledStateMap,
    setEnabledStateMap,
    removedAttachmentTypeIds,
    setRemovedAttachmentTypeIds,
    isDeletingRecord,
    setIsDeletingRecord,
    actionError,
    setActionError,
    statusFilter,
    setStatusFilter,
    viewerData,
    setViewerData,
    fieldErrors,
    setFieldErrors,
    uploadedFileNamesMap,
    setUploadedFileNamesMap,
    handleToggleEnabled,
    handleSelectLevel,
  };
}
