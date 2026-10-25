/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { Coins, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ApartmentPropertyTaxDetailItem } from '@/types/property-tax/apartment';
import { useTranslations } from 'next-intl';

export interface TaxAmountItem {
  taxName?: string;
  taxHeadName?: string;
  taxHeadCode?: string;
  taxAmount?: number;
  amount?: number;
}

interface SelectedPropertyTaxBreakdownProps {
  selectedPropId: number | string;
  loadingTax?: boolean;
  loadingRv?: boolean;
  loadingCv?: boolean;
  rvTaxes?: ApartmentPropertyTaxDetailItem[];
  rvTotal?: number | null;
  cvTaxes?: ApartmentPropertyTaxDetailItem[];
  cvTotal?: number | null;
  propertyLabel?: string;
  variant?: 'survey' | 'existing';
  fallbackTax?: number | string | null;
  onClose?: () => void;
}

export const SelectedPropertyTaxBreakdown: React.FC<SelectedPropertyTaxBreakdownProps> = ({
  selectedPropId,
  loadingTax = false,
  loadingRv = false,
  loadingCv = false,
  rvTaxes = [],
  rvTotal = null,
  cvTaxes = [],
  cvTotal = null,
  propertyLabel,
  variant = 'survey',
  fallbackTax,
  onClose,
}) => {
  const t = useTranslations('ptisRedesign.taxBreakdown');
  const isExisting = variant === 'existing';
  const hasCvData = cvTaxes.length > 0 || (cvTotal !== null && cvTotal > 0);
  const hasRvData = rvTaxes.length > 0 || (rvTotal !== null && rvTotal > 0);
  const [userTab, setUserTab] = React.useState<'rv' | 'cv' | null>(null);
  const activeTab = userTab ?? (hasCvData && !hasRvData ? 'cv' : 'rv');

  const isCv = activeTab === 'cv' && (hasCvData || (!hasRvData && cvTaxes.length >= rvTaxes.length));
  const activeTaxes = isCv ? cvTaxes : rvTaxes;
  const activeTotal = isCv ? cvTotal : rvTotal;
  const displayTotal = activeTotal ?? fallbackTax ?? null;
  const isLoading = loadingTax || loadingRv || loadingCv;

  const isTotalHead = (name?: string) => {
    const n = (name || '').toLowerCase().replace(/\s+/g, '');
    return n === 'taxtotal' || n === 'total';
  };
  const filteredHeads = activeTaxes.filter((h) => !isTotalHead(h.taxName || h.taxHeadName || h.taxHeadCode));

  const getLocalizedTaxHeadName = (name: string): string => {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const headKeyMap: Record<string, string> = {
      generaltax: 'generalTax',
      stateeducationtax: 'stateEducationTax',
      stateemploymenttax: 'stateEmploymentTax',
      treecess: 'treeCess',
      specialwatercess: 'specialWaterCess',
      roadcess: 'roadCess',
      firecess: 'fireCess',
      lightcess: 'lightCess',
      waterbenefitcess: 'waterBenefitCess',
      sewagedisposalcess: 'sewageDisposalCess',
      specialeducationtax: 'specialEducationTax',
      drainagetax: 'drainageTax',
      drainagecess: 'drainageTax',
      watertax: 'waterTax',
      conservancytax: 'conservancyTax',
      streettax: 'streetTax',
    };
    const key = headKeyMap[clean];
    if (key) {
      try {
        const translated = t(`taxHeads.${key}` as Parameters<typeof t>[0]);
        if (translated && !translated.includes('taxHeads.')) return translated;
      } catch {
        // fallback
      }
    }
    return name;
  };

  const propertyText = propertyLabel
    ? (t('propertyPrefix', { label: propertyLabel }) || `Property ${propertyLabel}`)
    : (t('unitPrefix', { id: selectedPropId }) || `Unit #${selectedPropId}`);

  const headerTitle = t('appliedTaxBreakdown', { property: propertyText }) || `${propertyText} Applied Tax Breakdown`;

  return (
    <div
      className={cn(
        'p-1.5 rounded-lg bg-white border text-xs font-sans shadow-2xs space-y-1 transition-all animate-in fade-in duration-150',
        isExisting ? 'border-emerald-300 bg-emerald-50/20' : 'border-sky-300 bg-sky-50/20'
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b pb-1 border-zinc-200/80">
        <div className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-800">
          <Coins className={cn('w-3.5 h-3.5', isExisting ? 'text-emerald-700' : 'text-sky-700')} />
          <span>{headerTitle}</span>
          {filteredHeads.length > 0 && (
            <span className="text-[10px] font-normal text-zinc-400">
              {t('headsCount', { count: filteredHeads.length }) || `(${filteredHeads.length} heads)`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(hasRvData || hasCvData) && (
            <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded border border-zinc-200 text-[10px]">
              <button
                type="button"
                onClick={() => setUserTab('rv')}
                className={cn(
                  'px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors',
                  activeTab === 'rv'
                    ? (isExisting ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-blue-600 text-white shadow-2xs')
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                RV {rvTotal !== null ? `(₹${Number(rvTotal).toLocaleString()})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setUserTab('cv')}
                className={cn(
                  'px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors',
                  activeTab === 'cv'
                    ? (isExisting ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-purple-600 text-white shadow-2xs')
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                CV {cvTotal !== null ? `(₹${Number(cvTotal).toLocaleString()})` : ''}
              </button>
            </div>
          )}

          {displayTotal !== null && (
            <div
              className={cn(
                'px-2.5 py-0.5 rounded font-mono font-black text-[10.5px] border shadow-2xs',
                isExisting
                  ? 'bg-emerald-950 border-emerald-950 text-emerald-200'
                  : 'bg-slate-900 border-slate-950 text-sky-200'
              )}
            >
              {t('totalTaxBadge', { mode: isCv ? 'CV' : 'RV', amount: Number(displayTotal).toLocaleString() }) ||
                `TOTAL ${isCv ? 'CV' : 'RV'} TAX: ₹${Number(displayTotal).toLocaleString()}`}
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              title={t('closeTooltip') || 'Close Tax Breakdown'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] overflow-x-auto ios-scrollbar pb-0.5 max-w-full">
        {isLoading ? (
          <span className="flex items-center gap-1.5 py-1 text-zinc-500">
            <Loader2 className={cn('w-3.5 h-3.5 animate-spin', isExisting ? 'text-emerald-600' : 'text-sky-600')} />
            <span>{t('calculating') || 'Calculating RV & CV taxes...'}</span>
          </span>
        ) : filteredHeads.length === 0 ? (
          <div className="flex items-center gap-1.5 text-zinc-500 py-0.5">
            <span className="italic">{t('noBreakdown') || 'No individual head breakdown available.'}</span>
            {displayTotal != null && (
              <span className="font-semibold text-zinc-700">
                {t('totalTaxLabel', { amount: Number(displayTotal).toLocaleString() }) ||
                  `Total Tax: ₹${Number(displayTotal).toLocaleString()}`}
              </span>
            )}
          </div>
        ) : (
          filteredHeads.map((h, i) => {
            const rawName = h.taxName || h.taxHeadName || h.taxHeadCode || 'Tax';
            const localizedName = getLocalizedTaxHeadName(rawName);
            const amt = Number(h.taxAmount ?? h.amount ?? 0);
            const isZero = amt === 0;

            return (
              <div
                key={`${rawName}-${i}`}
                className={cn(
                  'px-2 py-0.5 rounded shadow-2xs flex items-center gap-1 shrink-0 text-[10px] transition-colors border whitespace-nowrap',
                  isZero
                    ? 'bg-zinc-50/80 border-zinc-200 text-zinc-400'
                    : isExisting
                    ? 'bg-white border-emerald-200 text-zinc-800'
                    : 'bg-white border-sky-200 text-zinc-800'
                )}
                title={`${localizedName}: ₹${amt.toLocaleString()}`}
              >
                <span className={isZero ? 'text-zinc-400' : 'text-zinc-600 font-medium'}>
                  {localizedName}:
                </span>
                <span
                  className={cn(
                    'font-mono',
                    isZero ? 'text-zinc-400 font-normal' : 'font-bold text-zinc-950'
                  )}
                >
                  ₹{amt.toLocaleString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
