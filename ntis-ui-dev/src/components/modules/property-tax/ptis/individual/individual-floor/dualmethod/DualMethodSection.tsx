'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ToastNotifier } from '@/components/common';
import { useTranslations } from 'next-intl';
import { DualMethodComparisonTable } from './components/ComparisonTable';
import { DualMethodSummary } from './components/DualMethodSummary';
import { DualMethodFloorDetails } from './components/DualMethodFloorDetails';
import { buildPtisUrl } from '@/lib/utils/params';
import { PTIS_UI_CLASSES } from '@/components/modules/property-tax/ptis/constants';
import { DUAL_METHOD_QUERY_PARAMS } from './constants';
import type { DualMethodSectionData } from './dual-method-data';

interface DualMethodSectionProps {
  propertyId?: number;
  searchParams: Record<string, string | string[] | undefined>;
  locale: string;
  initialData?: DualMethodSectionData;
  rateableSection?: React.ReactNode;
  capitalSection?: React.ReactNode;
}

export const DualMethodSection: React.FC<DualMethodSectionProps> = ({
  propertyId,
  searchParams,
  locale,
  initialData,
  rateableSection,
  capitalSection,
}) => {
  const t = useTranslations('ptis.modules.DualMethod');
  const errT = useTranslations('ptis.error');

  if (initialData?.finalErrorMessage) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 m-2">
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold">{errT('title')}</p>
          <p className="text-sm mt-0.5">{initialData.finalErrorMessage}</p>
        </div>
      </div>
    );
  }

  if (!initialData || !initialData.initialDualMethodData) {
    return (
      <div className="p-10 text-center text-gray-500 italic">
        {t('comparisonTable.emptyMessage')}
      </div>
    );
  }

  const {
    initialDualMethodData,
    finalErrorMessage,
    oldRv,
    oldTax,
    aggregatedRv,
    aggregatedCv,
    rvTotalTax,
    cvTotalTax,
    retainTotalTax,
  } = initialData;

  const rawShowDetails = Array.isArray(searchParams.showDetails)
    ? searchParams.showDetails[searchParams.showDetails.length - 1]
    : searchParams.showDetails;
    
  const canShowFloorDetails = propertyId != null;
  const showFloorDetails = canShowFloorDetails && rawShowDetails === DUAL_METHOD_QUERY_PARAMS.SHOW_DETAILS;
  
  const ptisPath = `/${locale}/property-tax/ptis`;
  const toggleHref = `${ptisPath}${buildPtisUrl(searchParams as Record<string, string | string[] | undefined>, {
    showDetails: !showFloorDetails,
  })}`;

  return (
    <div className="space-y-1 bg-slate-50 px-1">
      <DualMethodSummary
        locale={locale}
        oldData={{ rv: oldRv, tax: oldTax }}
        rateableData={{ totalRv: aggregatedRv, totalTax: rvTotalTax }}
        capitalData={{ totalCv: aggregatedCv, totalTax: cvTotalTax }}
        retainTotalTax={retainTotalTax}
      />

      {finalErrorMessage && <ToastNotifier id="dual-error" message={finalErrorMessage} type="error" />}

      <DualMethodComparisonTable locale={locale} dualMethodData={initialDualMethodData} />

      {canShowFloorDetails && (
        <div className="my-1 flex justify-center">
          <Link href={toggleHref} className={PTIS_UI_CLASSES.expandButton} scroll={false}>
            {showFloorDetails ? (
              <>
                {t('buttons.hideFloorDetails')} <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                {t('buttons.showFloorDetails')} <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Link>
        </div>
      )}

      {showFloorDetails && (
        <DualMethodFloorDetails
          rateableSection={rateableSection}
          capitalSection={capitalSection}
        />
      )}
    </div>
  );
};
