'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Building } from 'lucide-react';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import {
  useAssetGisKpis,
  useGisCorporationConfig,
  useGisDepartmentKpiMappings,
} from '@/hooks/asset-gis-api/useAssetGisQueries';
import type { GisKpiCard } from '@/types/asset-gis-asset.types';
import type { AssetKpisProps } from '@/types/asset-gis.types';
import {
  ICON_MAP,
  resolveCardTitle,
  resolveCardIcon,
  resolveCardColor,
} from './assetKpiConstants';

export type { AssetKpisProps };

function resolveCardCode(item: Record<string, unknown> | null | undefined): string {
  if (!item) return '';
  return String(
    item.kpiCode ||
    item.KpiCode ||
    item.code ||
    item.filterKey ||
    item.key ||
    item.title ||
    ''
  ).trim().toUpperCase();
}

function formatCardValue(code: string, rawValue: number, unit?: string): string {
  const isCurrency =
    unit === 'INR' ||
    code.includes('VALUE') ||
    code.includes('REVENUE') ||
    code.includes('AMOUNT') ||
    code.includes('PRICE') ||
    code.includes('TAX');

  if (isCurrency) {
    if (rawValue <= 0) return '₹ 0';
    if (rawValue >= 10000000) {
      const cr = rawValue / 10000000;
      return `₹ ${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
    }
    if (rawValue >= 100000) {
      const lk = rawValue / 100000;
      return `₹ ${lk.toFixed(lk % 1 === 0 ? 0 : 2)} L`;
    }
    return `₹ ${rawValue.toLocaleString('en-IN')}`;
  }

  return rawValue.toLocaleString('en-IN');
}

function extractMetricValue(
  summary: Record<string, unknown> | null | undefined,
  targetCode: string,
  targetTitle?: string
): { raw: number; formatted?: string; unit?: string } {
  if (!summary || typeof summary !== 'object') return { raw: 0 };

  const cardList = summary.cards || summary.Cards || (Array.isArray(summary) ? summary : null);
  if (Array.isArray(cardList)) {
    const matched = cardList.find((c: unknown) => {
      const cObj = (c || {}) as Record<string, unknown>;
      const cCode = resolveCardCode(cObj);
      const cTitle = resolveCardTitle(cObj).toUpperCase();
      return (
        cCode === targetCode ||
        cCode.replace(/[^A-Z0-9]/g, '') === targetCode.replace(/[^A-Z0-9]/g, '') ||
        (targetTitle && cTitle === targetTitle.toUpperCase())
      );
    });

    if (matched) {
      const mObj = (matched || {}) as Record<string, unknown>;
      const raw = Number(mObj.rawValue ?? mObj.RawValue ?? mObj.value ?? mObj.raw ?? mObj.count ?? 0);
      return {
        raw,
        formatted: (mObj.formattedValue || mObj.FormattedValue) as string | undefined,
        unit: (mObj.unit || mObj.Unit) as string | undefined,
      };
    }
  }

  if (summary[targetCode] !== undefined) {
    return { raw: Number(summary[targetCode]) || 0 };
  }

  const cleanTarget = targetCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [k, v] of Object.entries(summary)) {
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanK === cleanTarget && (typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean'))) {
      return { raw: Number(v) || 0 };
    }
  }

  if (targetTitle) {
    const cleanTitle = targetTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of Object.entries(summary)) {
      const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanK === cleanTitle && (typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean'))) {
        return { raw: Number(v) || 0 };
      }
    }
  }

  return { raw: 0 };
}

export function AssetKpis({ isLoading = false }: AssetKpisProps) {
  const selectedZone = useCouncilBoundaryStore((s) => s.selectedZone);
  const selectedWard = useCouncilBoundaryStore((s) => s.selectedWard);
  const selectedBlock = useCouncilBoundaryStore((s) => s.selectedBlock);
  const selectedPropertyTypeId = useCouncilBoundaryStore((s) => s.selectedPropertyTypeId);
  const documentSubmittedStatus = useCouncilBoundaryStore((s) => s.documentSubmittedStatus);
  const activeKpiCode = useCouncilBoundaryStore((s) => s.activeKpiCode);
  const setActiveKpiCode = useCouncilBoundaryStore((s) => s.setActiveKpiCode);

  const { data: corpConfig } = useGisCorporationConfig();
  const departmentId = corpConfig?.defaultDepartmentId || 3;
  const { data: masterKpis = [], isLoading: isMasterLoading } = useGisDepartmentKpiMappings(departmentId);

  const activeWardParam =
    Array.isArray(selectedBlock) && selectedBlock.length > 0
      ? selectedBlock[0]
      : typeof selectedBlock === 'string' && selectedBlock
        ? selectedBlock
        : Array.isArray(selectedWard) && selectedWard.length > 0
          ? selectedWard[0]
          : typeof selectedWard === 'string'
            ? selectedWard
            : undefined;

  const filterState = useMemo(() => {
    return {
      departmentId,
      zoneId: selectedZone && selectedZone !== 'all' ? selectedZone : undefined,
      wardId: activeWardParam && activeWardParam !== 'all' ? activeWardParam : undefined,
      assetCategoryId: documentSubmittedStatus && documentSubmittedStatus !== 'all' ? documentSubmittedStatus : undefined,
      assetTypeId: selectedPropertyTypeId ? selectedPropertyTypeId : undefined,
      kpiCode: activeKpiCode || undefined,
    };
  }, [departmentId, selectedZone, activeWardParam, documentSubmittedStatus, selectedPropertyTypeId, activeKpiCode]);

  const { data: kpiSummary, isLoading: isQueryLoading } = useAssetGisKpis(filterState);

  const cards: GisKpiCard[] = useMemo(() => {
    const summaryObj = kpiSummary as Record<string, unknown> | null | undefined;
    const summaryCards = summaryObj?.cards || summaryObj?.Cards;
    if (Array.isArray(summaryCards) && summaryCards.length > 0) {
      return summaryCards
        .map((c: unknown, idx: number) => {
          const cardObj = (c || {}) as Record<string, unknown>;
          const code = resolveCardCode(cardObj);
          const title = resolveCardTitle(cardObj, `Metric ${idx + 1}`);
          const rawValue = Number(cardObj.rawValue ?? cardObj.value ?? cardObj.raw ?? cardObj.count ?? 0);
          const unit = String(cardObj.unit || cardObj.Unit || (code.includes('VALUE') || code.includes('REVENUE') ? 'INR' : 'Assets'));
          const formattedValue = String(cardObj.formattedValue || cardObj.FormattedValue || formatCardValue(code, rawValue, unit));

          return {
            kpiCode: code,
            title,
            rawValue,
            formattedValue,
            unit,
            icon: resolveCardIcon(cardObj, 'fa-cubes'),
            color: resolveCardColor(cardObj, idx),
            displayOrder: Number(cardObj.displayOrder || cardObj.DisplayOrder || idx + 1),
            filterKey: String(cardObj.filterKey || 'kpiCode'),
            filterValue: String(cardObj.filterValue || code),
            isSelected: Boolean(cardObj.isSelected || activeKpiCode === code),
          };
        })
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }

    if (Array.isArray(masterKpis) && masterKpis.length > 0) {
      const activeMaster = masterKpis
        .filter((m) => m.isActive !== false)
        .sort((a, b) => Number(a.displayOrder || (a as Record<string, unknown>).DisplayOrder || 0) - Number(b.displayOrder || (b as Record<string, unknown>).DisplayOrder || 0));

      if (activeMaster.length > 0) {
        return activeMaster.map((m: unknown, idx: number) => {
          const masterObj = (m || {}) as Record<string, unknown>;
          const code = resolveCardCode(masterObj);
          const title = resolveCardTitle(masterObj, `Metric ${idx + 1}`);
          const metric = extractMetricValue(summaryObj, code, title);
          const unit = String(masterObj.unit || masterObj.Unit || metric.unit || (code.includes('VALUE') || code.includes('REVENUE') ? 'INR' : 'Assets'));
          const rawValue = metric.raw;
          const formattedValue = metric.formatted || formatCardValue(code, rawValue, unit);

          return {
            kpiCode: code || `KPI_${idx + 1}`,
            title,
            rawValue,
            formattedValue,
            unit,
            icon: resolveCardIcon(masterObj, 'fa-cubes'),
            color: resolveCardColor(masterObj, idx),
            displayOrder: Number(masterObj.displayOrder || masterObj.DisplayOrder || idx + 1),
            filterKey: String(masterObj.filterKey || 'kpiCode'),
            filterValue: String(masterObj.filterValue || code),
            isSelected: activeKpiCode === code,
          };
        });
      }
    }

    if (kpiSummary && typeof kpiSummary === 'object') {
      const dynamicList: GisKpiCard[] = [];
      Object.entries(kpiSummary).forEach(([key, val], idx) => {
        if (
          typeof val === 'number' &&
          !['departmentId', 'totalCount', 'statusCode'].includes(key)
        ) {
          const formattedTitle = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .trim()
            .toUpperCase();
          const unit = key.toLowerCase().includes('value') || key.toLowerCase().includes('revenue') ? 'INR' : 'Assets';
          dynamicList.push({
            kpiCode: key.toUpperCase(),
            title: formattedTitle,
            rawValue: val,
            formattedValue: formatCardValue(key.toUpperCase(), val, unit),
            unit,
            icon: 'fa-cubes',
            color: ['#2563EB', '#059669', '#D97706', '#7C3AED', '#0284C7', '#DC2626'][idx % 6],
            displayOrder: idx + 1,
            isSelected: activeKpiCode === key.toUpperCase(),
          });
        }
      });
      if (dynamicList.length > 0) return dynamicList;
    }

    return [];
  }, [kpiSummary, masterKpis, activeKpiCode]);

  const showLoading = isLoading || isQueryLoading || isMasterLoading;

  if (!showLoading && cards.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white/60 backdrop-blur-xl border-b border-slate-200/80 z-20 px-3 py-2 shrink-0 shadow-xs">
      <div className={`grid gap-3 ${cards.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
        {cards.map((card, idx) => {
          const isSelected = activeKpiCode === card.kpiCode || card.isSelected;
          const IconComponent = ICON_MAP[card.icon] || Building;
          const baseColor = card.color || '#2563EB';

          return (
            <div key={card.kpiCode || idx} className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="cursor-pointer select-none"
                onClick={() => setActiveKpiCode(isSelected ? null : card.kpiCode)}
              >
                <div
                  className={`rounded-2xl px-3.5 py-2.5 flex flex-col transition-all duration-300 relative group overflow-hidden border bg-white shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'scale-[1.02] z-10 shadow-md'
                      : 'hover:scale-[1.01]'
                  }`}
                  style={{
                    borderColor: isSelected ? baseColor : `${baseColor}30`,
                    boxShadow: isSelected ? `0 4px 20px -2px ${baseColor}35` : undefined,
                    background: `linear-gradient(135deg, #ffffff 0%, ${baseColor}06 100%)`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{ background: baseColor }}
                  />
                  <div className="relative z-10 flex items-center gap-3 pt-0.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        background: `${baseColor}18`,
                        border: `1px solid ${baseColor}35`,
                      }}
                    >
                      <IconComponent className="w-5 h-5" style={{ color: baseColor }} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider leading-none truncate mb-1.5 text-slate-600">
                        {card.title}
                      </p>

                      <div className="flex items-baseline gap-1.5">
                        {showLoading ? (
                          <div className="h-6 w-16 bg-slate-200 animate-pulse rounded" />
                        ) : (
                          <span
                            className="text-[21px] font-black leading-none tracking-tight"
                            style={{ color: baseColor }}
                          >
                            {card.formattedValue}
                          </span>
                        )}
                        {card.unit && !showLoading && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {card.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
