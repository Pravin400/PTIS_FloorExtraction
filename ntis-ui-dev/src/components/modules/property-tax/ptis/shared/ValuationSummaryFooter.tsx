import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import { type BadgeThemeColor } from './TaxBadge';
import { getTranslations } from 'next-intl/server';
import { TaxDetailsContainer } from './TaxDetailsContainer';
import {
  formatCurrencyValue,
  formatCompactCurrency,
  formatAreaUnit,
} from '@/lib/utils/propertyComparison.utils';
import { Expand, ArrowLeftRight, PieChart, Receipt, Calculator } from 'lucide-react';
import { VarianceDiffBadge } from './VarianceDiffBadge';
import { Tooltip } from '@/components/common/Tooltip';

/**
 * Represents a single badge in the summary footer (maintained for prop compatibility)
 */
export interface SummaryBadge {
  label: string;
  value: number | string;
  color: BadgeThemeColor;
}

export interface ValuationSummaryFooterProps {
  title: string;
  badges?: SummaryBadge[];
  comparisonData?: PropertyComparisonResponse | null;
  initialTaxDetails?: TaxDetailsData;
  locale?: string;
}

/**
 * ValuationSummaryFooter Component
 * Displays comparison metrics cards in ONE single horizontal line.
 * Uses the custom common Tooltip component to show complete formatted values on hover.
 */
