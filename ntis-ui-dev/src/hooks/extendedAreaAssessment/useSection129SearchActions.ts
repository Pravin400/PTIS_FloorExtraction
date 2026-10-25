import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { useTranslations } from "next-intl";
import type { SingleAssessmentForm, SingleAssessmentResult } from "@/types/extended-area-assessment.types";
import { emptyForm, emptyResult } from "./mapSection129Api";

export interface UseSection129SearchActionsOptions {
  form: SingleAssessmentForm;
  t: ReturnType<typeof useTranslations>;
  initialCurrentFinancialYear: string | null;
  setPropertyId: (id: number | null) => void;
  setForm: (form: SingleAssessmentForm) => void;
  setResult: (result: SingleAssessmentResult) => void;
  /** Which of UPIC/Old GP Number the user last actually typed into — NOT just whichever is
   *  non-empty, since a successful search of either one auto-fills the OTHER field too (the
   *  resolved property's own UPIC/Old GP Number, for display). `handleSearchAny` needs this to
   *  know which field the user means to search by now, instead of always re-searching whichever
   *  field happens to still hold a value from the previous result. */
  lastEditedField: "upic" | "oldGpNo" | null;
}

/** The single-assessment screen's UPIC/Old GP Number search + Reset actions — both drive Next.js
 *  navigation (URL search params), which triggers the server-side data fetch for the new query. */
export function useSection129SearchActions({
  form,
  t,
  initialCurrentFinancialYear,
  setPropertyId,
  setForm,
  setResult,
  lastEditedField,
}: UseSection129SearchActionsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (overrideSearchQuery?: string, field: "upic" | "oldGpNo" = "upic") => {
    const targetQuery = (overrideSearchQuery ?? (field === "oldGpNo" ? form.oldGpNo : form.upic)).trim();
    if (!targetQuery) {
      toast.error(
        field === "oldGpNo"
          ? t("messages.enterOldGpNo") ?? "Enter an Old Gram Panchayat Number to search."
          : t("messages.enterUpic") ?? "Enter a UPIC Number to search."
      );
      return;
    }
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (field === "oldGpNo") {
        params.set("oldGpNo", targetQuery);
        params.delete("upic");
      } else {
        params.set("upic", targetQuery);
        params.delete("oldGpNo");
      }
      // A UPIC/Old GP Number search is a different lookup path than the Ward/Property No
      // cascading dropdown — clear any leftover selection from that path, or else page.tsx only
      // re-resolves the dropdown from THIS search's result when those params are absent,
      // otherwise it keeps showing the stale ward/property from whatever was selected (or
      // resolved) before this search.
      params.delete("wardId");
      params.delete("propertyId");
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  /** Used by the shared search button next to Old GP Number: searches by whichever of the two
   *  fields the user actually last edited, falling back to UPIC (then Old GP Number) when neither
   *  has been touched yet — NOT just "whichever currently has a value", since a prior successful
   *  search auto-fills both fields (the resolved property's own UPIC + Old GP Number), so that
   *  alone can't tell which one the user means to search by now. */
  const handleSearchAny = () => {
    const upicVal = form.upic.trim();
    const oldGpVal = form.oldGpNo.trim();
    if (!upicVal && !oldGpVal) {
      toast.error(
        t("messages.enterUpicOrOldGpNo") ?? "Enter a UPIC Number or Old Gram Panchayat Number to search."
      );
      return;
    }
    if (lastEditedField === "oldGpNo" && oldGpVal) {
      handleSearch(oldGpVal, "oldGpNo");
    } else if (upicVal) {
      handleSearch(upicVal, "upic");
    } else {
      handleSearch(oldGpVal, "oldGpNo");
    }
  };

  const handleReset = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("upic");
      params.delete("oldGpNo");
      params.delete("wardId");
      params.delete("propertyId");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
    setPropertyId(null);
    setForm(emptyForm());
    setResult(emptyResult(initialCurrentFinancialYear ?? ""));
    toast.success(t("messages.formReset"));
  };

  return { isSearching: isPending, handleSearch, handleSearchAny, handleReset };
}
