import React from 'react';
import {
  BellRing,
  ShieldCheck,
  Building2,
  Award,
  FileCheck2,
  FileText,
} from 'lucide-react';
import type { BuildingPermissionData } from '@/types/ptis.types';

export interface BuildingPermissionTabProps {
  data?: BuildingPermissionData;
  propertyId?: number | string | null;
  wardNo?: string | null;
  wardId?: number | string | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  societyDetailId?: number | string | null;
  categoryId?: number | null;
  onFieldChange?: (field: string, value: string | boolean) => void;
  readOnly?: boolean;
  isExpanded?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface CertificateTheme {
  accentBar: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const getCertificateTheme = (name?: string | null): CertificateTheme => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('notice')) {
    return {
      accentBar: 'before:bg-amber-500',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      icon: BellRing,
    };
  }
  if (
    lower.includes('occupancy') ||
    lower.includes('oc') ||
    lower.includes('completion') ||
    lower.includes('possession') ||
    lower.includes('commencement') ||
    lower.includes('cc')
  ) {
    return {
      accentBar: 'before:bg-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
      icon: lower.includes('occupancy') || lower.includes('oc')
        ? ShieldCheck
        : lower.includes('possession') || lower.includes('completion')
          ? Award
          : Building2,
    };
  }
  if (lower.includes('fire') || lower.includes('noc')) {
    return {
      accentBar: 'before:bg-rose-500',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
      icon: FileCheck2,
    };
  }
  return {
    accentBar: 'before:bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    icon: FileText,
  };
};
