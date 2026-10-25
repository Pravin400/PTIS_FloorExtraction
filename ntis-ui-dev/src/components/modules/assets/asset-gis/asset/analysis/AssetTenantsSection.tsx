'use client';

import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { AssetTenantsSectionProps } from '@/types/asset-gis.types';

export type { AssetTenantsSectionProps };

export function AssetTenantsSection({
  tenants,
  showTenants,
  onToggleShowTenants,
}: AssetTenantsSectionProps) {
  const t = useTranslations('assetGis');
  if (!tenants || tenants.length === 0) return null;

  return (
    <div className="p-4 border-b border-slate-200">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggleShowTenants}
        className="w-full flex items-center justify-between text-left group p-0 h-auto border-0 hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            {t('details.registeredTenants', { count: tenants.length })}
          </h3>
        </div>
        {showTenants ? (
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
        )}
      </Button>

      {showTenants && (
        <div className="mt-3 space-y-2">
          {tenants.map((item, idx) => {
            const name = String(item.ownerName || item.name || item.tenantName || item.MarathiOwnerPrathamNav || `Tenant #${idx + 1}`);
            const contact = String(item.mobileNo || item.mobile || item.inChargeMobile || '—');
            const unit = String(item.unitNo || item.shopNo || '');

            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block truncate">{name}</span>
                  {unit && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {t('details.unit', { unit })}
                    </span>
                  )}
                </div>
                <span className="font-mono text-slate-600 text-[11px]">{contact}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
