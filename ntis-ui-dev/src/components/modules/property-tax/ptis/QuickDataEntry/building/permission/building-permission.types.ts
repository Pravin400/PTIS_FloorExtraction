import type {
  ApplicationLevel,
  CertificateStatus,
  WingOption,
  UnitSelectionItem,
  CertificateTypeMasterOption,
  CertificateData,
} from '@/types/building-permission.types';
import type {
  UnitCertificateStatusType,
  UnitStatusResolution,
  CertificateItem,
  CertificateGridItems,
} from '@/lib/utils/certificate-grid-mapper';
import type { ConfirmOptions } from '@/components/common/ConfirmProvider';

export type { CertificateItem, CertificateGridItems, ConfirmOptions };

export interface UnitRow extends Record<string, unknown> {
  propertyDetailsId: number;
  propertyId?: number;
  unitNo: string;
  wingName: string;
  certStatus: UnitCertificateStatusType;
  certNumber?: string;
  certDate?: string | null;
  hasDocument?: boolean;
  documentGuid?: string | null;
  fileName?: string | null;
  propertyCertificateId?: number | null;
}

export const DEFAULT_UNIT_STATUS: UnitStatusResolution = {
  status: 'none',
  certificate: null,
};

export interface FieldErrors {
  certificateNumber?: string;
  certificateDate?: string;
  document?: string;
  wing?: string;
  unit?: string;
}

export interface DeleteAccessInfo {
  canDelete: boolean;
  tooltip?: string;
  targetDirectUnits?: Array<{
    unit: UnitSelectionItem;
    stat: UnitStatusResolution;
  }>;
}

export interface ViewerData {
  isOpen: boolean;
  url: string;
  name: string;
}

export interface BuildingPermissionSectionProps {
  propertyId: string;
  categoryId?: number | null;
  categoryName?: string;
  societyId?: number | null;
  wingDetailId?: number | null;
  wings?: WingOption[];
  units?: UnitSelectionItem[];
  certificateTypes?: CertificateTypeMasterOption[];
  initialCertificateGrid?: unknown;
  initialLevel?: ApplicationLevel;
  initialCertificateTypeId?: number;
  initialData?: CertificateData | null;
  onSave?: (payload: {
    level: ApplicationLevel;
    selectedWingDetailId: number | null;
    selectedUnitIds: number[];
    selectedUnitDetailsIds?: number[];
    isAllUnitsSelected?: boolean;
    certificateTypeId: number;
    certificateDate: string;
    certificateNumber: string;
    status: CertificateStatus;
    remarks: string;
    attachedFiles: File[];
    documentGuid?: string | null;
    existingDocumentGuid?: string | null;
    fileName?: string | null;
    propertyCertificateId?: number | null;
    hasExistingDocument?: boolean;
    isFileModified?: boolean;
    preserveExistingDocument?: boolean;
  }) => Promise<boolean | { success?: boolean; message?: string } | void> | void;
  onDelete?: (certificateTypeId: number) => void;
  onDeleteRecord?: (params: {
    certificateTypeId: number;
    documentGuid?: string | null;
    documentId?: number | null;
    propertyCertificateId?: number | null;
    level?: ApplicationLevel;
    entityType?: 'S' | 'W' | 'P' | 'F' | string;
    selectedWingDetailId?: number | null;
    selectedUnitIds?: number[];
    propertyDetailsId?: number | null;
    societyDetailId?: number | null;
  }) => Promise<{ success?: boolean; message?: string } | boolean | void> | void;
  isSaving?: boolean;
  propertyConstructionYear?: string | number | null;
}

export type SaveCertificateRecordPayload = NonNullable<BuildingPermissionSectionProps['onSave']> extends (payload: infer P) => unknown ? P : never;
export type DeleteCertificateRecordParams = NonNullable<BuildingPermissionSectionProps['onDeleteRecord']> extends (params: infer P) => unknown ? P : never;
