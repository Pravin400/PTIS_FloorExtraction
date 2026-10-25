'use client';

import { useState, useMemo, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronsRight } from 'lucide-react';
import {
  ApartmentTaxDetailsItem,
  TaxHeadItem,
  ApartmentDemandDetailsItem,
} from '@/types/property-tax/apartment';
import { PtisTaxMode } from '@/types/property-tax/apartment';
import {
  getApartmentDemandDetailsAction,
  getApartmentYearWiseDetailsAction,
} from '@/app/[locale]/property-tax/ptis/apartment/action';
import { ApartmentTaxDetailsSkeleton, ApartmentDemandSubTable } from '../tables';

export interface ApartmentTaxDetailsSectionProps {
  taxDetails?: ApartmentTaxDetailsItem | null;
  wardId?: string | number | null;
  propertyNo?: string | null;
  taxMode?: PtisTaxMode;
  isLoading?: boolean;
}

const formatVal = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
};

export function ApartmentTaxDetailsSection({
  taxDetails,
  wardId,
  propertyNo,
  taxMode = 'rateable',
  isLoading = false,
}: ApartmentTaxDetailsSectionProps) {
  const t = useTranslations('appartmentQC');
  const [activeTab, setActiveTab] = useState<'taxDetails' | 'arrears'>('taxDetails');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [demandDataMap, setDemandDataMap] = useState<Record<string, ApartmentDemandDetailsItem | null>>({});
  const [loadingDemandMap, setLoadingDemandMap] = useState<Record<string, boolean>>({});

  const currentTaxType = useMemo(() => {
    if (taxMode === 'capital') return 'CV';
    if (taxMode === 'dual') return 'Dual';
    return 'RV';
  }, [taxMode]);

  const toggleRowExpand = async (code: string, financeYearId?: number | null) => {
    const isExpanding = !expandedRows[code];
    setExpandedRows((prev) => ({
      ...prev,
      [code]: isExpanding,
    }));

    if (isExpanding && wardId && propertyNo) {
      const fetchKey = `${wardId}_${propertyNo}_${currentTaxType}_${code}`;
      if (!loadingDemandMap[fetchKey]) {
        setLoadingDemandMap((prev) => ({ ...prev, [fetchKey]: true }));
        try {
          let res;
          if (activeTab === 'arrears' && financeYearId != null) {
            res = await getApartmentYearWiseDetailsAction(
              String(wardId).trim(),
              String(propertyNo).trim(),
              currentTaxType,
              financeYearId
            );
          } else {
            res = await getApartmentDemandDetailsAction(
              String(wardId).trim(),
              String(propertyNo).trim(),
              currentTaxType
            );
          }
          if (res && res.success && res.items) {
            setDemandDataMap((prev) => ({ ...prev, [fetchKey]: res.items }));
          } else {
            setDemandDataMap((prev) => ({ ...prev, [fetchKey]: null }));
          }
        } catch (_err) {
          setDemandDataMap((prev) => ({ ...prev, [fetchKey]: null }));
        } finally {
          setLoadingDemandMap((prev) => ({ ...prev, [fetchKey]: false }));
        }
      }
    }
  };

  const activeData = useMemo(() => {
    return taxDetails || null;
  }, [taxDetails]);

  const currentTaxHeads: TaxHeadItem[] = useMemo(() => {
    if (!activeData?.currentTaxes || activeData.currentTaxes.length === 0) return [];
    return activeData.currentTaxes.flatMap((group) => group.taxHeads || []);
  }, [activeData]);

  const arrearsHeads: TaxHeadItem[] = useMemo(() => activeData?.arrears || [], [activeData]);
  const activeHeads = activeTab === 'taxDetails' ? currentTaxHeads : arrearsHeads;

  const uniqueTaxNames = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    activeHeads.forEach((head) => {
      const name = head.taxName?.trim();
      if (name) {
        const key = name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          names.push(name);
        }
      }
    });

    Object.values(demandDataMap).forEach((demandItem) => {
      const subTaxes = demandItem?.yearWiseTaxes || demandItem?.demandTaxes || [];
      subTaxes.forEach((group) => {
        group.taxHeads?.forEach((head) => {
          const name = head.taxName?.trim();
          if (name) {
            const key = name.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              names.push(name);
            }
          }
        });
      });
    });

    return names;
  }, [activeHeads, demandDataMap]);

  const policyCodeRows = useMemo(() => {
    const groupMap = new Map<string, Map<string, number | null | undefined>>();
    const financeYearIdMap = new Map<string, number | null | undefined>();
    const groupOrder: string[] = [];
    activeHeads.forEach((head) => {
      const code = head.policyCode?.trim() || 'NETTAX';
      const name = head.taxName?.trim();
      if (!groupMap.has(code)) {
        groupMap.set(code, new Map());
        groupOrder.push(code);
        if (head.financeYearId != null) {
          financeYearIdMap.set(code, head.financeYearId);
        }
      }
      if (name) groupMap.get(code)!.set(name, head.taxAmount);
    });
    return groupOrder.map((code) => ({
      policyCode: code,
      financeYearId: financeYearIdMap.get(code),
      taxAmountsByName: groupMap.get(code)!,
    }));
  }, [activeHeads]);

  if (isLoading && (!taxDetails || activeHeads.length === 0)) {
    return <ApartmentTaxDetailsSkeleton />;
  }


  return (
    <div className="mx-3 mt-4 bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden font-sans select-none relative">

      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-zinc-50 border-b border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('taxDetails')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${activeTab === 'taxDetails' ? 'bg-white text-blue-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
            >
              {t('taxDetails.taxDetailsTab', { type: currentTaxType })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('arrears')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${activeTab === 'arrears' ? 'bg-white text-blue-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
            >
              {t('taxDetails.arrearsTab')}
            </button>
          </div>
          {/* <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
            Mode: {currentTaxType === 'CV' ? 'Capital Value (CV)' : currentTaxType === 'Dual' ? 'Dual Method (RV + CVM)' : 'Rateable Value (RV)'}
          </span> */}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs min-w-max">
          <thead>
            <tr className="bg-[#1E3A8A] text-white">
              <th className="p-2 border border-blue-900 font-bold uppercase tracking-wider text-[11px] min-w-[120px]">
                {activeTab === 'taxDetails' ? t('taxDetails.taxTypes') : t('taxDetails.years')}
              </th>
              {uniqueTaxNames.map((taxName, idx) => (
                <th key={`${taxName}-${idx}`} className="p-2 border border-blue-900 font-bold uppercase tracking-wider text-[11px] text-center">
                  {taxName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {policyCodeRows.length > 0 ? (
              policyCodeRows.map((row) => (
                <Fragment key={row.policyCode}>
                  <tr className="bg-white hover:bg-zinc-50/50 transition-colors">
                    <td className="p-2 border border-zinc-200 font-extrabold text-[11px] text-[#1E3A8A] uppercase">
                      <div className="flex items-center justify-between gap-1">
                        <span>{row.policyCode}</span>
                        {(activeTab === 'arrears' || row.policyCode?.trim().toUpperCase() === 'DEMAND') && (
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(row.policyCode, row.financeYearId)}
                            title="Toggle expanded table breakdown"
                            className={`p-0.5 rounded hover:bg-blue-100 text-[#1E3A8A] transition-transform duration-200 cursor-pointer ${
                              expandedRows[row.policyCode] ? 'rotate-90 bg-blue-100' : ''
                            }`}
                          >
                            <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        )}
                      </div>
                    </td>
                    {uniqueTaxNames.map((taxName, idx) => (
                      <td key={`${row.policyCode}-${taxName}-${idx}`} className="p-2 border border-zinc-200 text-center font-semibold text-zinc-800">
                        {formatVal(row.taxAmountsByName.get(taxName))}
                      </td>
                    ))}
                  </tr>
                  {expandedRows[row.policyCode] && (() => {
                    const fetchKey = `${wardId}_${propertyNo}_${currentTaxType}_${row.policyCode}`;
                    return (
                      <ApartmentDemandSubTable
                        rowPolicyCode={row.policyCode}
                        uniqueTaxNames={uniqueTaxNames}
                        demandItem={demandDataMap[fetchKey]}
                        isLoading={loadingDemandMap[fetchKey]}
                      />
                    );
                  })()}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={uniqueTaxNames.length + 1 || 1} className="p-4 text-center text-zinc-500 italic">
                  {t('taxDetails.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
