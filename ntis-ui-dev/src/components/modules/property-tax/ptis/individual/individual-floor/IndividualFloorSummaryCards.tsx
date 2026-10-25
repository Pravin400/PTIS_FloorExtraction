'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import {
  IndividualFloorSummaryCardsSkeleton,
  useIndividualFloorSummaryMetrics,
  AreaSummaryCard,
  ChangesOfUseSummaryCard,
  AlvSummaryCard,
  ValuationMethodSummaryCard,
  TaxSummaryCard,
} from './summary-cards';
import type {
  IndividualFloorSummaryCardsProps,
  IndividualFloorSummaryCardsSkeletonProps,
} from './summary-cards';

export type { IndividualFloorSummaryCardsProps, IndividualFloorSummaryCardsSkeletonProps };
export { IndividualFloorSummaryCardsSkeleton };

export const IndividualFloorSummaryCards: React.FC<IndividualFloorSummaryCardsProps> = (props) => {
  const {
    rateableData,
    capitalData,
    dualMethodData,
    comparisonData,
    oldDetailsData,
    taxMode = 'rateable',
    isLoading = false,
    className,
  } = props;

  const t = useTranslations('individual.summaryCards');
  const tCommon = useTranslations('common');
  const metrics = useIndividualFloorSummaryMetrics(props);

  if (isLoading) {
    return <IndividualFloorSummaryCardsSkeleton taxMode={taxMode} className={className} />;
  }

  // Dual/Capital/Rateable values computation for Card 4
  const card4Title = metrics.isCapitalMode ? t('capitalValue') : metrics.isDualMode ? t('rvVsCv') : t('rateableValue');
  const card4Label1 = metrics.isDualMode ? t('rv') : t('old');
  const card4Value1 = metrics.isDualMode
    ? metrics.formatRupeeShort(comparisonData?.rv?.new ?? dualMethodData?.totalRv ?? rateableData?.totalRateableValue, Boolean(comparisonData?.rv?.new || dualMethodData?.totalRv || rateableData != null))
    : metrics.isCapitalMode
      ? metrics.formatRupeeShort(metrics.oldCv, metrics.hasCompCv || Boolean(oldDetailsData?.oldCV))
      : metrics.formatRupeeShort(metrics.oldRv, metrics.hasCompRv || Boolean(oldDetailsData?.oldRV));
  const card4Label2 = metrics.isDualMode ? t('cv') : t('new');
  const card4Value2 = metrics.isDualMode
    ? metrics.formatRupeeShort(comparisonData?.cv?.new ?? dualMethodData?.totalCv ?? metrics.newCv, Boolean(comparisonData?.cv?.new || dualMethodData?.totalCv || capitalData != null))
    : metrics.isCapitalMode
      ? metrics.formatRupeeShort(metrics.newCv, metrics.hasCompCv || Boolean(capitalData != null || metrics.newCv > 0))
      : metrics.formatRupeeShort(metrics.newRv, metrics.hasCompRv || Boolean(rateableData != null || metrics.newRv > 0));
  const card4Value2Class = metrics.isDualMode ? 'font-black text-purple-900' : 'font-black text-slate-900';
  const card4DeltaLabel = metrics.isDualMode ? t('rvCvm') : metrics.isCapitalMode ? metrics.formattedCvDelta : metrics.formattedRvDelta;
  const isCard4Negative = !metrics.isDualMode && (metrics.isCapitalMode ? metrics.cvPercent : metrics.rvPercent) < 0;

  // Tax values computation for Card 5
  const card5Title = metrics.isDualMode ? t('taxRetained') : t('taxCurrent');
  const card5Label1 = t('old');
  const card5Value1 = metrics.isDualMode
    ? metrics.formatRupeeShort(comparisonData?.tax?.old ?? dualMethodData?.oldTaxesTotal ?? metrics.oldTax, metrics.hasCompTax || Boolean(dualMethodData?.oldTaxesTotal || metrics.oldTax))
    : metrics.formatRupeeShort(metrics.oldTax, metrics.hasCompTax || Boolean(oldDetailsData?.oldTotalTax));
  const card5Label2 = metrics.isDualMode ? t('retained') : t('new');
  const card5Value2 = metrics.isDualMode
    ? metrics.formatRupeeShort(comparisonData?.tax?.new ?? dualMethodData?.retainTaxesTotal ?? metrics.newTax, metrics.hasCompTax || Boolean(dualMethodData?.retainTaxesTotal || rateableData != null))
    : metrics.formatRupeeShort(metrics.newTax, metrics.hasCompTax || Boolean(metrics.newTax > 0 || (metrics.isCapitalMode ? capitalData != null : rateableData != null)));
  const card5Value2Class = metrics.isDualMode ? 'font-black text-rose-700' : 'font-black text-slate-900';
  const card5DeltaLabel = metrics.isDualMode ? t('beneficial') : metrics.formattedTaxDelta;

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 my-0 select-none w-full items-stretch',
        metrics.isCapitalMode ? 'xl:grid-cols-4' : 'xl:grid-cols-5',
        className
      )}
    >
      <AreaSummaryCard
        label={t('area')}
        oldLabel={t('old')}
        newLabel={t('new')}
        oldArea={metrics.oldArea}
        newArea={metrics.newArea}
        hasCompArea={metrics.hasCompArea}
        changeArea={metrics.changeArea}
      />
      <ChangesOfUseSummaryCard
        label={t('changesOfUse')}
        oldLabel={t('old')}
        newLabel={t('new')}
        yesLabel={tCommon('yes')}
        noLabel={tCommon('no')}
        oldUse={metrics.oldUse}
        newUse={metrics.newUse}
        isUseUpdated={metrics.isUseUpdated}
      />
      {!metrics.isCapitalMode && (
        <AlvSummaryCard
          label={t('alv')}
          oldLabel={t('old')}
          newLabel={t('new')}
          displayOldAlv={metrics.formatRupeeShort(metrics.oldAlv, metrics.hasCompAlv || Boolean(oldDetailsData?.oldALV))}
          displayNewAlv={metrics.formatRupeeShort(metrics.newAlv, metrics.hasCompAlv || Boolean(metrics.newAlv > 0 || rateableData != null))}
          delta={metrics.formattedAlvDelta}
        />
      )}
      <ValuationMethodSummaryCard
        title={card4Title}
        isDualMode={metrics.isDualMode}
        label1={card4Label1}
        value1={card4Value1}
        label2={card4Label2}
        value2={card4Value2}
        value2Class={card4Value2Class}
        deltaLabel={card4DeltaLabel}
        isNegativeDelta={isCard4Negative}
      />
      <TaxSummaryCard
        title={card5Title}
        label1={card5Label1}
        value1={card5Value1}
        label2={card5Label2}
        value2={card5Value2}
        value2Class={card5Value2Class}
        deltaLabel={card5DeltaLabel}
      />
    </div>
  );
};

export default IndividualFloorSummaryCards;
