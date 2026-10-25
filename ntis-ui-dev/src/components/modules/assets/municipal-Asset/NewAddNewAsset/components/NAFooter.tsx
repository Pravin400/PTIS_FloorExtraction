import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { NAFooterProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function NAFooter({
  onPrevious,
  previousLabel,
  onSaveAsDraft,
  onSaveAndNext,
  showPrevious = true,
  saveAndNextLabel,
  saveAndNextDisabled = false,
  isSubmitting = false,
  isSaving = false,
  isFinalSubmitting = false,
  currentStep,
  totalSteps: _totalSteps,
}: NAFooterProps) {
  const t = useTranslations("newAddNewAsset");
  const actualSubmitting = isSubmitting || isSaving || isFinalSubmitting;
  const isDisabled = saveAndNextDisabled || actualSubmitting;
  const displayPrevious = previousLabel || t("footer.previous");
  const displaySaveAndNext = saveAndNextLabel || t("footer.saveAndNext");
  const showDraftButton = Boolean(onSaveAsDraft && (currentStep === undefined || currentStep <= 1));

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-1 flex items-center justify-between shrink-0 shadow-[0_-2px_6px_rgba(0,0,0,0.02)] z-10 h-[36px]">
      {/* Left: Previous (or Cancel) */}
      {showPrevious ? (
        <Button
          variant="secondary"
          size="xs"
          onClick={onPrevious}
          disabled={actualSubmitting}
          className="!inline-flex !flex-row !items-center !justify-center !flex-nowrap !whitespace-nowrap gap-1.5 px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-md text-[10.5px] font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer !h-[26px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{displayPrevious}</span>
          </span>
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="xs"
          onClick={onPrevious}
          disabled={actualSubmitting}
          className="!inline-flex !flex-row !items-center !justify-center !flex-nowrap !whitespace-nowrap px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-md text-[10.5px] font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer !h-[26px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="whitespace-nowrap">{t("footer.cancel")}</span>
        </Button>
      )}

      {/* Right: Save as Draft + Save & Next */}
      <div className="flex items-center gap-2">
        {showDraftButton && (
          <Button
            variant="secondary"
            size="xs"
            type="button"
            onClick={onSaveAsDraft}
            disabled={isDisabled}
            className="!inline-flex !flex-row !items-center !justify-center !flex-nowrap !whitespace-nowrap px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-md text-[10.5px] font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer !h-[26px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="whitespace-nowrap">{t("footer.saveAsDraft")}</span>
          </Button>
        )}
        <Button
          variant="primary"
          size="xs"
          type="button"
          onClick={onSaveAndNext}
          disabled={isDisabled}
          aria-busy={actualSubmitting}
          className={`!inline-flex !flex-row !items-center !justify-center !flex-nowrap !whitespace-nowrap gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold transition-all shadow-sm cursor-pointer !h-[26px] ${
            isDisabled
              ? '!bg-slate-100 !text-slate-400 cursor-not-allowed border border-slate-200'
              : '!bg-blue-600 !text-white hover:!bg-blue-700 hover:shadow-blue-500/10'
          }`}
        >
          <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">
            {actualSubmitting && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />}
            <span className="whitespace-nowrap">
              {actualSubmitting ? (displaySaveAndNext.toLowerCase().includes("update") ? t("footer.updating") : t("footer.saving")) : displaySaveAndNext}
            </span>
            {!actualSubmitting && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
          </span>
        </Button>
      </div>
    </div>
  );
}
