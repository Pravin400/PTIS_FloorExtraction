import { describe, it, expect, vi } from 'vitest';
import { buildStageSteps } from '@/components/modules/property-tax/extended-area-assessment/stageTimelineSteps';
import type { SingleAssessmentResult, TimelineStageStep } from '@/types/extended-area-assessment.types';

const t = ((key: string) => key) as unknown as Parameters<typeof buildStageSteps>[0];

function buildResult(overrides: Partial<SingleAssessmentResult> = {}): SingleAssessmentResult {
  return {
    rows: [],
    currentFy: '2026-27',
    currentPct: 0,
    stageLabel: '',
    applicableGeneralTax: 0,
    totalDemand: 0,
    ruleLabel: '',
    sumApplicable: 0,
    sumTotalDemand: 0,
    ...overrides,
  };
}

describe('buildStageSteps', () => {
  it('returns result.stages verbatim when the API provided them', () => {
    const apiStages: TimelineStageStep[] = [
      { code: 'SECTION_129_60', displayName: '60%', subtitle: 'Fifth year', percentage: 60, isCurrent: true, isCompleted: false },
    ];
    const steps = buildStageSteps(t, buildResult({ stages: apiStages }));
    expect(steps).toBe(apiStages);
  });

  it('falls back to the hardcoded 6-step schedule when stages is missing', () => {
    const steps = buildStageSteps(t, buildResult({ stages: undefined }));
    expect(steps).toHaveLength(6);
    expect(steps.map((s) => s.code)).toEqual(['OLD_GP', '20', '40', '60', '80', '100']);
  });

  it('falls back when stages is an empty array', () => {
    const steps = buildStageSteps(t, buildResult({ stages: [] }));
    expect(steps).toHaveLength(6);
  });

  it('marks the fallback step matching currentPct as current, and only that one', () => {
    const steps = buildStageSteps(t, buildResult({ currentPct: 40 }));
    const current = steps.filter((s) => s.isCurrent);
    expect(current).toHaveLength(1);
    expect(current[0].code).toBe('40');
  });

  it('marks every fallback stage below currentPct as completed', () => {
    const steps = buildStageSteps(t, buildResult({ currentPct: 60 }));
    const byCode = Object.fromEntries(steps.map((s) => [s.code, s]));
    expect(byCode['20'].isCompleted).toBe(true);
    expect(byCode['40'].isCompleted).toBe(true);
    expect(byCode['60'].isCompleted).toBe(false); // current, not completed
    expect(byCode['80'].isCompleted).toBe(false);
  });

  it('marks the Old GP step current when currentPct is 0', () => {
    const steps = buildStageSteps(t, buildResult({ currentPct: 0 }));
    expect(steps[0].isCurrent).toBe(true);
  });

  it('the 100% step is never marked completed by the fallback (it repeats forever once reached)', () => {
    const steps = buildStageSteps(t, buildResult({ currentPct: 100 }));
    const hundred = steps.find((s) => s.code === '100');
    expect(hundred?.isCurrent).toBe(true);
    expect(hundred?.isCompleted).toBe(false);
  });

  it('calls the translator for every fallback label/subtitle it needs', () => {
    const spy = vi.fn((key: string) => key);
    buildStageSteps(spy as unknown as Parameters<typeof buildStageSteps>[0], buildResult());
    expect(spy).toHaveBeenCalledWith('timeline.oldGp');
    expect(spy).toHaveBeenCalledWith('timeline.thereafter');
  });
});
