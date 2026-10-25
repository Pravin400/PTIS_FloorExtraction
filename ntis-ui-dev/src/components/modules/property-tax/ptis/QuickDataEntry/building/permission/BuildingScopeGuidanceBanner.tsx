import React from 'react';
import { Building2, Home } from 'lucide-react';
import type { ApplicationLevel } from '@/types/building-permission.types';

interface BuildingScopeGuidanceBannerProps {
  isApartmentIndividual: boolean;
  level: ApplicationLevel;
  t: (key: string) => string;
}

export function BuildingScopeGuidanceBanner({
  isApartmentIndividual,
  level,
  t,
}: BuildingScopeGuidanceBannerProps): React.ReactElement | null {
  if (isApartmentIndividual || level === 'Unit') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-50/80 border-slate-200/80 shadow-2xs flex-shrink-0">
      {level === 'Apartment' && (
        <>
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-700">
            <strong className="text-blue-900">{t('building.apartmentLevel') || 'Apartment Scope'}:</strong>{' '}
            {t('building.apartmentScopeHint') || 'Certificates and files configured here apply property-wide across all wings and units.'}
          </span>
        </>
      )}
      {level === 'Wing' && (
        <>
          <Home className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-slate-700">
            <strong className="text-sky-900">{t('building.wingLevel') || 'Wing Scope'}:</strong>{' '}
            {t('building.wingScopeHint') || 'Certificates and files configured here apply to all units in the selected wing.'}
          </span>
        </>
      )}
    </div>
  );
}
