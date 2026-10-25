/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { PtisPanelType, PtisRedesignCopy } from '@/types/property-tax/apartment';
import { RotateCcw, Eye } from 'lucide-react';

interface PtisBottomToolbarProps {
  hiddenPanels: PtisPanelType[];
  onTogglePanel: (panel: PtisPanelType) => void;
  onRestoreAll: () => void;
  copy: PtisRedesignCopy;
}

export const PtisBottomToolbar: React.FC<PtisBottomToolbarProps> = ({
  hiddenPanels,
  onTogglePanel,
  onRestoreAll,
  copy,
}) => {
  const panelLabels: Record<PtisPanelType, string> = {
    survey: copy.newSurveyTitle || 'New Survey',
    difference: copy.differenceEngineTitle || 'Difference Engine',
    existing: copy.existingAssessmentTitle || 'Existing Assessment',
  };

  return (
    <div className="fixed bottom-3 right-6 z-40 flex items-center gap-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-zinc-200/80 text-xs font-sans">
      <div className="flex items-center gap-2">
        <span className="font-bold text-zinc-500 uppercase text-[11px]">
          {copy.hiddenPanelsLabel || 'HIDDEN PANELS:'}
        </span>

        {hiddenPanels.length === 0 ? (
          <span className="text-zinc-400 italic text-[11px]">None</span>
        ) : (
          hiddenPanels.map((panel) => (
            <button
              key={panel}
              type="button"
              onClick={() => onTogglePanel(panel)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-semibold text-[11px] transition-colors"
            >
              <Eye className="w-3 h-3" />
              {panelLabels[panel]}
            </button>
          ))
        )}
      </div>

      <div className="h-4 w-px bg-zinc-200" />

      <button
        type="button"
        onClick={onRestoreAll}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 font-semibold text-[11px] shadow-xs transition-all active:scale-95"
      >
        <RotateCcw className="w-3 h-3" />
        {copy.restoreAllTables || 'Restore All Tables'}
      </button>
    </div>
  );
};
