import React from 'react';
import { Play, Plus, Terminal, Activity, XCircle, ListFilter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/ActionButton';
import { RuleItem, DryRunEffect, DryRunWorkflow } from '@/types/rule-engine';
import { useSimulatorPayload } from '@/hooks/rule-engine/useSimulatorPayload';
import RuleSimulatorStats from './RuleSimulatorStats';
import RuleSimulatorWorkflow from './RuleSimulatorWorkflow';
import RuleSimulatorInputs from './RuleSimulatorInputs';

interface RuleSimulatorConsoleProps {
  rule: RuleItem;
}

export default function RuleSimulatorConsole({ rule }: RuleSimulatorConsoleProps) {
  const t = useTranslations('ruleEngine');
  const [showMatchedOnly, setShowMatchedOnly] = React.useState(false);

  const {
    loading,
    executionResult,
    dryRunResult,
    inputs,
    arrayFieldIds,
    handleAddRow,
    handleRemoveRow,
    handleRowChange,
    handleRunSimulation,
    getFieldConfig,
  } = useSimulatorPayload(rule);

  const formatDryRunEffect = (effect: DryRunEffect | null | undefined) => {
    if (!effect) return '';
    const typeLabel = effect.effectType || 'No action';
    const val = effect.effectValue;
    const parameterCode = effect.parameterCode;
    
    const subject = parameterCode ? parameterCode.replace('input.', '').trim() : 'Rate';
    const typeLower = typeLabel.toLowerCase();

    if (typeLower.includes('override') || typeLower.includes('set') || typeLower.includes('equal')) {
      return `${typeLabel} ${subject} to ${val}`;
    } else {
      return `${typeLabel} ${subject} by ${val}%`;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Simulation Controls Card */}
      <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-100/50 transition duration-300">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-200/60">
              <Terminal className="w-5.5 h-5.5 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{t('simulation.simulator')}</h3>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                {t('simulation.simulatorHint')}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-200/60 px-2.5 py-1 rounded-full border border-slate-300/60">
            {t('simulation.interactiveConsole')}
          </span>
        </div>

        {/* Test Inputs list */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-12 gap-3 text-[11px] font-black text-slate-700 uppercase tracking-wider px-1">
            <span className="col-span-5">{t('simulation.parameterName')}</span>
            <span className="col-span-6">{t('simulation.simulationValue')}</span>
            <span className="col-span-1"></span>
          </div>

          <div className="flex flex-col gap-4 pb-4 border-b border-slate-200/80">
            <RuleSimulatorInputs
              inputs={inputs}
              arrayFieldIds={arrayFieldIds}
              getFieldConfig={getFieldConfig}
              handleRowChange={handleRowChange}
              handleRemoveRow={handleRemoveRow}
              t={t}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 text-xs font-black text-indigo-700 hover:text-indigo-800 transition duration-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200/50"
            >
              <Plus className="w-4 h-4" />
              <span>{t('simulation.addCustomParameter')}</span>
            </button>

            <Button
              variant="primary"
              onClick={handleRunSimulation}
              isLoading={loading}
              className="px-6 py-2.5 flex items-center gap-2 bg-indigo-655 hover:bg-indigo-700 border-indigo-655 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-200/40 active:scale-[0.98] transition-all"
              icon={Play}
            >
              {t('simulation.runSimulation')}
            </Button>
          </div>
        </div>
      </div>

      {/* Results panel */}
      {(executionResult || dryRunResult) && (
        <div className="bg-white p-6 border border-slate-250 rounded-2xl shadow-xl flex flex-col gap-5 text-left transition duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200/65">
                <Activity className="w-4.5 h-4.5 text-emerald-700" />
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('simulation.dryRunDetails')}</h4>
            </div>
            
            <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 border border-slate-255 px-3 py-1.5 rounded-xl transition duration-150">
              <input
                type="checkbox"
                checked={showMatchedOnly}
                onChange={(e) => setShowMatchedOnly(e.target.checked)}
                className="rounded border-slate-400 text-indigo-650 focus:ring-indigo-500 w-4 h-4 transition cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5 text-slate-700" />
                {t('simulation.showMatchedOnly') || 'Show Matched Only'}
              </span>
            </label>
          </div>
          
          {dryRunResult ? (
            <div className="flex flex-col gap-6">
              <RuleSimulatorStats
                totalRulesLoaded={dryRunResult.totalRulesLoaded || 0}
                totalSubRulesEvaluated={dryRunResult.totalSubRulesEvaluated || 0}
                matchedCount={dryRunResult.matchedCount || 0}
                stoppedEarly={!!dryRunResult.stoppedEarly}
                t={t}
              />

              <div className="flex flex-col gap-4">
                {dryRunResult.workflows?.map((wf: DryRunWorkflow, wfIdx: number) => (
                  <RuleSimulatorWorkflow
                    key={`${wf.workflowName || 'wf'}_${wfIdx}`}
                    workflow={wf}
                    showMatchedOnly={showMatchedOnly}
                    formatDryRunEffect={formatDryRunEffect}
                    t={t}
                  />
                ))}
              </div>


            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-955 rounded-xl text-xs font-black shadow-sm">
                <XCircle className="w-4.5 h-4.5 text-rose-700" />
                <span>{t('simulation.failureMessage')}</span>
              </div>
              

            </div>
          )}
        </div>
      )}
    </div>
  );
}
