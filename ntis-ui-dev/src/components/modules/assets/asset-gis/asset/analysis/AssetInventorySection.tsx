'use client';

import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Badge } from '@/components/common';
import type { AssetInventorySectionProps } from '@/types/asset-gis.types';

export type { AssetInventorySectionProps };

export function AssetInventorySection({
  inventoryItems,
  showInventory,
  onToggleShowInventory,
}: AssetInventorySectionProps) {
  const t = useTranslations('assetGis');
  if (!inventoryItems || inventoryItems.length === 0) return null;

  return (
    <div className="p-4 border-b border-slate-200">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggleShowInventory}
        className="w-full flex items-center justify-between text-left group p-0 h-auto border-0 hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            {t('details.inventoryFixtures', { count: inventoryItems.length })}
          </h3>
        </div>
        {showInventory ? (
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        )}
      </Button>

      {showInventory && (
        <div className="mt-3 space-y-2">
          {inventoryItems.map((item, idx) => {
            const name = String(item.itemName || item.name || item.description || `Item #${idx + 1}`);
            const qty = item.quantity || item.qty || 1;
            const status = String(item.status || item.condition || 'Good');

            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block truncate">{name}</span>
                  <span className="text-[10px] text-slate-500">
                    {t('details.condition', { status })}
                  </span>
                </div>
                <Badge size="sm" className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                  {t('details.quantity', { qty: String(qty) })}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
