import { useTranslations } from "next-intl";
import { AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/common";
import { OldPropertyCandidate } from "@/types/property-mapping";

interface ActionFooterProps {
  selectedCandidates: OldPropertyCandidate[];
  validationStatus: {
    isValid: boolean;
    errorMsg: string | null;
    warnings: string[];
  };
  isSubmitting?: boolean;
  onConfirmClick: () => void;
}

export function ActionFooter({
  selectedCandidates,
  validationStatus,
  isSubmitting,
  onConfirmClick,
}: ActionFooterProps) {
  const t = useTranslations("propertyMapping");
  const isUnmappedMode = selectedCandidates.length === 0;

  return (
    <footer className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Validation / error alerts container */}
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        {validationStatus.errorMsg ? (
          <div className="flex items-center gap-2 text-rose-700 bg-rose-50/50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold leading-normal">
            <ShieldAlert size={14} className="text-rose-600 shrink-0 animate-pulse" />
            <span>{validationStatus.errorMsg}</span>
          </div>
        ) : validationStatus.warnings.length > 0 ? (
          <div className="flex flex-col gap-1">
            {validationStatus.warnings.map((w, idx) => (
              <div key={idx} className="flex items-center gap-2 text-amber-800 bg-amber-50/50 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold leading-normal">
                <AlertCircle size={13} className="text-amber-600 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold leading-normal">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{t("confirmFooter.readyMessage")}</span>
          </div>
        )}
      </div>

      {/* Trigger button */}
      <Button
        type="button"
        onClick={onConfirmClick}
        disabled={!validationStatus.isValid || isSubmitting}
        variant={isUnmappedMode ? "danger" : "primary"}
        className="w-full sm:w-auto px-4.5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
      >
        {isSubmitting 
          ? "Submitting..." 
          : (isUnmappedMode ? t("confirmFooter.saveUnmappedButton") : t("confirmFooter.confirmMergeButton"))}
      </Button>
    </footer>
  );
}
