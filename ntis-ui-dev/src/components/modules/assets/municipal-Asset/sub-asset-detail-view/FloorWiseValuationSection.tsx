'use client';
import { useTranslations } from 'next-intl';
import React from 'react';
import { BarChart2 } from 'lucide-react';
import { SectionCard } from '../asset-detail-view/SectionCard';
import { ValuationMetricsStrip } from './ValuationMetricsStrip';
import { Table } from '@/components/common/Table';
import type { TableColumn } from '@/types/common.types';
import type { FloorWiseRow, FloorWiseValuationSectionProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';



const fmtNum = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export function FloorWiseValuationSection({ data}: FloorWiseValuationSectionProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  const columns: TableColumn<FloorWiseRow>[] = [
    { key: 'sNo', label: t('sNo'), render: (_, r) => <span className="text-blue-700 font-bold">{r.sNo}</span> },
    { key: 'floor', label: t('floorCol'), render: (_, r) => <span className="text-blue-700 font-medium whitespace-nowrap">{r.floor}</span> },
    { key: 'yearOfConstruction', label: t('yearOfConstruction'), render: (_, r) => <span className="text-blue-700 font-medium">{r.yearOfConstruction}</span> },
    { key: 'constructionType', label: t('constructionType'), render: (_, r) => <span className="text-blue-700 font-medium">{r.constructionType}</span> },
    { key: 'usage', label: t('usageCol'), render: (_, r) => <span className="text-blue-700 font-medium">{r.usage}</span> },
    { key: 'carpetArea', label: t('carpetAreaSqm'), render: (_, r) => <span className="text-blue-600 font-medium">{r.carpetArea}</span> },
    { key: 'builtupArea', label: t('builtupAreaSqm'), render: (_, r) => <span className="text-blue-600 font-medium">{r.builtupArea}</span> },
    { key: 'rrRate', label: t('rrRateSqm'), render: (_, r) => <span className="text-blue-600 font-medium">{fmtNum(r.rrRate)}</span> },
    { key: 'baseValue', label: t('baseValueRs'), render: (_, r) => <span className="text-blue-600 font-medium">{fmtNum(r.baseValue)}</span> },
    { key: 'floorFactor', label: t('floorFactorCol'), render: (_, r) => <span className="text-blue-600 font-medium">{r.floorFactor.toFixed(2)}</span> },
    { key: 'ageFactor', label: t('ageFactorCol'), render: (_, r) => <span className="text-blue-600 font-medium">{r.ageFactor.toFixed(2)}</span> },
    { key: 'ntbFactor', label: t('ntbFactorCol'), render: (_, r) => <span className="text-blue-600 font-medium">{r.ntbFactor.toFixed(2)}</span> },
    { key: 'useFactor', label: t('useFactorCol'), render: (_, r) => <span className="text-blue-600 font-medium">{r.useFactor.toFixed(2)}</span> },
    { key: 'capitalValue', label: t('capitalValueRs'), render: (_, r) => (
      <span className="text-blue-900 font-black">
        {r.capitalValue === 0 ? (
          <div className="inline-flex flex-col items-center justify-center bg-red-50 text-red-500 border border-red-200 px-1 py-0.5 rounded text-[8px] font-bold leading-none">
            <span>{t('not') || 'NOT'}</span>
            <span>{t('calculated') || 'CALCULATED'}</span>
          </div>
        ) : (
          fmtNum(r.capitalValue)
        )}
      </span>
    )}
  ];

  return (
    <SectionCard title={t('floorWiseTitle')} titleIcon={<BarChart2 className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-teal-500">
      <div className="flex flex-col gap-3">
        <ValuationMetricsStrip data={data} />
        <div className="rounded-md border border-blue-200 overflow-hidden">
          <Table
            data={data.floorWiseRows || []}
            columns={columns}
            className="[&_thead]:!bg-[#002D62] [&_th]:!text-white [&_th]:!text-center [&_th]:!font-bold [&_th]:!px-2 [&_th]:!py-1.5 [&_th]:!text-[11px] [&_th]:!border-r [&_th]:!border-[#004080] [&_th]:last:!border-r-0 [&_th]:!uppercase [&_th]:!whitespace-nowrap [&_tbody]:!bg-white [&_tr]:!border-b [&_tr]:!border-blue-50 [&_tbody_tr:hover]:!bg-blue-50 [&_tr]:!transition-colors [&_td]:!px-2 [&_td]:!py-1.5 [&_td]:!text-xs [&_td]:!leading-tight [&_td]:!text-center [&_td]:!border-r [&_td]:!border-blue-50 [&_td]:last:!border-r-0"
          />
        </div>
      </div>
    </SectionCard>
  );
}

