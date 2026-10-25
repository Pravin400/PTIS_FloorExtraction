import { Check } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { SingleAssessmentResult } from "@/types/extended-area-assessment.types";
import { buildStageSteps } from "./stageTimelineSteps";

interface StageTimelineProps {
  t: ReturnType<typeof useTranslations>;
  result: SingleAssessmentResult;
}

/** The 6-step stage timeline (Old GP -> 20% -> 40% -> 60% -> 80% -> 100%) shown above the
 *  schedule table. Prefers the API-driven `result.stages`; falls back to a hardcoded guess
 *  (derived from `result.currentPct`) only when no property has been searched yet. */
export function StageTimeline({ t, result }: StageTimelineProps) {
  const steps = buildStageSteps(t, result);
  const currentIndex = steps.findIndex((s) => s.isCurrent);

  return (
    <div className="relative">
      <div className="absolute inset-x-3 top-6 hidden h-0.5 bg-slate-200 sm:block" aria-hidden="true" />
      <div className="relative grid grid-cols-3 gap-2 sm:grid-cols-6">
        {steps.map((step, i) => {
          const isCurrent = step.isCurrent;
          const isCompleted = step.isCompleted || (currentIndex >= 0 && i < currentIndex);
          return (
            <div
              key={step.code || i}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition ${
                isCurrent
                  ? "border-cyan-500 bg-cyan-50 shadow-md ring-2 ring-cyan-100"
                  : isCompleted
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold ${
                  isCurrent ? "bg-cyan-600 text-white" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <b className={`block text-sm ${isCurrent ? "text-cyan-700" : isCompleted ? "text-emerald-700" : "text-slate-600"}`}>
                {step.displayName}
              </b>
              <span className="text-[10px] text-slate-500">{step.subtitle}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
