import type React from 'react';
import type {
  ApplicationLevel,
  CertificateData,
  CertificateTypeMasterOption,
  WingOption,
} from '@/types/building-permission.types';
import { resolveDeletePayload } from './resolve-delete-payload';
import type {
  BuildingPermissionSectionProps,
  DeleteAccessInfo,
  FieldErrors,
  DeleteCertificateRecordParams,
  CertificateItem,
  CertificateGridItems,
  ConfirmOptions,
} from './building-permission.types';

interface UseBuildingPermissionDeleteParams {
  selectedTypeId: number;
  deleteAccessInfo: DeleteAccessInfo;
  activeCertificate?: CertificateItem | null;
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
  certificateNumber: string;
  setCertificateNumber: (val: string) => void;
  certificateDate: string;
  setCertificateDate: (val: string) => void;
  attachedFiles: File[];
  setAttachedFiles: (files: File[]) => void;
  setExistingDocumentGuid: (val: string | null) => void;
  setExistingFileName: (val: string | null) => void;
  setExistingPropertyCertificateId: (val: number | null) => void;
  setHasExistingDocument: (val: boolean) => void;
  setEnabledStateMap: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  setUploadedFileNamesMap: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setSelectedUnitIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  refetchGrid: () => Promise<unknown>;
  setIsDeletingRecord: (val: boolean) => void;
  setActionError: (msg: string | null) => void;
  activeCertificateType?: CertificateTypeMasterOption;
  societyId?: number | null;
  level: ApplicationLevel;
  gridItems: CertificateGridItems | null;
  selectedWingDetailId: number | null;
  activeWings: WingOption[];
  propertyId: string;
  confirm: (options: ConfirmOptions) => void;
  onDeleteRecord?: BuildingPermissionSectionProps['onDeleteRecord'];
  onDelete?: BuildingPermissionSectionProps['onDelete'];
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useBuildingPermissionDelete(params: UseBuildingPermissionDeleteParams) {
  const {
    selectedTypeId,
    deleteAccessInfo,
    activeCertificate,
    isApartmentIndividual,
    initialData,
    certificateNumber,
    setCertificateNumber,
    certificateDate,
    setCertificateDate,
    attachedFiles,
    setAttachedFiles,
    setExistingDocumentGuid,
    setExistingFileName,
    setExistingPropertyCertificateId,
    setHasExistingDocument,
    setEnabledStateMap,
    setFieldErrors,
    setUploadedFileNamesMap,
    setSelectedUnitIds,
    refetchGrid,
    setIsDeletingRecord,
    setActionError,
    activeCertificateType,
    societyId,
    level,
    gridItems,
    selectedWingDetailId,
    activeWings,
    propertyId,
    confirm,
    onDeleteRecord,
    onDelete,
    t,
  } = params;

  const resetAfterDelete = async () => {
    setCertificateNumber('');
    setCertificateDate('');
    setAttachedFiles([]);
    setExistingDocumentGuid(null);
    setExistingFileName(null);
    setExistingPropertyCertificateId(null);
    setHasExistingDocument(false);
    setEnabledStateMap((prev) => ({ ...prev, [selectedTypeId]: false }));
    setFieldErrors({});
    setUploadedFileNamesMap((prev) => {
      const next = { ...prev };
      delete next[selectedTypeId];
      return next;
    });
    if (level !== 'Unit' || !isApartmentIndividual) {
      setSelectedUnitIds(new Set());
    }
    await refetchGrid();
  };

  const executeDelete = async (deletePayload: DeleteCertificateRecordParams) => {
    setIsDeletingRecord(true);
    setActionError(null);
    try {
      if (onDeleteRecord) {
        const res = await onDeleteRecord(deletePayload);
        if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
          setActionError((res as { message?: string; error?: string }).error || (res as { message?: string; error?: string }).message || t('building.deleteError') || 'Failed to delete certificate');
          return;
        }
      } else if (onDelete) {
        onDelete(selectedTypeId);
      }
      await resetAfterDelete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (t('building.deleteError') || 'Failed to delete certificate');
      setActionError(msg);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const handleDeleteClick = () => {
    if (!selectedTypeId || !deleteAccessInfo.canDelete) return;

    const docGuid = activeCertificate?.documentGuid || (isApartmentIndividual ? initialData?.documentGuid : undefined);
    const certId = activeCertificate?.propertyCertificateId || (isApartmentIndividual ? initialData?.propertyCertificateId : undefined);
    const certNum = certificateNumber || activeCertificate?.certificateNumber || (isApartmentIndividual ? initialData?.number : '') || '';
    const fileName = attachedFiles[0]?.name || activeCertificate?.fileName || (isApartmentIndividual ? initialData?.fileName : undefined) || '';
    let issueDt = certificateDate || activeCertificate?.certificateDate || (isApartmentIndividual ? initialData?.date : '') || '';

    const certTypeName = activeCertificateType?.certificateTypeName || 'Certificate';
    if (issueDt && issueDt.includes('T')) issueDt = issueDt.split('T')[0];

    const targetSocietyDetailId: number | null = societyId ? Number(societyId) : null;

    const { confirmTitle, detailsLines, deletePayload } = resolveDeletePayload({
      level,
      selectedTypeId,
      certTypeName,
      docGuid,
      certId,
      certNum,
      fileName,
      issueDt,
      targetSocietyDetailId,
      gridItems,
      selectedWingDetailId,
      activeWings,
      isApartmentIndividual,
      initialData,
      propertyId,
      deleteAccessInfo,
      activeCertificate,
      t,
    });

    const descriptionText = `${t('building.confirmDeleteCertificatePrompt') || 'Are you sure you want to delete this certificate and attached data?'}\n\n${detailsLines.map((l) => `• ${l}`).join('\n')}`;

    confirm({
      variant: 'warning',
      size: 'lg',
      title: confirmTitle,
      description: descriptionText,
      confirmText: t('building.confirmDeleteCertificateOk') || 'Yes, Delete',
      cancelText: t('building.confirmDeleteCertificateCancel') || 'No, Cancel',
      onConfirm: () => executeDelete(deletePayload),
    });
  };

  return { handleDeleteClick };
}
