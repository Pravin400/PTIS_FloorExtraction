'use client';

import React from 'react';
import { Building2, Home, Store, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BuildingPermissionRecord } from '@/types/property-tax/apartment/building-permission-records.types';

export interface BuildingPermissionLevelBadgeProps {
  row?: BuildingPermissionRecord;
  level?: string;
  scopeName?: string;
}

export const BuildingPermissionLevelBadge: React.FC<BuildingPermissionLevelBadgeProps> = ({
  row,
  level,
  scopeName,
}) => {
  const t = useTranslations('ptisRedesign');
  const lvl = (level || row?.level || '').toLowerCase();

  if (lvl.includes('apartment') || lvl.includes('society')) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
        <span>{t('buildingPermission.levels.apartment') || 'Apartment Level'}</span>
      </span>
    );
  }

  if (lvl.includes('wing')) {
    const rawWing = row?.wingName || row?.applicableToLabel || scopeName || '';
    const wingText = rawWing
      ? /wing/i.test(rawWing)
        ? rawWing
        : `Wing ${rawWing}`
      : t('buildingPermission.levels.wing') || 'Wing Level';

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
        <Home className="w-2.5 h-2.5 text-purple-500 shrink-0" />
        <span>{wingText}</span>
      </span>
    );
  }

  if (lvl.includes('unit')) {
    const unitsList =
      row?.coveredUnitNumbers && row.coveredUnitNumbers.length > 0
        ? row.coveredUnitNumbers.join(' ')
        : (row?.applicableToLabel || scopeName || '').trim();
    const unitText = unitsList
      ? /unit/i.test(unitsList)
        ? unitsList
        : `Unit ${unitsList}`
      : t('buildingPermission.levels.unit') || 'Unit Level';

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <Store className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
        <span>{unitText}</span>
      </span>
    );
  }

  if (lvl.includes('floor')) {
    const rawFloor = (row?.applicableToLabel || scopeName || '').trim();
    const floorText = rawFloor
      ? /floor/i.test(rawFloor)
        ? rawFloor
        : `Floor ${rawFloor}`
      : t('buildingPermission.levels.floor') || 'Floor Level';

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
        <Layers className="w-2.5 h-2.5 text-amber-500 shrink-0" />
        <span>{floorText}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      {level || row?.level || 'Scope'}
    </span>
  );
};
