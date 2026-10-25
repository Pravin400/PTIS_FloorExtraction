import { Layers, Cpu, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RuleSimulatorStatsProps {
  totalRulesLoaded: number;
  totalSubRulesEvaluated: number;
  matchedCount: number;
  stoppedEarly: boolean;
  t: (key: string) => string;
}

export default function RuleSimulatorStats({
  totalRulesLoaded,
  totalSubRulesEvaluated,
  matchedCount,
  stoppedEarly,
  t,
}: RuleSimulatorStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Total Workflows */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-255 shadow-sm flex flex-col items-center justify-between transition hover:shadow-md">
        <div className="bg-slate-200 p-1.5 rounded-lg border border-slate-350 mb-2">
          <Layers className="w-4 h-4 text-slate-800" />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{t('simulation.totalRulesLoaded') || 'Total Rules Loaded'}</span>
        <span className="text-xl font-black text-slate-900 mt-1">{totalRulesLoaded}</span>
      </div>

      {/* Sub-rules Evaluated */}
      <div className="bg-gradient-to-br from-indigo-50/40 to-indigo-50/10 p-4 rounded-xl border border-indigo-200/80 shadow-sm flex flex-col items-center justify-between transition hover:shadow-md">
        <div className="bg-indigo-100/60 p-1.5 rounded-lg border border-indigo-200/50 mb-2">
          <Cpu className="w-4 h-4 text-indigo-700" />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{t('simulation.totalSubRulesEvaluated') || 'Sub-Rules Evaluated'}</span>
        <span className="text-xl font-black text-indigo-950 mt-1">{totalSubRulesEvaluated}</span>
      </div>

      {/* Matched Rules */}
      <div className="bg-gradient-to-br from-emerald-50/40 to-emerald-50/10 p-4 rounded-xl border border-emerald-200/80 shadow-sm flex flex-col items-center justify-between transition hover:shadow-md">
        <div className="bg-emerald-100/60 p-1.5 rounded-lg border border-emerald-255 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{t('simulation.matchedCount') || 'Matched Rules'}</span>
        <span className="text-xl font-black text-emerald-700 mt-1">{matchedCount}</span>
      </div>

      {/* Stopped Early */}
      <div className="bg-gradient-to-br from-amber-50/40 to-amber-50/10 p-4 rounded-xl border border-amber-200/80 shadow-sm flex flex-col items-center justify-between transition hover:shadow-md">
        <div className={`p-1.5 rounded-lg mb-2 border ${
          stoppedEarly 
            ? 'bg-amber-100 border-amber-200' 
            : 'bg-slate-200 border-slate-300'
        }`}>
          <AlertTriangle className={`w-4 h-4 ${stoppedEarly ? 'text-amber-700' : 'text-slate-600'}`} />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{t('simulation.stoppedEarly') || 'Stopped Early'}</span>
        <span className={`text-xs font-black mt-1.5 px-3 py-1 rounded-full border shadow-sm ${
          stoppedEarly 
            ? 'bg-amber-100 text-amber-900 border-amber-300' 
            : 'bg-slate-100 text-slate-800 border-slate-300'
        }`}>
          {stoppedEarly ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  );
}
