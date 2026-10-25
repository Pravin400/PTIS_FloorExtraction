import React from 'react';
import {
  Building2,
  ShieldCheck,
  Award,
  FileCheck2,
  FileText,
  BellRing,
} from 'lucide-react';

export interface CertificateTheme {
  accentBar: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const getCertificateTheme = (name?: string | null): CertificateTheme => {
  const lower = (name || '').toLowerCase();

  // Notice
  if (lower.includes('notice')) {
    return {
      accentBar: 'before:bg-amber-500',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      icon: BellRing,
    };
  }

  // Completion / Occupancy / Possession / Commenced
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

  // Fire / NOC
  if (lower.includes('fire') || lower.includes('noc')) {
    return {
      accentBar: 'before:bg-rose-500',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
      icon: FileCheck2,
    };
  }

  // Other / Default
  return {
    accentBar: 'before:bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    icon: FileText,
  };
};
