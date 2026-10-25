import { useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  parseDateString,
  MIN_CONSTRUCTION_YEAR,
  MAX_CONSTRUCTION_YEAR,
  isValidDocumentFile,
} from '@/lib/validation/building/validation-rules';
import type {
  ApplicationLevel,
  CertificateStatus,
  UnitSelectionItem,
} from '@/types/building-permission.types';

interface UseEditCertificateRecordStateProps {
  level: ApplicationLevel;
  selectedWingDetailId: number | null;
  selectedUnitIds: Set<number>;
  units: UnitSelectionItem[];
  propertyConstructionYear?: string | number | null;
  certificateDate: string;
  certificateNumber: string;
  selectedTypeId: number;
  status: CertificateStatus;
  remarks: string;
  attachedFiles: File[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onSave: (payload: {
    level: ApplicationLevel;
    selectedWingDetailId: number | null;
    selectedUnitIds: number[];
    certificateTypeId: number;
    certificateDate: string;
    certificateNumber: string;
    status: CertificateStatus;
    remarks: string;
    attachedFiles: File[];
  }) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useEditCertificateRecordState({
  level,
  selectedWingDetailId,
  selectedUnitIds,
  units,
  propertyConstructionYear,
  certificateDate,
  certificateNumber,
  selectedTypeId,
  status,
  remarks,
  attachedFiles,
  setAttachedFiles,
  onSave,
  t,
}: UseEditCertificateRecordStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const effectiveConstructionYear = useMemo<number | null>(() => {
    if (level === 'Unit' && selectedUnitIds.size > 0) {
      const selectedYears: number[] = [];
      selectedUnitIds.forEach((id) => {
        const u = units.find((unit) => unit.propertyDetailsId === id || unit.propertyId === id);
        if (u?.constructionYear) {
          const parsed = parseInt(String(u.constructionYear), 10);
          if (!isNaN(parsed) && parsed > MIN_CONSTRUCTION_YEAR && parsed < MAX_CONSTRUCTION_YEAR) {
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
          if (!isNaN(parsed) && parsed > MIN_CONSTRUCTION_YEAR && parsed < MAX_CONSTRUCTION_YEAR) {
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
      if (!isNaN(parsed) && parsed > MIN_CONSTRUCTION_YEAR && parsed < MAX_CONSTRUCTION_YEAR) {
        return parsed;
      }
    }

    const allUnitYears = units
      .map((u) => (u.constructionYear ? parseInt(String(u.constructionYear), 10) : null))
      .filter((y): y is number => y !== null && !isNaN(y) && y > MIN_CONSTRUCTION_YEAR && y < MAX_CONSTRUCTION_YEAR);

    if (allUnitYears.length > 0) {
      return Math.min(...allUnitYears);
    }

    return null;
  }, [level, selectedUnitIds, units, selectedWingDetailId, propertyConstructionYear]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      let hasInvalid = false;

      for (const file of selectedFiles) {
        if (isValidDocumentFile(file)) {
          validFiles.push(file);
        } else {
          hasInvalid = true;
        }
      }

      if (hasInvalid) {
        toast.error(t('building.uploadInvalidFile'));
      }

      if (validFiles.length > 0) {
        setAttachedFiles((prev) => [...prev, ...validFiles]);
      }
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certificateDate && effectiveConstructionYear) {
      const certDate = parseDateString(certificateDate);
      if (certDate && certDate.getFullYear() < effectiveConstructionYear) {
        setDateError(
          t('validation.dateBeforeConstructionYear', { year: effectiveConstructionYear })
        );
        return;
      }
    }
    setDateError(null);
    onSave({
      level,
      selectedWingDetailId,
      selectedUnitIds: Array.from(selectedUnitIds),
      certificateTypeId: selectedTypeId,
      certificateDate,
      certificateNumber,
      status,
      remarks,
      attachedFiles,
    });
  };

  return {
    fileInputRef,
    dateError,
    setDateError,
    effectiveConstructionYear,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
  };
}
