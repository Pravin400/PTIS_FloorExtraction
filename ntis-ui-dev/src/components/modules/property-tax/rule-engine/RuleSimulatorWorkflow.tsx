import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, CornerDownRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DryRunWorkflow, DryRunSubRule, DryRunEffect } from '@/types/rule-engine';

interface RuleSimulatorWorkflowProps {
  workflow: DryRunWorkflow;
  showMatchedOnly: boolean;
  formatDryRunEffect: (effect: DryRunEffect | null | undefined) => string;
  t: ReturnType<typeof useTranslations>;
}

export default function RuleSimulatorWorkflow({
  workflow,
  showMatchedOnly,
  formatDryRunEffect,
  t,
}: RuleSimulatorWorkflowProps) {


  const displayedSubRules = React.useMemo(() => {
    return showMatchedOnly
      ? (workflow.subRules || []).filter((sr: DryRunSubRule) => sr.isMatch)
      : (workflow.subRules || []);
  }, [workflow.subRules, showMatchedOnly]);

  if (showMatchedOnly && displayedSubRules.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50/40 hover:bg-slate-50/80 border border-slate-250 rounded-2xl shadow-sm overflow-hidden text-left transition duration-200">
      {/* Workflow header */}
      <div className="bg-slate-100 border-b border-slate-255 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-indigo-950 font-mono bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg">
            {workflow.workflowName}
          </span>
          {workflow.priority !== undefined && (
            <span className="text-[11px] font-extrabold text-slate-500">
              {t('simulation.priorityText', { priority: workflow.priority })}
            </span>
          )}
        </div>
        {workflow.entityStopOnMatch && (
          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
            {t('simulation.stopOnMatch')}
          </span>
        )}
      </div>

      {/* Sub rules inside Workflow */}
      <div className="divide-y divide-slate-200">
        {displayedSubRules.map((sr: DryRunSubRule, idx: number) => {
          const isMatched = sr.isMatch;
          const isSkipped = sr.wasSkipped;

          return (
            <div 
              key={`${sr.ruleCode}_${sr.arrayIndex ?? idx}`} 
              className={`p-5 flex flex-col gap-3 transition-colors ${
                isMatched 
                  ? 'bg-emerald-50/20 hover:bg-emerald-50/30' 
                  : isSkipped 
                    ? 'bg-amber-50/10 hover:bg-amber-50/15' 
                    : 'hover:bg-slate-100/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 w-full max-w-[80%]">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    {sr.arrayIndex !== undefined && (
                      <span className="text-slate-500 font-mono font-bold">#{sr.arrayIndex + 1}</span>
                    )}
                    {sr.ruleName || sr.ruleCode}
                  </span>
                  
                  {/* Code expression block */}
                  <div className="relative group/expr w-fit mt-1.5">
                    <span className="block font-mono text-[10.5px] font-black text-slate-800 bg-slate-100 border border-slate-250 px-2.5 py-1 rounded-md overflow-x-auto max-w-full">
                      {sr.expression}
                    </span>
                  </div>
                </div>

                {/* Badge matching status */}
                <div className="shrink-0 pt-0.5">
                  {isSkipped ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      {t('simulation.skipped')}
                    </span>
                  ) : isMatched ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-950 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                      {t('simulation.matched')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-rose-950 bg-rose-50 border border-rose-300 px-3 py-1 rounded-full shadow-sm">
                      <XCircle className="w-3.5 h-3.5 text-rose-700" />
                      {t('simulation.notMatched')}
                    </span>
                  )}
                </div>
              </div>

              {/* Skip / Status description text */}
              {isSkipped && sr.skipReason && (
                <div className="text-[11.5px] font-semibold text-amber-900 bg-amber-50/50 p-2.5 rounded-xl border border-amber-255">
                  <strong className="font-extrabold">{t('simulation.skipReason') || 'Skip Reason'}:</strong> {sr.skipReason}
                </div>
              )}

              {!isSkipped && !isMatched && sr.matchStatus && !sr.matchStatus.includes('false') && (
                <div className="text-[11.5px] font-semibold text-rose-900 bg-rose-50/65 p-2.5 rounded-xl border border-rose-255">
                  <strong className="font-extrabold">{t('simulation.status') || 'Status'}:</strong> {sr.matchStatus}
                </div>
              )}

              {/* Output Action Block */}
              {isMatched && ((sr.effects && sr.effects.length > 0) || sr.effect) && (
                <div className="flex flex-col gap-2.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80 mt-1 shadow-sm">
                  <div className="flex items-start gap-2 text-xs font-black text-emerald-950">
                    <CornerDownRight className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-2 w-full font-sans">
                      <span className="text-slate-600 font-bold">{t('simulation.outcomeAction')}:</span>
                      <div className="flex flex-col gap-2 pl-2 border-l border-emerald-200">
                        {(sr.effects && sr.effects.length > 0 ? sr.effects : (sr.effect ? [sr.effect] : [])).map((eff, effIdx, effArr) => {
                          const hasStepComputed = eff.computedValue !== undefined && eff.computedValue !== null;
                          return (
                            <div key={`${sr.ruleCode ?? 'sr'}-${sr.arrayIndex ?? idx}-eff-${effIdx}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-1.5">
                                {effArr.length > 1 && (
                                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/85 px-1 rounded select-none">
                                    #{effIdx + 1}
                                  </span>
                                )}
                                <code className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded font-mono font-black border border-emerald-300 text-xs">
                                  {formatDryRunEffect(eff)}
                                </code>
                              </div>
                              {hasStepComputed && (
                                <div className="text-[11px] text-slate-500 font-semibold self-end sm:self-auto">
                                  {t('simulation.stepRate') || 'Step Rate'}: <span className="font-bold text-slate-800 font-mono">{typeof eff.computedValue === 'number' ? eff.computedValue.toFixed(2) : eff.computedValue}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Base Rate & Computed Value Display */}
                  {(sr.baseRate !== undefined || sr.computedValue !== undefined) && (
                    <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-emerald-200/40">
                      {sr.baseRate !== undefined && (
                        <div className="flex flex-col bg-white/60 p-2.5 rounded-lg border border-emerald-100/80">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{t('simulation.baseRate')}</span>
                          <span className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                            {typeof sr.baseRate === 'number' ? sr.baseRate.toFixed(2) : sr.baseRate}
                          </span>
                        </div>
                      )}
                      {sr.computedValue !== undefined && (
                        <div className="flex flex-col bg-emerald-100/40 p-2.5 rounded-lg border border-emerald-200/60">
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">{t('simulation.computedValue')}</span>
                          <span className="text-sm font-black text-emerald-950 mt-0.5 font-mono">
                            {typeof sr.computedValue === 'number' ? sr.computedValue.toFixed(2) : sr.computedValue}
                          </span>
                        </div>
                      )}
                    </div>
                  )}


                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
