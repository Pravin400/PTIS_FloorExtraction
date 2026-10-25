import type {
  ApplicationLevel,
  CertificateStatus,
  WingOption,
  UnitSelectionItem,
  CertificateTypeMasterOption,
  CertificateData,
} from '@/types/building-permission.types';

export interface EditCertificateRecordModalProps {
  open: boolean;
  onClose: () => void;
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
  propertyId?: string;
  wings?: WingOption[];
  units?: UnitSelectionItem[];
  certificateTypes?: CertificateTypeMasterOption[];
  initialLevel?: ApplicationLevel;
  initialCertificateTypeId?: number;
  initialData?: CertificateData | null;
  isLoading?: boolean;
  propertyConstructionYear?: string | number | null;
}

export const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OC: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  CC: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  EB: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  BP: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  SP: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  CM: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  FN: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};
