import type { useTranslations } from "next-intl";
import type { SingleAssessmentResult, TimelineStageStep } from "@/types/extended-area-assessment.types";

/** Resolves the 6-step stage timeline: prefers the API-driven `result.stages`; falls back to a
 *  hardcoded guess (derived from `result.currentPct`) only when no property has been searched
 *  yet. Shared by the on-screen StageTimeline and the exported PDF, so both always agree. */
export function buildStageSteps(t: ReturnType<typeof useTranslations>, result: SingleAssessmentResult): TimelineStageStep[] {
  if (result.stages && result.stages.length > 0) return result.stages;

  return [
    { code: "OLD_GP", displayName: t("timeline.oldGp"), subtitle: t("timeline.oldGpSpan"), percentage: 0, isCurrent: result.currentPct === 0, isCompleted: false },
    { code: "20", displayName: "20%", subtitle: t("timeline.thirdYear"), percentage: 20, isCurrent: result.currentPct === 20, isCompleted: result.currentPct > 20 },
    { code: "40", displayName: "40%", subtitle: t("timeline.fourthYear"), percentage: 40, isCurrent: result.currentPct === 40, isCompleted: result.currentPct > 40 },
    { code: "60", displayName: "60%", subtitle: t("timeline.fifthYear"), percentage: 60, isCurrent: result.currentPct === 60, isCompleted: result.currentPct > 60 },
    { code: "80", displayName: "80%", subtitle: t("timeline.sixthYear"), percentage: 80, isCurrent: result.currentPct === 80, isCompleted: result.currentPct > 80 },
    { code: "100", displayName: "100%", subtitle: t("timeline.thereafter"), percentage: 100, isCurrent: result.currentPct === 100, isCompleted: false },
  ];
}