export async function ValuationSummaryFooter({
  title,
  badges,
  comparisonData,
  initialTaxDetails,
  locale = 'en',
}: ValuationSummaryFooterProps) {
  const tVal = await getTranslations({ locale, namespace: 'ptis.modules.PtisTaxDetails' });

  // 1. AREA DATA
  const areaUnit = formatAreaUnit(comparisonData?.area?.unit);
  const oldArea = comparisonData?.area ? comparisonData.area.old : 0;
  const newArea = comparisonData?.area ? comparisonData.area.new : 0;
  const areaDiff = comparisonData?.area ? comparisonData.area.change : newArea - oldArea;

  // 2. CHANGE OF USE DATA
  const oldUseType = comparisonData?.changeOfUse?.oldUse ?? 'N/A';
  const newUseType = comparisonData?.changeOfUse?.newUse ?? 'Mix';
  const hasChangedUse =
    comparisonData?.changeOfUse != null
      ? comparisonData.changeOfUse.hasChanged
      : oldUseType !== newUseType && oldUseType !== 'N/A';

  // 3. BADGE FALLBACK CALCULATIONS (when comparisonData is absent)
  const oldValRVBadge = badges?.find(
    (item) => item.label === tVal('oldTotalRv') || item.label === tVal('oldTotalCv')
  );
  const newValRVBadge = badges?.find(
    (item) => item.label === tVal('totalRv') || item.label === tVal('totalCv')
  );
  const oldValALVBadge = badges?.find((item) => item.label === tVal('oldTotalAlv'));
  const newValALVBadge = badges?.find((item) => item.label === tVal('totalAlv'));
  const oldTaxBadge = badges?.find((item) => item.label === tVal('oldTotalTax'));
  const newTaxBadge = badges?.find((item) => item.label === tVal('totalTax'));

  // 4. ALV DATA
  const oldValALV = comparisonData?.alv
    ? comparisonData.alv.old
    : Number(oldValALVBadge?.value ?? 0);
  const newValALV = comparisonData?.alv
    ? comparisonData.alv.new
    : Number(newValALVBadge?.value ?? 0);
  const valDiffALV = comparisonData?.alv ? comparisonData.alv.change : newValALV - oldValALV;

  // 5. RV/CV DATA
  const isCV = oldValRVBadge?.label === tVal('oldTotalCv') || Boolean(comparisonData?.cv);
  const valLabel = isCV ? tVal('cv') : tVal('rv');
  const rvOrCvData = isCV ? comparisonData?.cv : comparisonData?.rv;
  const oldValRV = rvOrCvData ? rvOrCvData.old : Number(oldValRVBadge?.value ?? 0);
  const newValRV = rvOrCvData ? rvOrCvData.new : Number(newValRVBadge?.value ?? 0);
  const valDiffRV = rvOrCvData ? rvOrCvData.change : newValRV - oldValRV;

  // 6. TAX DATA
  const oldTax = comparisonData?.tax && !isCV ? comparisonData.tax.old : Number(oldTaxBadge?.value ?? 0);
  const newTax = comparisonData?.tax && !isCV ? comparisonData.tax.new : Number(newTaxBadge?.value ?? 0);
  const taxDiff = comparisonData?.tax && !isCV ? comparisonData.tax.change : newTax - oldTax;

  // ALV Card is hidden unless explicitly present with non-zero values in comparison data, and always hidden for Capital Valuation (isCV is true)
  const hasALVCard = !isCV && Boolean(
    comparisonData?.alv && (comparisonData.alv.old !== 0 || comparisonData.alv.new !== 0)
  );

  const metricsCards = (
    <div className="flex flex-nowrap items-center gap-2 xl:gap-3 min-w-max ml-auto py-0.5">
      {/* Card 1: Area */}
      <div className="flex items-center justify-between gap-2.5 bg-white rounded-xl border border-gray-200 border-t-[3px] border-t-blue-600 p-2 sm:p-2.5 shadow-sm transition-all duration-200 hover:shadow-md shrink-0 min-w-[240px] xl:min-w-[260px]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-inner">
            <Expand className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-blue-600 font-extrabold text-[11px] sm:text-[12px] xl:text-[13px] whitespace-nowrap mb-0.5">
              {tVal('area')}
            </span>
            <div className="flex flex-col text-[9.5px] sm:text-[10.5px] xl:text-[11px] text-gray-500 font-medium leading-snug whitespace-nowrap">
              <Tooltip
                content={`Old Area: ${oldArea.toLocaleString('en-IN')} ${areaUnit}`}
                placement="top"
              >
                <span className="whitespace-nowrap cursor-help">
                  {tVal('oldLabel')}{' '}
                  <span className="font-bold text-gray-800">
                    {oldArea.toLocaleString('en-IN')} {areaUnit}
                  </span>
                </span>
              </Tooltip>
              <Tooltip
                content={`New Area: ${newArea.toLocaleString('en-IN')} ${areaUnit}`}
                placement="top"
              >
                <span className="whitespace-nowrap cursor-help">
                  {tVal('newLabel')}{' '}
                  <span className="font-bold text-blue-600">
                    {newArea.toLocaleString('en-IN')} {areaUnit}
                  </span>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="border-l border-gray-200 h-7 sm:h-8 mx-0.5 shrink-0"></div>
        <div className="shrink-0">
          <VarianceDiffBadge diff={areaDiff} unit={areaUnit} />
        </div>
      </div>

      {/* Card 2: Change of Use */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 border-t-[3px] border-t-purple-600 p-2 sm:p-2.5 shadow-sm transition-all duration-200 hover:shadow-md shrink-0 min-w-[190px] xl:min-w-[210px]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-50/80 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/60 shadow-inner">
            <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-purple-600 font-extrabold text-[11px] sm:text-[12px] xl:text-[13px] whitespace-nowrap mb-0.5">
              {tVal('changeOfUse')}
            </span>
            <div className="flex flex-col text-[9.5px] sm:text-[10.5px] xl:text-[11px] text-gray-500 font-medium leading-snug whitespace-nowrap">
              <Tooltip content={`Old Use: ${oldUseType}`} placement="top">
                <span className="whitespace-nowrap cursor-help">
                  {tVal('oldLabel')} <span className="font-bold text-gray-800">{oldUseType}</span>
                </span>
              </Tooltip>
              <Tooltip content={`New Use: ${newUseType}`} placement="top">
                <span className="whitespace-nowrap cursor-help">
                  {tVal('newLabel')} <span className="font-bold text-purple-600">{newUseType}</span>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="border-l border-gray-200 h-7 sm:h-8 mx-0.5 shrink-0"></div>
        <div className="shrink-0">
          <span
            className={`text-[9px] sm:text-[10px] xl:text-[10.5px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md uppercase tracking-wider leading-none border shrink-0 ${
              hasChangedUse
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {hasChangedUse ? tVal('yes') : tVal('no')}
          </span>
        </div>
      </div>

      {/* Card 3: ALV (renders conditionally if non-zero ALV present) */}
      {hasALVCard && (
        <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 border-t-[3px] border-t-indigo-600 p-2 sm:p-2.5 shadow-sm transition-all duration-200 hover:shadow-md shrink-0 min-w-[170px] xl:min-w-[190px]">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/60 shadow-inner">
              <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-indigo-600 font-extrabold text-[11px] sm:text-[12px] xl:text-[13px] whitespace-nowrap mb-0.5">
                {tVal('alv')}
              </span>
              <div className="flex flex-col text-[9.5px] sm:text-[10.5px] xl:text-[11px] text-gray-500 font-medium leading-snug whitespace-nowrap">
                <Tooltip
                  content={`Old ${tVal('alv')}: ${formatCurrencyValue(oldValALV)}`}
                  placement="top"
                >
                  <span className="whitespace-nowrap cursor-help">
                    {tVal('oldLabel')}{' '}
                    <span className="font-bold text-gray-800">
                      {formatCompactCurrency(oldValALV).compact}
                    </span>
                  </span>
                </Tooltip>
                <Tooltip
                  content={`New ${tVal('alv')}: ${formatCurrencyValue(newValALV)}`}
                  placement="top"
                >
                  <span className="whitespace-nowrap cursor-help">
                    {tVal('newLabel')}{' '}
                    <span className="font-bold text-indigo-600">
                      {formatCompactCurrency(newValALV).compact}
                    </span>
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="border-l border-gray-200 h-7 sm:h-8 mx-0.5 shrink-0"></div>
          <div className="shrink-0">
            <VarianceDiffBadge diff={valDiffALV} isCurrency />
          </div>
        </div>
      )}

      {/* Card 4: RV/CV */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 border-t-[3px] border-t-orange-500 p-2 sm:p-2.5 shadow-sm transition-all duration-200 hover:shadow-md shrink-0 min-w-[170px] xl:min-w-[190px]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-50/80 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100/60 shadow-inner">
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-orange-600 font-extrabold text-[11px] sm:text-[12px] xl:text-[13px] whitespace-nowrap mb-0.5">
              {valLabel}
            </span>
            <div className="flex flex-col text-[9.5px] sm:text-[10.5px] xl:text-[11px] text-gray-500 font-medium leading-snug whitespace-nowrap">
              <Tooltip
                content={`Old ${valLabel}: ${formatCurrencyValue(oldValRV)}`}
                placement="top"
              >
                <span className="whitespace-nowrap cursor-help">
                  {tVal('oldLabel')}{' '}
                  <span className="font-bold text-gray-800">
                    {formatCompactCurrency(oldValRV).compact}
                  </span>
                </span>
              </Tooltip>
              <Tooltip
                content={`New ${valLabel}: ${formatCurrencyValue(newValRV)}`}
                placement="top"
              >
                <span className="whitespace-nowrap cursor-help">
                  {tVal('newLabel')}{' '}
                  <span className="font-bold text-orange-600">
                    {formatCompactCurrency(newValRV).compact}
                  </span>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="border-l border-gray-200 h-7 sm:h-8 mx-0.5 shrink-0"></div>
        <div className="shrink-0">
          <VarianceDiffBadge diff={valDiffRV} isCurrency />
        </div>
      </div>

      {/* Card 5: Tax */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 border-t-[3px] border-t-emerald-600 p-2 sm:p-2.5 shadow-sm transition-all duration-200 hover:shadow-md shrink-0 min-w-[170px] xl:min-w-[190px]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 shadow-inner">
            <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-emerald-600 font-extrabold text-[11px] sm:text-[12px] xl:text-[13px] whitespace-nowrap mb-0.5">
              {tVal('tax')}
            </span>
            <div className="flex flex-col text-[9.5px] sm:text-[10.5px] xl:text-[11px] text-gray-500 font-medium leading-snug whitespace-nowrap">
              <Tooltip content={`Old Tax: ${formatCurrencyValue(oldTax)}`} placement="top">
                <span className="whitespace-nowrap cursor-help">
                  {tVal('oldLabel')}{' '}
                  <span className="font-bold text-gray-800">
                    {formatCompactCurrency(oldTax).compact}
                  </span>
                </span>
              </Tooltip>
              <Tooltip content={`New Tax: ${formatCurrencyValue(newTax)}`} placement="top">
                <span className="whitespace-nowrap cursor-help">
                  {tVal('newLabel')}{' '}
                  <span className="font-bold text-emerald-600">
                    {formatCompactCurrency(newTax).compact}
                  </span>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="border-l border-gray-200 h-7 sm:h-8 mx-0.5 shrink-0"></div>
        <div className="shrink-0">
          <VarianceDiffBadge diff={taxDiff} isCurrency />
        </div>
      </div>
    </div>
  );

  return (
    <TaxDetailsContainer
      title={title}
      initialTaxDetails={initialTaxDetails}
      metricsCards={metricsCards}
    />
  );
}
