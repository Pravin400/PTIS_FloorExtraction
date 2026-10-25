"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Section129ActionResult } from "@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action";
import type { SingleAssessmentForm } from "@/types/extended-area-assessment.types";
import { emptyForm, emptyResult, mapApiToUi } from "./mapSection129Api";
import { useSection129SaveActions } from "./useSection129SaveActions";
import { useSection129ExportActions } from "./useSection129ExportActions";
import { useSection129SearchActions } from "./useSection129SearchActions";

export interface UseSingleAssessmentOptions {
  initialUpic?: string;
  initialOldGpNo?: string;
  initialSearchResult?: Section129ActionResult | null;
  initialCurrentFinancialYear?: string | null;
}

/** Owns the Section 129A single-assessment form + schedule.
 *  Search query values (e.g. upic, oldGpNo) update URL parameters, triggering Next.js server-side data fetching. */
export function useSingleAssessment(options: UseSingleAssessmentOptions = {}) {
  const { initialUpic = "", initialOldGpNo = "", initialSearchResult = null, initialCurrentFinancialYear = null } = options;
  const t = useTranslations("extendedAreaAssessment.single");
  const router = useRouter();

  const [propertyId, setPropertyId] = useState<number | null>(
    initialSearchResult?.success && initialSearchResult?.data ? initialSearchResult.data.propertyId : null
  );
  const [form, setForm] = useState<SingleAssessmentForm>(() => {
    const base = emptyForm();
    if (initialUpic) base.upic = initialUpic;
    if (initialOldGpNo) base.oldGpNo = initialOldGpNo;
    if (initialSearchResult?.success && initialSearchResult.data) {
      const mapped = mapApiToUi(initialSearchResult.data);
      return {
        ...base,
        ...mapped.form,
        upic: initialUpic || mapped.form.upic || "",
        oldGpNo: initialOldGpNo || mapped.form.oldGpNo || "",
      };
    }
    return base;
  });
  const [result, setResult] = useState(() => {
    if (initialSearchResult?.success && initialSearchResult.data) {
      return mapApiToUi(initialSearchResult.data).result;
    }
    return emptyResult(initialCurrentFinancialYear ?? "");
  });
  const [isSaving, setIsSaving] = useState(false);
  // The property Section 129A was first applied to in THIS session. Its OC Date / basis checkbox stay
  // hidden until it is searched again — they are only meant for a property the rule was applied to earlier.
  const [justAppliedPropertyId, setJustAppliedPropertyId] = useState<number | null>(null);

  // Synchronize component state whenever server-rendered initialSearchResult or initialUpic changes
  useEffect(() => {
    if (initialSearchResult) {
      if (initialSearchResult.success && initialSearchResult.data) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPropertyId(initialSearchResult.data.propertyId);
        const mapped = mapApiToUi(initialSearchResult.data);
        setForm((prev) => ({
          ...prev,
          ...mapped.form,
          upic: initialUpic || mapped.form.upic || prev.upic,
          oldGpNo: initialOldGpNo || mapped.form.oldGpNo || prev.oldGpNo,
        }));
        setResult(mapped.result);
      } else if (initialSearchResult.error) {
        toast.error(initialSearchResult.error);
      }
    } else if (initialUpic || initialOldGpNo) {
      setForm((prev) => ({
        ...prev,
        upic: initialUpic || prev.upic,
        oldGpNo: initialOldGpNo || prev.oldGpNo,
      }));
    }
  }, [initialSearchResult, initialUpic, initialOldGpNo]);

  const changed = form.areaChanged === "yes" || form.useChanged === "yes" || form.otherChanged === "yes";

  // Tracks which of UPIC/Old GP Number the user actually typed into most recently — NOT updated by
  // the auto-fill sync effect above, only by real edits via `setField`, so `handleSearchAny` can
  // tell which field the user means to search by even after both get cross-populated from a result.
  const [lastEditedField, setLastEditedField] = useState<"upic" | "oldGpNo" | null>(null);

  const setField = <K extends keyof SingleAssessmentForm>(key: K, value: SingleAssessmentForm[K]) => {
    if (key === "upic" || key === "oldGpNo") {
      setLastEditedField(key);
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const syncGeneralTax = (taxableValue: number, generalRate: number) => {
    setForm((prev) => ({ ...prev, taxableValue, generalRate }));
  };

  const toggleChangeField = <K extends "areaChanged" | "useChanged" | "otherChanged">(key: K, value: "yes" | "no") => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const stillChanged = next.areaChanged === "yes" || next.useChanged === "yes" || next.otherChanged === "yes";
      if (!stillChanged) {
        next.changeDate = "";
        next.changeDetails = "";
      }
      return next;
    });
  };

  const searchActions = useSection129SearchActions({
    form,
    t,
    initialCurrentFinancialYear,
    setPropertyId,
    setForm,
    setResult,
    lastEditedField,
  });
  const { isSearching } = searchActions;

  // Any new search or reset ends the "just applied" window, so the OC Date shows for that property again.
  const handleSearch: typeof searchActions.handleSearch = (...args) => {
    setJustAppliedPropertyId(null);
    return searchActions.handleSearch(...args);
  };
  const handleSearchAny: typeof searchActions.handleSearchAny = () => {
    setJustAppliedPropertyId(null);
    return searchActions.handleSearchAny();
  };
  const handleReset: typeof searchActions.handleReset = () => {
    setJustAppliedPropertyId(null);
    setLastEditedField(null);
    return searchActions.handleReset();
  };

  const showOcDate = form.caseStatus !== "Draft" && (propertyId === null || propertyId !== justAppliedPropertyId);

  const { handleSave, handleRecalculate } = useSection129SaveActions({
    propertyId,
    form,
    result,
    changed,
    setForm,
    setResult,
    setIsSaving,
    t,
    router,
    onApplied: () => setJustAppliedPropertyId(propertyId),
  });

  const { handleExportCsv, handlePrint, pdfPreviewUrl, closePdfPreview } = useSection129ExportActions(propertyId, t);

  return {
    form,
    setField,
    syncGeneralTax,
    toggleChangeField,
    changed,
    showOcDate,
    result,
    propertyId,
    isSearching,
    isSaving,
    handleSearch,
    handleSearchAny,
    handleReset,
    handleSave,
    handleRecalculate,
    handleExportCsv,
    handlePrint,
    pdfPreviewUrl,
    closePdfPreview,
  };
}

export type UseSingleAssessment = ReturnType<typeof useSingleAssessment>;
