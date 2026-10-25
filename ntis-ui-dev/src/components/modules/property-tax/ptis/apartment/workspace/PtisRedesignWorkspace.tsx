/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { AssessmentUnit, UnitDifference, PtisRedesignCopy, PtisTaxMode } from '@/types/property-tax/apartment';
import { cn } from '@/lib/utils/cn';
import { Minimize2, RotateCcw } from 'lucide-react';
import { PtisPanelHeader } from './PtisPanelHeader';
import { NewSurveyTable } from '../tables/NewSurveyTable';
import { DifferenceEngineTable } from '../tables/DifferenceEngineTable';
import { ExistingAssessmentTable } from '../tables/ExistingAssessmentTable';
import type { ApartmentSortPanel, ApartmentSortState } from '@/lib/utils/apartment-sort';
import { buildRowTints } from '@/lib/utils/apartment-row-tint';

export interface PtisRedesignWorkspaceProps {
  copy: PtisRedesignCopy;
  surveyUnits: AssessmentUnit[];
  differences: UnitDifference[];
  previousUnits: AssessmentUnit[];
  totalDeltas: { carpetDelta: number; buaDelta: number; rvDelta: number; cvDelta?: number; taxDelta: number; rtTaxDelta: number };
  hoveredUnitId: string | null;
  expandedUnitIds: string[];
  hiddenPanels: string[];
  expandedPanel: 'survey' | 'difference' | 'existing' | null;
  panelWidthPercent: number;
  onHoverUnit: (id: string | null) => void;
  onToggleExpandRow: (id: string) => void;
  onEditUnit: (unit: AssessmentUnit) => void;
  onViewDocument?: (guid: string, title?: string) => void;
  onViewRules?: (unit: AssessmentUnit) => void;
  onToggleHidePanel: (panel: 'survey' | 'difference' | 'existing') => void;
  onToggleExpandPanel: (panel: 'survey' | 'difference' | 'existing') => void;
  surveyScrollRef: React.RefObject<HTMLDivElement | null>;
  differenceScrollRef: React.RefObject<HTMLDivElement | null>;
  existingScrollRef: React.RefObject<HTMLDivElement | null>;
  onSyncScroll: (sourceRef: React.RefObject<HTMLDivElement | null>) => void;
  taxMode?: PtisTaxMode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onRestoreAll?: () => void;
  hiddenPanelsCount?: number;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  /** The sort the API applied to the rows (the rows arrive in that order). */
  sort?: ApartmentSortState | null;
  onSort?: (panel: ApartmentSortPanel, column: string) => void;
  onClearSort?: () => void;
}

