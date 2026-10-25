import type React from 'react';
import type {
  ApplicationLevel,
  CertificateData,
  CertificateStatus,
  CertificateTypeMasterOption,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import type { UnitStatusResolution } from '@/lib/utils/certificate-grid-mapper';
import { validateBuildingPermissionForm } from './building-permission-validation';
import { resolveSavePayload } from './resolve-save-payload';
import type {
  BuildingPermissionSectionProps,
  FieldErrors,
  CertificateItem,
  ConfirmOptions,
} from './building-permission.types';

interface UseBuildingPermissionSaveParams {
  certificateNumber: string;
  certificateDate: string;
  activeCertificateType?: CertificateTypeMasterOption;
  activeCertificateDisplayName: string;
  activeWingName: string;
  effectiveConstructionYear: number | null;
  attachedFiles: File[];
  setAttachedFiles: (files: File[]) => void;
  level: ApplicationLevel;
  initialData?: CertificateData | null;
  removedAttachmentTypeIds: Set<number>;
  selectedTypeId: number;
  activeCertificate?: CertificateItem | null;
  gridRecords: CertificateItem[];
  existingDocumentGuid: string | null;
  existingFileName: string | null;
  existingPropertyCertificateId: number | null;
  hasExistingDocument: boolean;
  isApartmentIndividual: boolean;
  selectedWingDetailId: number | null;
  selectedUnitIds: Set<number>;
  filteredUnits: UnitSelectionItem[];
  units: UnitSelectionItem[];
  unitStatusMap: Map<number | string, UnitStatusResolution>;
  activeUnitStat?: UnitStatusResolution;
  isAllUnitsSelected: boolean;
  directEditingUnitId?: number | null;
  setDirectEditingUnitId?: (id: number | null) => void;
  status: CertificateStatus;
  remarks: string;
  onSave?: BuildingPermissionSectionProps['onSave'];
  refetchGrid: () => Promise<unknown>;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  setActionError: (msg: string | null) => void;
  setUploadedFileNamesMap: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  confirm: (options: ConfirmOptions) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useBuildingPermissionSave(p: UseBuildingPermissionSaveParams) {
  const handleSaveClick = async () => {
    const errors = validateBuildingPermissionForm({
      certificateNumber: p.certificateNumber,
      certificateDate: p.certificateDate,
      activeCertificateType: p.activeCertificateType,
      effectiveConstructionYear: p.effectiveConstructionYear,
      attachedFiles: p.attachedFiles,
      level: p.level,
      initialData: p.initialData,
      removedAttachmentTypeIds: p.removedAttachmentTypeIds,
      selectedTypeId: p.selectedTypeId,
      activeCertificate: p.activeCertificate,
      gridRecords: p.gridRecords,
      existingDocumentGuid: p.existingDocumentGuid,
      isApartmentIndividual: p.isApartmentIndividual,
      selectedWingDetailId: p.selectedWingDetailId,
      selectedUnitIds: p.selectedUnitIds,
      t: p.t,
    });

    if (Object.keys(errors).length > 0) {
      p.setFieldErrors(errors);
      return;
    }

    const isDirectUnit = (id: number) => {
      const stat = p.unitStatusMap.get(id);
      return stat?.status === 'direct';
    };

    let validUnitDetailsIds: number[] = [];
    if (p.level === 'Unit') {
      if (p.selectedUnitIds.size === 1) {
        const singleId = Array.from(p.selectedUnitIds)[0];
        if (isDirectUnit(singleId)) {
          // Direct applied unit: only pass if explicitly edited via Edit button
          if (p.directEditingUnitId != null && Number(p.directEditingUnitId) === Number(singleId)) {
            validUnitDetailsIds = [singleId];
          } else {
            validUnitDetailsIds = [];
          }
        } else {
          validUnitDetailsIds = [singleId];
        }
      } else {
        // Multi-unit selection: NEVER include direct applied units
        validUnitDetailsIds = Array.from(p.selectedUnitIds).filter((id) => !isDirectUnit(id));
      }
    } else {
      validUnitDetailsIds = Array.from(p.selectedUnitIds);
    }

    const resolvedSelectedPropertyIds = validUnitDetailsIds.map((id) => {
      const matched = p.filteredUnits.find((u) => u.propertyDetailsId === id || u.propertyId === id)
        || p.units.find((u) => u.propertyDetailsId === id || u.propertyId === id);
      return matched?.propertyId || id;
    });

    const resolvedSelectedUnitDetailsIds = validUnitDetailsIds;

    const {
      resolvedDocGuid,
      resolvedFileName,
      resolvedCertId,
      isFileModified,
      isNewFileAttached,
      hasDoc,
    } = resolveSavePayload({
      level: p.level,
      selectedTypeId: p.selectedTypeId,
      selectedUnitIds: new Set(validUnitDetailsIds),
      unitStatusMap: p.unitStatusMap,
      existingDocumentGuid: p.existingDocumentGuid,
      existingFileName: p.existingFileName,
      existingPropertyCertificateId: p.existingPropertyCertificateId,
      activeCertificate: p.activeCertificate,
      activeUnitStat: p.activeUnitStat,
      isApartmentIndividual: p.isApartmentIndividual,
      initialData: p.initialData,
      attachedFiles: p.attachedFiles,
      removedAttachmentTypeIds: p.removedAttachmentTypeIds,
      hasExistingDocument: p.hasExistingDocument,
    });

    p.setFieldErrors({});
    p.setActionError(null);

    const isApplyingWingLevelFromUnit = !p.isApartmentIndividual && p.level === 'Unit' && p.selectedUnitIds.size === 0;
    const effectiveLevel = isApplyingWingLevelFromUnit ? 'Wing' : p.level;

    const performSave = async () => {
      try {
        const result = await p.onSave?.({
          level: effectiveLevel,
          selectedWingDetailId: p.selectedWingDetailId,
          selectedUnitIds: effectiveLevel === 'Wing' ? [] : resolvedSelectedPropertyIds,
          selectedUnitDetailsIds: effectiveLevel === 'Wing' ? [] : resolvedSelectedUnitDetailsIds,
          isAllUnitsSelected: effectiveLevel === 'Wing' ? false : p.isAllUnitsSelected,
          certificateTypeId: p.selectedTypeId,
          certificateDate: p.certificateDate,
          certificateNumber: p.certificateNumber,
          status: p.status,
          remarks: p.remarks,
          attachedFiles: isNewFileAttached ? p.attachedFiles : [],
          documentGuid: resolvedDocGuid,
          existingDocumentGuid: resolvedDocGuid,
          fileName: resolvedFileName,
          propertyCertificateId: resolvedCertId,
          hasExistingDocument: hasDoc,
          isFileModified,
          preserveExistingDocument: !isFileModified && hasDoc,
        });

        const isSuccess = result !== false && (typeof result !== 'object' || result === null || (result as { success?: boolean }).success !== false);
        if (isSuccess) {
          const savedFileName = p.attachedFiles[0]?.name;
          if (isNewFileAttached && savedFileName && p.selectedTypeId) {
            p.setUploadedFileNamesMap((prev) => ({ ...prev, [p.selectedTypeId]: savedFileName }));
          }
          await p.refetchGrid();
          p.setAttachedFiles([]);
          p.setDirectEditingUnitId?.(null);
        } else if (result && typeof result === 'object' && (result as { success?: boolean }).success === false) {
          p.setActionError((result as { message?: string; error?: string }).error || (result as { message?: string; error?: string }).message || p.t('building.saveError') || 'Failed to save changes');
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : (p.t('building.saveError') || 'Failed to save changes');
        p.setActionError(msg);
      }
    };

    if (isApplyingWingLevelFromUnit) {
      p.confirm({
        variant: 'info',
        title: p.t('building.confirmApplyWingLevelTitle') || 'Apply Certificate at Wing Level?',
        description: p.t('building.confirmApplyWingLevelDesc', {
          wing: p.activeWingName || 'this wing',
          cert: p.activeCertificateDisplayName || 'Certificate',
        }) || `No units are selected. This will apply the ${p.activeCertificateDisplayName || 'Certificate'} to the entire wing (${p.activeWingName || 'this wing'}), covering all units. Do you want to proceed?`,
        confirmText: p.t('building.confirmApplyWingLevelOk') || 'Yes, Apply to Wing',
        cancelText: p.t('common.cancel') || 'Cancel',
        onConfirm: async () => {
          await performSave();
        },
      });
      return;
    }

    await performSave();
  };

  return { handleSaveClick };
}
