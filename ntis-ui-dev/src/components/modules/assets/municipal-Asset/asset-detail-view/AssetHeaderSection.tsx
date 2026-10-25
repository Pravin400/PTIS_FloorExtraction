'use client';
import Image from 'next/image';
import type { AssetHeaderSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { AssetKpiCard } from '@/types/asset/municipal-Asset/asset-detail.types';
import { AlertTriangle, Check, ArrowUp, Activity, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardCard } from '@/components/common/DashboardCard';
import { Badge, Button, Card } from '@/components/common';
import { KPI_ICON_MAP, KPI_BG_MAP, KPI_CARD_BG_MAP } from './asset-header.config';
import { AssetHealthGauge } from './AssetHealthGauge';
function KpiCard({
  kpi,
}: {
  kpi: AssetKpiCard;
}): React.ReactElement {
  const t = useTranslations('asset-detail');

  let valueColor = 'text-[#1e3a8a]';
  const labelColor = 'text-blue-900';
  if (kpi.id === 'annualRevenue') valueColor = 'text-emerald-700';
  if (kpi.id === 'occupancy') valueColor = 'text-red-500';
  if (kpi.id === 'arrears') valueColor = 'text-red-600';

  return (
    <Card
      padding="none"
      className={cn("flex flex-row items-center gap-2 rounded-lg px-2 py-1 h-full shadow-sm", KPI_CARD_BG_MAP[kpi.color] || 'bg-white')}
    >
      <div className={cn('w-8 h-8 rounded flex-shrink-0 flex items-center justify-center', KPI_BG_MAP[kpi.color] || 'bg-slate-100')}>
        {KPI_ICON_MAP[kpi.icon] ?? <Activity className="w-4 h-4" />}
      </div>
      <div className="flex flex-col items-start justify-center">
        <span className={cn("text-[14px] font-black leading-tight", valueColor)}>{kpi.value}</span>
        <span className={cn("text-[10px] font-bold leading-tight", labelColor)}>{kpi.label}</span>

        {kpi.id === 'valuation' && (kpi.constructionValue || kpi.inventoryValue) ? (
          <div className="flex flex-col gap-0.5 mt-1">
            {kpi.constructionValue && (
              <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">
                {t('constructionLabel', { defaultValue: 'Construction' })}: <span className="font-bold text-slate-700">{kpi.constructionValue}</span>
              </span>
            )}
            {kpi.inventoryValue && (
              <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">
                {t('inventoryLabel', { defaultValue: 'Inventory' })}: <span className="font-bold text-slate-700">{kpi.inventoryValue}</span>
              </span>
            )}
          </div>
        ) : kpi.subValue && (
          <span className={cn(
            'text-[9px] font-bold mt-0.5',
            kpi.subValue.startsWith('+') ? 'text-emerald-600 bg-emerald-50 px-1 rounded inline-flex items-center gap-0.5' : 'text-blue-600 bg-blue-50 px-1.5 rounded-full inline-flex items-center',
          )}>
            {kpi.subValue.startsWith('+') && <ArrowUp className="w-2.5 h-2.5" />}
            {kpi.subValue.replace('+', '')}
          </span>
        )}
      </div>
    </Card>
  );
}

export function AssetHeaderSection({ data }: AssetHeaderSectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  const router = useRouter();

  return (
    <div className="bg-blue-50/30 border border-blue-100 rounded-lg px-3 py-1.5 shadow-sm w-full flex items-stretch justify-between gap-2">
      {/* Left side: Image and Info */}
      <div className="flex items-stretch gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center justify-center !p-2 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors !min-w-0 !w-9 !h-9"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="w-[150px] rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm relative bg-slate-100 flex items-center justify-center">
          {data.photos?.[0]?.url ? (
            <Image unoptimized
              src={data.photos[0].url}
              alt={data.photos[0].alt || data.assetName}
              fill className="object-cover"
            />
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">{t('noImage', { defaultValue: 'No Image' })}</span>
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-black text-red-600 leading-normal truncate pt-1">
              {data.assetName}
            </h1>
            <span className="text-[14px] font-bold text-blue-900 flex-shrink-0 ml-1">
              {t('assetIdLabel')} : {data.assetId}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {data.badges?.map((badge, idx) => {
              let variant: 'outline' | 'success' | 'default' = 'default';
              let customClass = '';
              const lowerBadge = badge.toLowerCase();
              if (lowerBadge.includes('active')) {
                variant = 'success';
                customClass = '!bg-green-200 !text-green-800 border-transparent';
              } else if (lowerBadge.includes('condition') || lowerBadge.includes('good')) {
                variant = 'default';
                customClass = '!bg-teal-500 !text-white border-transparent';
              } else {
                variant = 'outline';
                customClass = 'border-blue-400 !text-blue-600 !bg-white';
              }
              return (
                <Badge key={idx} size="sm" variant={variant} className={cn("!h-auto !px-1.5 !py-0.5 !text-[9px] !font-bold", customClass)}>
                  {badge}
                </Badge>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium text-blue-600 truncate">{data.address}</span>
          </div>
        </div>
      </div>

      {/* Right side: Cards */}
      <div className="flex gap-2 items-stretch flex-shrink-0">
        <AssetHealthGauge value={data.assetHealth} max={data.assetHealthMax} healthLabel={t('assetHealth')} />
        <KpiCard kpi={{
          id: 'valuation',
          label: t('valuationLabel') || 'Valuation',
          value: data.kpiMetrics.valuation,
          subValue: data.kpiMetrics.valuationChange,
          constructionValue: data.kpiMetrics.constructionValue,
          inventoryValue: data.kpiMetrics.inventoryValue,
          icon: 'rupee',
          color: 'blue',
          valueColor: 'text-[#1e3a8a]'
        }} />
        <KpiCard kpi={{
          id: 'annualRevenue',
          label: t('annualRevenueLabel') || 'Annual Revenue',
          value: data.kpiMetrics.annualRevenue,
          subValue: t('currentFY') || 'Current FY',
          icon: 'trending',
          color: 'green',
          valueColor: 'text-green-600'
        }} />
        <KpiCard kpi={{
          id: 'occupancy',
          label: t('occupancyLabel') || 'Occupancy',
          value: data.kpiMetrics.occupancy,
          subValue: data.kpiMetrics.occupancyDetails,
          icon: 'users',
          color: parseInt(data.kpiMetrics.occupancy) > 50 ? 'green' : parseInt(data.kpiMetrics.occupancy) > 0 ? 'orange' : 'red',
          valueColor: parseInt(data.kpiMetrics.occupancy) > 50 ? 'text-green-600' : parseInt(data.kpiMetrics.occupancy) > 0 ? 'text-orange-600' : 'text-red-600'
        }} />
        <KpiCard kpi={{
          id: 'arrears',
          label: t('arrearsLabel') || 'Arrears',
          value: data.kpiMetrics.arrears,
          subValue: undefined,
          icon: 'file',
          color: 'blue',
          valueColor: 'text-red-600'
        }} />
        {/* Encroachment Status Card */}
        {data.encroachmentStatus && data.encroachmentStatus.toLowerCase() !== 'none' && (
          <DashboardCard
            label={t('encroachmentLabel') || "Encroachment"}
            value={
              data.encroachmentStatus.toLowerCase() === 'clean' ? (t('cleanStatus') || "Clean") :
                data.encroachmentStatus.toLowerCase() === 'fully encroached' ? (t('fullyEncroached') || "Fully Encroached") :
                  data.encroachmentStatus.toLowerCase() === 'partially encroached' ? (t('partiallyEncroached') || "Partially Encroached") :
                    data.encroachmentStatus
            }
            icon={data.encroachmentStatus.toLowerCase() === 'clean' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            iconBg={
              data.encroachmentStatus.toLowerCase() === 'clean' ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 border-none" :
                data.encroachmentStatus.toLowerCase() === 'fully encroached' ? "bg-red-500 text-white shadow-md shadow-red-200 border-none" :
                  "bg-orange-500 text-white shadow-md shadow-orange-200 border-none"
            }
            valueColor={
              data.encroachmentStatus.toLowerCase() === 'clean' ? "text-emerald-700" :
                data.encroachmentStatus.toLowerCase() === 'fully encroached' ? "text-red-700" :
                  "text-orange-700"
            }
            className={cn(
              "h-full flex-row gap-2 px-2 py-1 shadow-sm border-slate-200",
              "[&_p:first-child]:!text-[11px] [&_p:first-child]:!font-black [&_p:first-child]:!leading-tight",
              "[&_p:nth-child(2)]:!text-[10px] [&_p:nth-child(2)]:!font-bold [&_p:nth-child(2)]:!leading-tight [&_p:nth-child(2)]:mt-0.5",
              "[&_.w-1]:hidden [&_.min-w-0]:flex [&_.min-w-0]:flex-col [&_.min-w-0]:items-start [&_.min-w-0]:justify-center",
              "[&>div:last-child]:!h-8 [&>div:last-child]:!w-8 [&>div:last-child]:!border-none",
              data.encroachmentStatus.toLowerCase() === 'clean' ? "bg-emerald-50/50 [&_p:first-child]:!text-emerald-800" :
                data.encroachmentStatus.toLowerCase() === 'fully encroached' ? "bg-red-50/50 [&_p:first-child]:!text-red-600" :
                  "bg-orange-50/50 [&_p:first-child]:!text-orange-600"
            )}
          />
        )}
      </div>
    </div>
  );
}

