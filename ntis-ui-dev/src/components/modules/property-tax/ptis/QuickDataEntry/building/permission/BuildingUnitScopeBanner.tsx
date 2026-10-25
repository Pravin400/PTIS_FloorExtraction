import React from 'react';
import { Info, Store } from 'lucide-react';
import { Badge } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { ApplicationLevel, UnitSelectionItem } from '@/types/building-permission.types';
import type { UnitStatusResolution } from '@/lib/utils/certificate-grid-mapper';
import type { CertificateItem } from './building-permission.types';

interface BuildingUnitScopeBannerProps {
  isApartmentIndividual: boolean;
  level: ApplicationLevel;
  selectedUnitIds: Set<number>;
  isCurrentCertEnabled: boolean;
  activeWingName: string;
  selectedUnitNamesSummary: string;
  activeCertificate?: CertificateItem | null;
  activeUnitStat?: UnitStatusResolution;
  inheritedFrom?: string | null;
  allUnitsList: UnitSelectionItem[];
  unitStatusMap: Map<number | string, UnitStatusResolution>;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function BuildingUnitScopeBanner({
  isApartmentIndividual,
  level,
  selectedUnitIds,
  isCurrentCertEnabled,
  activeWingName,
  selectedUnitNamesSummary,
  activeCertificate,
  activeUnitStat,
  inheritedFrom,
  allUnitsList,
  unitStatusMap,
  t,
}: BuildingUnitScopeBannerProps): React.ReactElement | null {
  if (isApartmentIndividual || level !== 'Unit') {
    return null;
  }

  if (selectedUnitIds.size === 0) {
    if (isCurrentCertEnabled) {
      return (
        <div className="flex items-center justify-between gap-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>{t('building.noUnitsSelectedTitle') || 'No units selected'}:</strong>{' '}
              {t('building.noUnitsSelectedWingLevelNotice', { wing: activeWingName || 'this wing' }) ||
                `No units are selected. Saving will apply this certificate at Wing Level for ${activeWingName || 'this wing'} (covering all units in this wing).`}
            </span>
          </div>
          <Badge variant="info" size="sm" className="bg-sky-100 text-sky-800 border-sky-300 font-semibold shrink-0">
            {t('building.appliesToWingBadge', { wing: activeWingName || 'Wing' }) || `Applies to Wing ${activeWingName || ''}`}
          </Badge>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 shadow-2xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>{t('building.noUnitsSelectedTitle') || 'No units selected'}:</strong>{' '}
            {t('building.noUnitsSelectedToggleToEnableHint', { wing: activeWingName || 'this wing' }) ||
              `Toggle ON this certificate to configure it at Wing Level for ${activeWingName || 'this wing'}, or select units from the table above.`}
          </span>
        </div>
        <Badge variant="secondary" size="sm" className="bg-slate-100 text-slate-600 border-slate-300 font-semibold shrink-0">
          {t('building.statusDisabled') || 'Disabled'}
        </Badge>
      </div>
    );
  }

  if (selectedUnitIds.size === 1) {
    return (
      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-blue-900 font-semibold">
            <Store className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {t('building.configuringForUnits', {
                count: selectedUnitIds.size,
                units: selectedUnitNamesSummary,
              })}
            </span>
          </div>
          {activeCertificate?.certificateNumber && (
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-semibold border',
                activeUnitStat?.status === 'direct'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : activeUnitStat?.status === 'apartment' || inheritedFrom === 'Apartment'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : 'bg-sky-100 text-sky-800 border-sky-200'
              )}
            >
              {activeUnitStat?.status !== 'direct'
                ? activeUnitStat?.status === 'wing' || inheritedFrom === 'Wing'
                  ? t('building.inheritedWingBadge', { number: activeCertificate.certificateNumber }) || `Wing Covered (#${activeCertificate.certificateNumber})`
                  : t('building.inheritedApartmentBadge', { number: activeCertificate.certificateNumber }) || `Apartment Covered (#${activeCertificate.certificateNumber})`
                : t('building.existingCertBadge', { number: activeCertificate.certificateNumber }) || `Existing Cert: #${activeCertificate.certificateNumber}`}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Multi-unit selection
  const multiSelectedUnits = allUnitsList.filter(
    (u) => selectedUnitIds.has(u.propertyDetailsId) || (u.propertyId != null && selectedUnitIds.has(u.propertyId))
  );
  const directCount = multiSelectedUnits.filter(
    (u) => (unitStatusMap.get(u.propertyDetailsId) || (u.propertyId != null ? unitStatusMap.get(u.propertyId) : undefined))?.status === 'direct'
  ).length;
  const wingCount = multiSelectedUnits.filter(
    (u) => (unitStatusMap.get(u.propertyDetailsId) || (u.propertyId != null ? unitStatusMap.get(u.propertyId) : undefined))?.status === 'wing'
  ).length;
  const isMultiMixed = directCount > 0 && wingCount > 0;

  return (
    <div className="flex items-center justify-between p-2 bg-blue-50/80 border border-blue-200 rounded-lg text-xs shadow-2xs">
      <div className="flex items-center gap-2 text-blue-900 font-semibold">
        <Store className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          {t('building.configuringForUnits', {
            count: selectedUnitIds.size,
            units: selectedUnitNamesSummary,
          })}
        </span>
      </div>
      {isMultiMixed ? (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold border bg-amber-50 text-amber-800 border-amber-300">
          {t('building.mixedCoverageBadge', { directCount, wingCount }) || `Mixed: ${directCount} Direct, ${wingCount} Wing Covered`}
        </span>
      ) : activeCertificate?.certificateNumber ? (
        <span
          className={cn(
            'px-2 py-0.5 rounded text-[11px] font-semibold border',
            activeUnitStat?.status === 'direct'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : activeUnitStat?.status === 'apartment' || inheritedFrom === 'Apartment'
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : 'bg-sky-100 text-sky-800 border-sky-200'
          )}
        >
          {activeUnitStat?.status !== 'direct'
            ? activeUnitStat?.status === 'wing' || inheritedFrom === 'Wing'
              ? t('building.inheritedWingBadge', { number: activeCertificate.certificateNumber }) || `Wing Covered (#${activeCertificate.certificateNumber})`
              : t('building.inheritedApartmentBadge', { number: activeCertificate.certificateNumber }) || `Apartment Covered (#${activeCertificate.certificateNumber})`
            : t('building.existingCertBadge', { number: activeCertificate.certificateNumber }) || `Existing Cert: #${activeCertificate.certificateNumber}`}
        </span>
      ) : null}
    </div>
  );
}
