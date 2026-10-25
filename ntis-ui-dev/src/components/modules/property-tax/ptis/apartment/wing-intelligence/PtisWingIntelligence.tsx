/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';

interface PtisWingIntelligenceProps {
  onSelectWing?: (wingId: string) => void;
}

export const PtisWingIntelligence: React.FC<PtisWingIntelligenceProps> = ({ onSelectWing }) => {
  return (
    <div className="p-4 bg-white rounded-xl border border-zinc-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-zinc-800">WING INTELLIGENCE</h3>
        <span className="text-xs text-zinc-500 font-medium">A+ :</span>
      </div>
      <p className="text-xs text-zinc-400 mb-4">(Click any wing to load comparison)</p>
      
      <div className="flex flex-col gap-2">
        <button 
          onClick={() => onSelectWing?.('wing-a')}
          className="px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 border rounded-lg"
        >
          A Wing
        </button>
        <button 
          onClick={() => onSelectWing?.('wing-b')}
          className="px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 border rounded-lg"
        >
          B Wing
        </button>
        <button 
          onClick={() => onSelectWing?.('wing-c')}
          className="px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 border rounded-lg"
        >
          C Wing
        </button>
        <button 
          onClick={() => onSelectWing?.('wing-d')}
          className="px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 border rounded-lg"
        >
          D Wing
        </button>
      </div>

      <button className="mt-4 w-full py-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-100">
        ADD WING
      </button>
    </div>
  );
};
