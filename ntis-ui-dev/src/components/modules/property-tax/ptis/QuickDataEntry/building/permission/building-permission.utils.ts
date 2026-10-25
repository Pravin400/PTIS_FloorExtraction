import type {
  ApplicationLevel,
  CertificateData,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import type { FieldErrors, CertificateItem } from './building-permission.types';

export const normalizeDateToIso = (d: string | null | undefined): string => {
  if (!d || !d.trim()) return '';
  const clean = d.includes('T') ? d.split('T')[0] : d.trim().split(' ')[0];
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return clean;
};

export function calculateEffectiveConstructionYear(params: {
  level: ApplicationLevel;
  selectedUnitIds: Set<number>;
  units: UnitSelectionItem[];
  filteredUnits: UnitSelectionItem[];
  selectedWingDetailId: number | null;
  propertyConstructionYear?: string | number | null;
}): number | null {
  const {
    level,
    selectedUnitIds,
    units,
    filteredUnits,
    selectedWingDetailId,
    propertyConstructionYear,
  } = params;

  if (level === 'Unit' && selectedUnitIds.size > 0) {
    const selectedYears: number[] = [];
    selectedUnitIds.forEach((id) => {
      const u =
        units.find((unit) => unit.propertyDetailsId === id || unit.propertyId === id) ||
        filteredUnits.find((unit) => unit.propertyDetailsId === id || unit.propertyId === id);
      if (u?.constructionYear) {
        const parsed = parseInt(String(u.constructionYear), 10);
        if (!isNaN(parsed) && parsed > 1800 && parsed < 2200) {
          selectedYears.push(parsed);
        }
      }
    });
    if (selectedYears.length > 0) {
      return Math.max(...selectedYears);
    }
  }

  if (level === 'Wing' && selectedWingDetailId) {
    const wingYears: number[] = [];
    units.forEach((u) => {
      if (u.wingDetailId === selectedWingDetailId && u.constructionYear) {
        const parsed = parseInt(String(u.constructionYear), 10);
        if (!isNaN(parsed) && parsed > 1800 && parsed < 2200) {
          wingYears.push(parsed);
        }
      }
    });
    if (wingYears.length > 0) {
      return Math.min(...wingYears);
    }
  }

  if (propertyConstructionYear) {
    const parsed = parseInt(String(propertyConstructionYear), 10);
    if (!isNaN(parsed) && parsed > 1800 && parsed < 2200) {
      return parsed;
    }
  }

  const allUnitYears = units
    .map((u) => (u.constructionYear ? parseInt(String(u.constructionYear), 10) : null))
    .filter((y): y is number => y !== null && !isNaN(y) && y > 1800 && y < 2200);

  if (allUnitYears.length > 0) {
    return Math.min(...allUnitYears);
  }

  return null;
}

export function getSidebarValidationErrors(
  fieldErrors: FieldErrors,
  selectedTypeId: number
): Record<number, string> {
  const activeErr =
    fieldErrors.certificateNumber ||
    fieldErrors.certificateDate ||
    fieldErrors.document ||
    fieldErrors.wing ||
    fieldErrors.unit;
  if (!activeErr) return {};
  return { [selectedTypeId]: activeErr };
}

export function calculateIsDirty(params: {
  isNoUnitsSelectedInUnitLevel: boolean;
  isCurrentCertEnabled: boolean;
  attachedFiles: File[];
  activeCertificate?: CertificateItem | null;
  level: ApplicationLevel;
  initialData?: CertificateData | null;
  existingDocumentGuid: string | null;
  removedAttachmentTypeIds: Set<number>;
  selectedTypeId: number;
  certificateNumber: string;
  certificateDate: string;
  hasExistingRecord: boolean;
}): boolean {
  const {
    isNoUnitsSelectedInUnitLevel,
    isCurrentCertEnabled,
    attachedFiles,
    activeCertificate,
    level,
    initialData,
    existingDocumentGuid,
    removedAttachmentTypeIds,
    selectedTypeId,
    certificateNumber,
    certificateDate,
    hasExistingRecord,
  } = params;

  if (isNoUnitsSelectedInUnitLevel && !isCurrentCertEnabled) return false;
  if (attachedFiles.length > 0) return true;

  const hadSavedDocument = Boolean(
    activeCertificate?.hasDocument ||
      (activeCertificate?.documentGuid && activeCertificate.documentGuid !== 'null' && activeCertificate.documentGuid !== 'undefined') ||
      (level === 'Apartment' && initialData?.documentGuid) ||
      existingDocumentGuid
  );
  if (removedAttachmentTypeIds.has(selectedTypeId) && hadSavedDocument) return true;

  const savedNumber = (
    activeCertificate?.certificateNumber ||
    (level === 'Apartment' && initialData?.certificateTypeId === selectedTypeId ? initialData?.number : '') ||
    ''
  ).trim();
  const currentNumber = (certificateNumber || '').trim();
  if (currentNumber !== savedNumber) return true;

  const savedDate = normalizeDateToIso(
    activeCertificate?.certificateDate ||
    (level === 'Apartment' && initialData?.certificateTypeId === selectedTypeId ? initialData?.date : '') ||
    ''
  );
  const currentDate = normalizeDateToIso(certificateDate);
  if (currentDate !== savedDate) return true;

  if (!hasExistingRecord && (currentNumber !== '' || currentDate !== '')) return true;
  return false;
}
