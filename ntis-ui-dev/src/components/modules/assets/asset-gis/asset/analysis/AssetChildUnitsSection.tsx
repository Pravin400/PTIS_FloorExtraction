'use client';

import { Store, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AssetChildUnitsSectionProps } from '@/types/asset-gis.types';
import { Badge, Button } from '@/components/common';

export type { AssetChildUnitsSectionProps };

export function AssetChildUnitsSection({
  childAssets,
  isShoppingComplexType,
  onOpenUnitDrawer,
  onSelectChildAsset,
}: AssetChildUnitsSectionProps) {
  const t = useTranslations('assetGis');

  if (!childAssets || childAssets.length === 0) {
    return null;
  }

  const previewUnits = childAssets.slice(0, 4);

  return (
    <div className="p-4 border-b border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            {isShoppingComplexType
              ? t('details.shopUnits', { count: childAssets.length })
              : t('details.subUnits', { count: childAssets.length })}
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onOpenUnitDrawer}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 p-0 h-auto border-0"
        >
          <span>{t('details.viewAll')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {previewUnits.map((unit, idx) => {
          const uId = (unit.assetId || unit.id || unit.assetNo || idx) as string | number;
          const uName = String(unit.assetName || unit.name || unit.subUnitName || `Unit #${idx + 1}`);
          const uNo = String(unit.assetNo || unit.unitNo || unit.code || '');
          const occ = String(unit.occupancyStatus || (unit.tenantName ? 'Rented' : 'Vacant'));
          const isRented = occ.toLowerCase().includes('rent');

          return (
            <div
              key={String(uId)}
              onClick={() => onSelectChildAsset?.(uId)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold font-mono text-slate-500">{uNo || `#${idx + 1}`}</span>
                <Badge variant={isRented ? 'success' : 'warning'} size="sm" className="text-[8px] px-1.5 py-0.2">
                  {occ}
                </Badge>
              </div>
              <span className="text-xs font-black text-slate-800 block truncate group-hover:text-blue-700 transition-colors">
                {uName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
