import { toast } from "sonner";
import type { useTranslations } from "next-intl";
import type { useRouter } from "next/navigation";
import { useConfirm } from "@/components/common";
import { applySection129AAction, recalculateSection129AAction } from "@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action";
import type { SingleAssessmentForm, SingleAssessmentResult } from "@/types/extended-area-assessment.types";
import { mapApiToUi } from "./mapSection129Api";

export interface UseSection129SaveActionsOptions {
  propertyId: number | null;
  form: SingleAssessmentForm;
  /** Current schedule — its earliest row's financial year is shown in the "already applied" recalculate confirmation. */
  result: SingleAssessmentResult;
  changed: boolean;
  setForm: (updater: (prev: SingleAssessmentForm) => SingleAssessmentForm) => void;
  setResult: (result: SingleAssessmentResult) => void;
  setIsSaving: (saving: boolean) => void;
  t: ReturnType<typeof useTranslations>;
  router: ReturnType<typeof useRouter>;
  /** Called after a successful first-time Apply, so the screen can keep the OC Date hidden until the property is searched again. */
  onApplied?: () => void;
}

/** The single-assessment screen's "Recalculate Assessment" button: applies the officer-entered
 *  facts (first-ever click) or re-syncs the schedule (once already applied), each with its own
 *  validation flow, plus the separate manual "Recalculate" action once applied.
 *  Area Inclusion Date is auto-fetched ward-wise (WardSection129DateMaster) and OC Date is read from
 *  the property's own Occupancy Certificate, so there is no date entry/validation here; the
 *  property-change fields (Area/Use/Other Structural Change) and the "use OC Date as the basis"
 *  checkbox are sent with every Apply/Recalculate so those edits actually take effect. */
export function useSection129SaveActions({
  propertyId,
  form,
  result,
  changed,
  setForm,
  setResult,
  setIsSaving,
  t,
  router,
  onApplied,
}: UseSection129SaveActionsOptions) {
  const { confirm } = useConfirm();

  const validateChangeFacts = () => {
    if (changed && (!form.changeDate || !form.changeDetails.trim())) {
      toast.error(
        t("messages.changeDetailsRequired") ??
          "Change Effective Date and Change Details are required when Increase in Area, Change of Use, or Other Structural / Assessment Change is set to Yes."
      );
      return false;
    }
    return true;
  };

  const performApply = async () => {
    if (!propertyId) return;
    setIsSaving(true);
    try {
      const res = await applySection129AAction(propertyId, {
        areaChanged: form.areaChanged === "yes",
        useChanged: form.useChanged === "yes",
        otherStructuralChange: form.otherChanged === "yes",
        otherStructuralChangeEffectiveDate: form.changeDate || null,
        changeDetailsRemark: form.changeDetails || null,
        remarks: form.remarks || null,
        useOcDateBasis: form.useOcDateBasis,
      });
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Failed to apply Section 129A.");
        return;
      }
      const mapped = mapApiToUi(res.data);
      setForm((prev) => ({ ...prev, ...mapped.form }));
      setResult(mapped.result);
      if (res.data.recalculateBlockedReason === "BasisNotCalculated") {
        toast.info(t("messages.recalculateBasisNotCalculated"));
      } else {
        onApplied?.();
        toast.success(t("messages.caseSaved"));
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!propertyId) {
      toast.error(t("messages.propertyNotFound") ?? "Search for a property first.");
      return;
    }

    if (!validateChangeFacts()) return;

    void performApply();
  };

  const performRecalculate = async () => {
    if (!propertyId) return;
    setIsSaving(true);
    try {
      const res = await recalculateSection129AAction(propertyId, {
        areaChanged: form.areaChanged === "yes",
        useChanged: form.useChanged === "yes",
        otherStructuralChange: form.otherChanged === "yes",
        otherStructuralChangeEffectiveDate: form.changeDate || null,
        changeDetailsRemark: form.changeDetails || null,
        useOcDateBasis: form.useOcDateBasis,
      });
      if (!res.success || !res.data) {
        toast.error(res.error ?? "Failed to recalculate Section 129A.");
        return;
      }
      const mapped = mapApiToUi(res.data);
      setForm((prev) => ({ ...prev, ...mapped.form }));
      setResult(mapped.result);
      if (res.data.recalculateBlockedReason === "BaseTaxCodeChanged") {
        toast.info(
          t("messages.recalculateBaseTaxCodeChanged", {
            appliedTaxCode: res.data.appliedBaseTaxCode ?? "",
            currentTaxCode: res.data.baseTaxCode ?? "",
          })
        );
      } else if (res.data.recalculateBlockedReason === "BasisNotCalculated") {
        toast.info(t("messages.recalculateBasisNotCalculated"));
      } else {
        toast.success(t("messages.recalculated"));
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!propertyId) {
      toast.error(t("messages.propertyNotFound") ?? "Search for a property first.");
      return;
    }

    if (!validateChangeFacts()) return;

    // The rule was already applied earlier (this is what routes a click here instead of to
    // handleSave/Apply) — always confirm before recalculating again, showing the year the
    // schedule was first applied from (the earliest row already on the schedule).
    const appliedFromYear = result.rows[0]?.financialYear;
    confirm({
      variant: "warning",
      title: t("messages.recalculateConfirmTitle"),
      description: appliedFromYear
        ? t("messages.recalculateConfirmDescription", { year: appliedFromYear })
        : t("messages.recalculateConfirmDescriptionGeneric"),
      confirmText: t("messages.recalculateConfirmYes"),
      cancelText: t("messages.recalculateConfirmNo"),
      onConfirm: performRecalculate,
    });
  };

  return { handleSave, handleRecalculate };
}