export const PtisRedesignWorkspace: React.FC<PtisRedesignWorkspaceProps> = ({
  copy, surveyUnits, differences, previousUnits, totalDeltas, hoveredUnitId,
  expandedUnitIds, hiddenPanels, expandedPanel, panelWidthPercent,
  onHoverUnit, onToggleExpandRow, onEditUnit, onViewDocument, onViewRules, onToggleHidePanel,
  onToggleExpandPanel, surveyScrollRef, differenceScrollRef, existingScrollRef,
  onSyncScroll, taxMode, isFullscreen = false, onToggleFullscreen, onRestoreAll,
  hiddenPanelsCount = 0, isLoading = false, isLoadingMore = false, sort = null, onSort, onClearSort,
}) => {
  const isSurveyHidden = hiddenPanels.includes('survey');
  const isDifferenceHidden = hiddenPanels.includes('difference');
  const isExistingHidden = hiddenPanels.includes('existing');

  const isSurveyOnly = expandedPanel === 'survey' || (!isSurveyHidden && isDifferenceHidden && isExistingHidden);
  const isDiffOnly = expandedPanel === 'difference' || (!isDifferenceHidden && isSurveyHidden && isExistingHidden);
  const isExistingOnly = expandedPanel === 'existing' || (!isExistingHidden && isSurveyHidden && isDifferenceHidden);

  // The data of a row is coloured by the type of the unit (by its BHK when it has no type), every different one in its own colour, in all three
  // tables: New Survey, Difference Engine, and Existing Assessment. The colours depend only on the types, so a property keeps its
  // colours after a refresh, a new search and a sort.
  const rowTints = React.useMemo(() => buildRowTints(surveyUnits), [surveyUnits]);


  return (
    <div
      className={cn(
        'transition-all duration-200',
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-slate-100 p-2.5 flex flex-col h-screen w-screen overflow-hidden'
          : 'mx-3 my-2'
      )}
    >
      {isFullscreen && (
        <div className="bg-white border border-zinc-200/90 rounded-xl px-4 py-2 mb-2 flex items-center justify-between shadow-2xs shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 font-semibold hidden md:inline">
              New Survey · Difference Engine · Existing Assessment
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRestoreAll && (
              <button
                type="button"
                onClick={onRestoreAll}
                className={cn(
                  'border rounded-full px-3.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer',
                  hiddenPanelsCount > 0
                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    : 'border-blue-600 text-blue-700 bg-white hover:bg-blue-50 active:bg-blue-100'
                )}
                title="Restore all hidden / maximized comparison tables"
              >
                <RotateCcw className={cn('w-3.5 h-3.5', hiddenPanelsCount > 0 ? 'text-white' : 'text-blue-700')} />
                <span>Restore All Tables {hiddenPanelsCount > 0 ? `(${hiddenPanelsCount})` : ''}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-full px-3.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Collapse / Exit Full Screen (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Exit Full Screen</span>
              <kbd className="text-[10px] bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded text-slate-600 font-mono">Esc</kbd>
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'bg-white rounded-xl shadow-xs border border-zinc-200 overflow-hidden flex gap-0 divide-x divide-zinc-200 items-stretch',
          isFullscreen ? 'flex-1 min-h-0' : 'h-auto max-h-[calc(100vh-200px)]'
        )}
      >
        {!isSurveyHidden && (expandedPanel === null || expandedPanel === 'survey') && (
          <div
            className={cn(
              'flex-1 overflow-hidden flex flex-col min-w-0 transition-all duration-200',
              isFullscreen ? 'h-full' : ''
            )}
            style={isSurveyOnly ? { flexBasis: '100%' } : undefined}
          >
            <PtisPanelHeader
              title={copy.newSurveyTitle || 'NEW SURVEY (Current)'}
              widthPercent={isSurveyOnly ? 100 : panelWidthPercent}
              variant="survey"
              onToggleHide={() => onToggleHidePanel('survey')}
              onToggleExpand={() => onToggleExpandPanel('survey')}
              isExpanded={expandedPanel === 'survey'}
            />
            <div className={cn('overflow-hidden flex flex-col flex-1 min-h-0', isFullscreen ? 'h-full' : '')}>
              <NewSurveyTable
                rowTints={rowTints} sort={sort} onSort={onSort} onClearSort={onClearSort}
                units={surveyUnits} hoveredUnitId={hoveredUnitId} expandedUnitIds={expandedUnitIds}
                onHoverUnit={onHoverUnit} onToggleExpandRow={onToggleExpandRow} onEditUnit={onEditUnit}
                onViewDocument={onViewDocument} onViewRules={onViewRules}
                scrollRef={surveyScrollRef} onScroll={() => onSyncScroll(surveyScrollRef)} taxMode={taxMode}
                isLoading={isLoading}
                isFullscreen={isFullscreen}
              />
            </div>
          </div>
        )}

        {!isDifferenceHidden && (expandedPanel === null || expandedPanel === 'difference') && (
          <div
            className={cn(
              isDiffOnly
                ? 'flex-1 min-w-0'
                : 'flex-initial w-fit min-w-[280px] max-w-[50%]',
              'overflow-hidden flex flex-col transition-all duration-200',
              isFullscreen ? 'h-full' : ''
            )}
            style={isDiffOnly ? { flexBasis: '100%' } : undefined}
          >
            <PtisPanelHeader
              title={copy.differenceEngineTitle || 'DIFFERENCE ENGINE'}
              widthPercent={isDiffOnly ? 100 : panelWidthPercent}
              variant="difference"
              onToggleHide={() => onToggleHidePanel('difference')}
              onToggleExpand={() => onToggleExpandPanel('difference')}
              isExpanded={expandedPanel === 'difference'}
            />
            <div className={cn('overflow-hidden flex flex-col flex-1 min-h-0', isFullscreen ? 'h-full' : '')}>
              <DifferenceEngineTable
                sort={sort} onSort={onSort}
                differences={differences} totalDeltas={totalDeltas} hoveredUnitId={hoveredUnitId}
                expandedUnitIds={expandedUnitIds} onHoverUnit={onHoverUnit} onToggleExpandRow={onToggleExpandRow}
                scrollRef={differenceScrollRef} onScroll={() => onSyncScroll(differenceScrollRef)}
                taxMode={taxMode} isLoading={isLoading}
                isFullscreen={isFullscreen}
              />
            </div>
          </div>
        )}

        {!isExistingHidden && (expandedPanel === null || expandedPanel === 'existing') && (
          <div
            className={cn(
              'flex-1 overflow-hidden flex flex-col min-w-0 transition-all duration-200',
              isFullscreen ? 'h-full' : ''
            )}
            style={isExistingOnly ? { flexBasis: '100%' } : undefined}
          >
            <PtisPanelHeader
              title={copy.existingAssessmentTitle || 'EXISTING ASSESSMENT (Previous)'}
              widthPercent={isExistingOnly ? 100 : panelWidthPercent}
              variant="existing"
              onToggleHide={() => onToggleHidePanel('existing')}
              onToggleExpand={() => onToggleExpandPanel('existing')}
              isExpanded={expandedPanel === 'existing'}
            />
            <div className={cn('overflow-hidden flex flex-col flex-1 min-h-0', isFullscreen ? 'h-full' : '')}>
              <ExistingAssessmentTable
                rowTints={rowTints} sort={sort} onSort={onSort} onClearSort={onClearSort}
                units={previousUnits} hoveredUnitId={hoveredUnitId} expandedUnitIds={expandedUnitIds}
                onHoverUnit={onHoverUnit} onToggleExpandRow={onToggleExpandRow} onViewDocument={onViewDocument}
                onViewRules={onViewRules} scrollRef={existingScrollRef} onScroll={() => onSyncScroll(existingScrollRef)}
                taxMode={taxMode} isLoading={isLoading}
                isFullscreen={isFullscreen}
              />
            </div>
          </div>
        )}
      </div>
      {isLoadingMore && (
        <div className="fixed bottom-14 right-8 z-50 bg-blue-700/90 backdrop-blur-sm text-white px-3 py-1 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading more units...</span>
        </div>
      )}
    </div>
  );
};