import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createTranslator } from "next-intl";
import assetAyrEn from "@/i18n/locales/en/assetAssessmentYearRange.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  const ayr = (await import("@/i18n/locales/en/assetAssessmentYearRange.json")).default;
  const common = (await import("@/i18n/locales/en/common.json")).default;
  const t = actual.createTranslator({
    locale: "en",
    messages: ayr,
    namespace: "assetAssessmentYearRange.capitalValue",
  });
  const tCommon = actual.createTranslator({ locale: "en", messages: { common }, namespace: "common" });
  return {
    ...actual,
    useTranslations: (ns: string) => (ns === "common" ? tCommon : t),
    useLocale: () => "en",
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import {
  translateAssessmentYearRangeReferenceError,
  useAssessmentYearRangeForm,
} from "@/hooks/asset-masters/assessmentYearRange/useAssessmentYearRangeForm";
import type { AssessmentYearRangeConfig } from "@/types/asset-masters/assessment-year-range.types";

const t = createTranslator({
  locale: "en",
  messages: assetAyrEn,
  namespace: "assetAssessmentYearRange.capitalValue",
});

const backend = (op: "deleted" | "deactivated", masters: string) =>
  `This Assessment Year Range cannot be ${op} because it has ${masters}. Please delete all ${masters} for this Assessment Year Range first.`;

const MASTERS = [
  "Age Factors",
  "Age Factors and CV Rates",
  "Age Factors, Nature Factors, Use Factors, Floor Factors and CV Rates",
];

describe("asset assessment year range reference errors", () => {
  for (const op of ["deleted", "deactivated"] as const) {
    it.each(MASTERS)(`translates ${op} with %s exactly like the backend`, (masters) => {
      const message = backend(op, masters);
      expect(translateAssessmentYearRangeReferenceError(message, t as never)).toBe(message);
    });
  }

  it("ignores unrelated messages", () => {
    expect(translateAssessmentYearRangeReferenceError("Year range overlaps", t as never)).toBeUndefined();
  });
});

describe("useAssessmentYearRangeForm deactivate reference error", () => {
  const config: AssessmentYearRangeConfig = {
    type: "CV",
    endpoint: "assessment-year-range-cv",
    idField: "id",
    routePath: "/assets/configuration/master-data/assessment-year-range/capitalvalue",
    translationNamespace: "assetAssessmentYearRange.capitalValue",
  } as AssessmentYearRangeConfig;

  it("puts the deactivate error on isActive and clears it on toggle", async () => {
    const message = backend("deactivated", "Age Factors and CV Rates");
    const updateAction = vi.fn().mockResolvedValue({ success: false, statusCode: 400, message });
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config,
        id: 1,
        initialData: { id: 1, fromYear: 2020, toYear: 2025, isActive: true } as never,
        createAction: vi.fn(),
        updateAction,
      })
    );

    act(() => result.current.handleToggleStatus());
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as never);
    });

    expect(updateAction).toHaveBeenCalled();
    expect(result.current.errors.isActive).toBe(message);

    act(() => result.current.handleToggleStatus());
    expect(result.current.errors.isActive).toBeUndefined();
  });

  it("does not set isActive error for a delete message", async () => {
    const updateAction = vi.fn().mockResolvedValue({ success: false, statusCode: 400, message: backend("deleted", "CV Rates") });
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config,
        id: 1,
        initialData: { id: 1, fromYear: 2020, toYear: 2025, isActive: true } as never,
        createAction: vi.fn(),
        updateAction,
      })
    );
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as never);
    });
    expect(result.current.errors.isActive).toBeUndefined();
  });
});
