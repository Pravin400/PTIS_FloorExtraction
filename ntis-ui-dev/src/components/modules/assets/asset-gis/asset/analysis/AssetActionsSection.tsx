'use client';

import { Globe, FileText, Store, Building2, Rotate3D } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { AssetActionsSectionProps } from '@/types/asset-gis.types';

export function AssetActionsSection({
  hasChildUnits,
  isShoppingComplexType,
  unitLabelPlural,
  googleMapLink,
  lat,
  lng,
  link360,
  onOpenDocModal,
  onOpenUnitDrawer,
}: AssetActionsSectionProps) {
  const t = useTranslations('assetGis');

  return (
    <div className={`grid ${hasChildUnits ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
      {googleMapLink ? (
        <a
          href={googleMapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-white border border-rose-200 text-rose-600 font-black text-[10.5px] hover:bg-rose-50/70 shadow-xs transition-all tracking-wide"
        >
          <Globe className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{t('details.googleMap') || 'GOOGLE MAP'}</span>
        </a>
      ) : (
        <div className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-slate-100 text-slate-400 font-bold text-[10.5px] border border-slate-200">
          <Globe className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <span className="truncate">{t('details.googleMap') || 'GOOGLE MAP'}</span>
        </div>
      )}

      <Button
        type="button"
        variant="success"
        size="sm"
        onClick={onOpenDocModal}
        icon={FileText}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-black text-[10.5px] shadow-sm tracking-wide border border-emerald-500"
      >
        <span className="truncate">{t('details.documents') || 'DOCUMENTS'}</span>
      </Button>

      {/* Dedicated Show Shops / Show Units Button */}
      {hasChildUnits && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onOpenUnitDrawer}
          icon={isShoppingComplexType ? Store : Building2}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-black text-[10.5px] shadow-sm tracking-wide border border-indigo-500 bg-gradient-to-br from-indigo-600 to-indigo-800"
        >
          <span className="truncate">{`SHOW ${unitLabelPlural.toUpperCase()}`}</span>
        </Button>
      )}

      {link360 ? (
        <a
          href={link360}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-white font-black text-[10.5px] hover:bg-blue-700 shadow-sm transition-all bg-blue-600 border border-blue-500 active:scale-95 tracking-wide"
        >
          <Rotate3D className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t('details.view360') || '360° VIEW'}</span>
        </a>
      ) : (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-white font-black text-[10.5px] hover:bg-blue-700 shadow-sm transition-all bg-blue-600 border border-blue-500 active:scale-95 tracking-wide"
        >
          <Rotate3D className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t('details.view360') || '360° VIEW'}</span>
        </a>
      )}
    </div>
  );
}
