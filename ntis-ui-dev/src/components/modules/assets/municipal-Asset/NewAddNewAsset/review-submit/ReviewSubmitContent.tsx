'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common';
import { ReviewCards } from './ReviewCards';
import { AssetSummaryCard } from './AssetSummaryCard';
import { ImportantNotesCard } from './ImportantNotesCard';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { ConfirmationCheckbox } from './ConfirmationCheckbox';
import { getNewAssetValuationDataAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/action';

import type { ReviewSubmitContentProps, ValuationResponse } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function ReviewSubmitContent({ 
  onEditStep, 
  isConfirmed, 
  setIsConfirmed, 
  assetId, 
  isBuilding,
  formData,
  ownershipTypes,
  initialValuationData
}: ReviewSubmitContentProps) {
  const t = useTranslations('newAddNewAsset.review');
  const [loading, setLoading] = useState(!initialValuationData && assetId > 0);
  const [valuationData, setValuationData] = useState<ValuationResponse | null>(initialValuationData || null);
  const [error, setError] = useState<string | null>(null);

  const fetchValuation = useCallback(async () => {
    if (assetId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getNewAssetValuationDataAction(assetId, isBuilding);
      if (res && res.success) {
        setValuationData(res as ValuationResponse);
        setError(null);
      } else {
        setError(res?.error || t('failedToLoadValuation') || 'Failed to calculate valuation data.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : undefined;
      setError(errorMessage || t('failedToLoadValuation') || 'An unexpected error occurred while loading valuation data.');
    } finally {
      setLoading(false);
    }
  }, [assetId, isBuilding, t]);

  useEffect(() => {
    let isCancelled = false;
    if (!initialValuationData && assetId > 0) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          fetchValuation();
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [initialValuationData, assetId, fetchValuation]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-sm font-semibold">{t('calculatingValuation')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] p-8 bg-white border border-rose-200 rounded-xl shadow-sm gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-bold text-slate-800 mb-1">{t('reviewDataUnavailable') || 'Review Data Unavailable'}</h3>
          <p className="text-xs text-rose-600 font-medium mb-1">{error}</p>
          <p className="text-xs text-slate-500">
            {t('reviewDataUnavailableHint') || 'Could not load complete valuation and floor records. Please verify prior steps or retry loading.'}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="secondary"
            onClick={() => onEditStep(1)}
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('backToEdit') || 'Back to Edit'}
          </Button>
          <Button
            variant="primary"
            onClick={() => fetchValuation()}
            type="button"
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('retry') || 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  const asset = valuationData?.asset;
  const floors = valuationData?.floors || [];
  const inventories = valuationData?.inventories || [];
  const cvRollup = valuationData?.cvRollup;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-slate-500">
          {t('reviewDisclaimer') || 'Review all asset details, valuation, and facilities before final activation.'}
        </span>
        <button
          type="button"
          onClick={() => fetchValuation()}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh latest valuation data"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {t('refreshData') || 'Refresh Data'}
        </button>
      </div>
      {/* Top Row: Review Cards for Steps 1, 2, 3 side-by-side */}
      <ReviewCards 
        onEdit={onEditStep} 
        formData={formData}
        asset={asset}
        inventories={inventories}
        cvRollup={cvRollup}
        ownershipTypes={ownershipTypes}
      />

      {/* Bottom Section: Two balanced columns */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Bottom Left Column */}
        <div className="flex-1 flex flex-col gap-4">
          <AssetSummaryCard 
            floors={formData?.floors && formData.floors.length > 0 ? formData.floors : floors}
            inventories={inventories}
            cvRollup={cvRollup}
            asset={asset}
          />
          <ImportantNotesCard />
        </div>

        {/* Bottom Right Column */}
        <div className="w-full lg:w-[500px] shrink-0 flex flex-col gap-4">
          <ApprovalWorkflow 
            currentStage={(asset?.currentStage ?? asset?.workflowStage) as (string | number | undefined)}
            assetStatus={(asset?.status ?? asset?.workflowStatus ?? (asset?.isActive ? 'ACTIVE' : 'DRAFT')) as (string | undefined)}
          />
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
            <ConfirmationCheckbox checked={isConfirmed} onChange={setIsConfirmed} />
          </div>
        </div>
      </div>
    </div>
  );
}
