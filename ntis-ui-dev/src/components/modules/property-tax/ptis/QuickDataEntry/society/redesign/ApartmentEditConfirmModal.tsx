/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import {
  CheckCircle2,
  RotateCw,
  GitCompare,
  ArrowRight,
  Layers,
  ArrowLeft,
  Sparkles,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import type { ApartmentQcWingDto } from '@/types/property-tax/apartment';
import type { SectionWingScope } from './types';

export interface FieldDiffItem {
  fieldKey: string;
  label: string;
  oldValue: string;
  newValue: string;
}

interface ApartmentEditConfirmViewProps {
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  diffs: FieldDiffItem[];
  availableWings?: ApartmentQcWingDto[];
  managerWingScope?: SectionWingScope;
  secretaryWingScope?: SectionWingScope;
}

export const ApartmentEditConfirmModal: React.FC<ApartmentEditConfirmViewProps> = ({
  onBack,
  onConfirm,
  isSubmitting = false,
  diffs,
  availableWings = [],
  managerWingScope = { applyToAll: true, selectedWingIds: [] },
  secretaryWingScope = { applyToAll: true, selectedWingIds: [] },
}) => {
  const allWingIds = availableWings
    .map((w) => w.wingDetailId)
    .filter((id): id is number => typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647);

  const mgrIds = managerWingScope.applyToAll
    ? allWingIds
    : managerWingScope.selectedWingIds.filter((id) => typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647);

  const secIds = secretaryWingScope.applyToAll
    ? allWingIds
    : secretaryWingScope.selectedWingIds.filter((id) => typeof id === 'number' && !isNaN(id) && id > 0 && id !== 2147483647);

  const unionSet = new Set<number>([...mgrIds, ...secIds]);
  const finalTargetIds = Array.from(unionSet);

  const handleFinalSubmit = () => {
    onConfirm();
  };

  const getWingNameList = (selectedIds: number[]) => {
    return availableWings
      .filter((w) => typeof w.wingDetailId === 'number' && selectedIds.includes(w.wingDetailId))
      .map((w, idx) => w.wingName || w.wingNo || `Wing ${idx + 1}`);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans animate-in fade-in duration-200">
      {/* REVIEW TOP NAVIGATION BAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs sticky top-0 z-20 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg border border-blue-200/80 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Edit Form</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reviewing Changes</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
            {diffs.length} field{diffs.length !== 1 ? 's' : ''} modified
          </span>
        </div>
      </div>

      {/* REVIEW CONTENT BODY */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Banner Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200/80 p-3.5 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-blue-950">
              Review & Confirm Society Details
            </h4>
            <p className="text-[11px] text-blue-800/80 mt-0.5">
              Please review the modified fields and the specific wings selected for each section before confirming.
            </p>
          </div>
        </div>

        {/* 1. DIFF SUMMARY SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Summary of Changed Fields ({diffs.length})
              </span>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {diffs.length} field{diffs.length > 1 ? 's' : ''} updated
            </span>
          </div>

          {diffs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No specific fields were modified. All current values will be saved.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 w-[32%]">Field Name</th>
                    <th className="py-2.5 px-4 w-[30%]">Current / Previous Value</th>
                    <th className="py-2.5 px-4 w-[38%]">New Updated Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diffs.map((diff) => (
                    <tr key={diff.fieldKey} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span>{diff.label}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-medium truncate max-w-[200px]">
                        {diff.oldValue && diff.oldValue !== diff.newValue ? diff.oldValue : (diff.oldValue || '—')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/90 truncate max-w-[280px]" title={diff.newValue}>
                            {diff.newValue || '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. SECTION WING TARGET SUMMARY BREAKDOWN */}
        {availableWings.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Wing Scope Configuration by Section
                </span>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                {finalTargetIds.length} Total Unique Wing{finalTargetIds.length !== 1 ? 's' : ''} Targeted
              </span>
            </div>

            <div className="p-3.5 space-y-2.5">
              {/* Scope Card 1: Manager Info */}
              <div className="flex items-start justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-indigo-100 text-indigo-700">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">2. Manager Information</span>
                    <span className="text-[11px] text-slate-500">
                      {managerWingScope.applyToAll
                        ? `Applied to all ${availableWings.length} wings`
                        : `Applied to ${managerWingScope.selectedWingIds.length} selective wings (${getWingNameList(managerWingScope.selectedWingIds).join(', ') || 'None'})`}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                  managerWingScope.applyToAll
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {managerWingScope.applyToAll ? 'All Wings' : `${managerWingScope.selectedWingIds.length} Wings`}
                </span>
              </div>

              {/* Scope Card 3: Secretary Info */}
              <div className="flex items-start justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">3. Secretary Information</span>
                    <span className="text-[11px] text-slate-500">
                      {secretaryWingScope.applyToAll
                        ? `Applied to all ${availableWings.length} wings`
                        : `Applied to ${secretaryWingScope.selectedWingIds.length} selective wings (${getWingNameList(secretaryWingScope.selectedWingIds).join(', ') || 'None'})`}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                  secretaryWingScope.applyToAll
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {secretaryWingScope.applyToAll ? 'All Wings' : `${secretaryWingScope.selectedWingIds.length} Wings`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* REVIEW FOOTER ACTION BAR */}
      <div className="sticky bottom-0 z-20 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-lg shrink-0">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Edit</span>
        </button>

        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
          <span>{isSubmitting ? 'Saving Changes...' : 'Confirm & Apply Changes'}</span>
        </button>
      </div>
    </div>
  );
};
