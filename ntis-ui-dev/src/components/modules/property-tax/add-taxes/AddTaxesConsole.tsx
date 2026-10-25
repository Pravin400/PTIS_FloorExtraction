/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { InitOperationsResponse, ScopeOptionItem } from '@/types/addTaxes.types';
import { Tabs } from '@/components/common/Tabs';
import { cn } from '@/lib/utils/cn';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAddTaxesState } from '@/hooks/add-taxes/useAddTaxesState';
import { useActiveJobMonitor } from '@/hooks/add-taxes/useActiveJobMonitor';
import { useAddTaxesExports } from '@/hooks/add-taxes/useAddTaxesExports';
import { useMasterDataChangeActions } from '@/hooks/add-taxes/useMasterDataChangeActions';
import { ScopeSelectionPanel } from './ManualSelectionTab/ScopeSelectionPanel';
import { ValidateEligibilityPanel } from './ManualSelectionTab/ValidateEligibilityPanel';
import { ExecutionProgressPanel } from './ManualSelectionTab/ExecutionProgressPanel';
import { AuditMonitorTab } from './auditMonitorTab/AuditMonitorTab';
import { GuidelinesModal } from './GuidelinesModal';
import { UserManualModal } from './UserManualModal';
import ExcelImportTab from './excelImportTab/ExcelImportTab';
import { AddTaxesStatsRow } from './AddTaxesStatsRow';
import { MasterDataChangeBanner } from './MasterDataChangeBanner';
import { DEFAULT_SCOPE_OPTIONS } from './addTaxesConsole.constants';

export { AddTaxesActions } from './AddTaxesHeaderActions';

import type { WardItem } from '@/types/wardMaster.types';
import type { ImportTemplateResponse } from '@/types/addTaxes.types';

export interface AddTaxesActionsProps {
  initOperationsAction: (financeYearId?: string | number) => Promise<any>;
}

interface AddTaxesConsoleProps {
  initData: InitOperationsResponse | null;
  scopeOptions?: ScopeOptionItem[];
  actions: AddTaxesActionsProps;
  // Server-prefetched (page.tsx) — Zone/Property Type/Assessment Status/Wards/Import Template don't
  // depend on any other selection, so they are prefetched via SSR to avoid client-side lazy fetch delay.
  initialZones?: { value: string; label: string }[];
  initialPropertyTypes?: { value: string; label: string }[];
  initialAssessmentStatuses?: { value: string; label: string }[];
  initialWards?: WardItem[];
  initialImportTemplate?: ImportTemplateResponse | null;
}

export default function AddTaxesConsole({
  initData,
  scopeOptions = [],
  actions: actionsProp,
  initialZones = [],
  initialPropertyTypes = [],
  initialAssessmentStatuses = [],
  initialWards = [],
  initialImportTemplate = null,
}: AddTaxesConsoleProps) {
  const rawScopeOptions = (scopeOptions && scopeOptions.length > 0) ? scopeOptions : DEFAULT_SCOPE_OPTIONS;
  const effectiveScopeOptions = rawScopeOptions.map(s => {
    if (s.scopeType === 'range') {
      const opts = s.options || [];
      const hasPt = opts.some(o => o.toLowerCase().includes('property type'));
      const hasAs = opts.some(o => o.toLowerCase().includes('assessment status'));
      if (!hasPt || !hasAs) {
        return {
          ...s,
          options: ['Ward', 'Property Type', 'Assessment Status', 'From Property', 'To Property']
        };
      }
    }
    return s;
  });

  const {
    t,
    selectedScope,
    selectedAction,
    setSelectedAction,
    selectionData,
    handleSelectionChange,
    financeYearId,
    handleFinanceYearChange,
    handleScopeChange,
    stats,
    financeYearOptions,
    scopes,
    actions: eligibilityActions,
    isInitialized,
    isFinanceYearActive,
    refreshStats,
    clearSelectionData,
  } = useAddTaxesState(initData, effectiveScopeOptions, actionsProp);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    activeJob,
    setActiveJob,
    runningJobsCount,
    showProgress,
    auditRefreshKey,
    triggerAuditRefresh,
  } = useActiveJobMonitor({ financeYearId, refreshStats });

  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'manual');

  const handleTabChange = (val: string | number) => {
    const nextTab = String(val);
    setCurrentTab(nextTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', nextTab);

    const selectionParamsToClear = [
      'zoneid', 'wardid', 'propertyid', 'propertyno', 'PropertyTypeId',
      'propertyTypeId', 'propertytypeid', 'TypeOfUseGroupId', 'PropertyTypeCode',
      'propertyTypeCode', 'typeOfUseGroupCode', 'assessmentStatusIds',
      'fromPropertyId', 'fromPropertyNo', 'toPropertyId', 'toPropertyNo',
      'searchText', 'SearchText', 'wardno'
    ];

    if (nextTab !== 'manual') {
      for (const key of selectionParamsToClear) {
        params.delete(key);
      }
      clearSelectionData(true);
    }

    if (nextTab !== 'excel') {
      params.delete('excelPage');
      params.delete('excelPageSize');
    }
    if (nextTab !== 'manual') {
      params.delete('previewPage');
      params.delete('previewPageSize');
    }
    // Ensure `scope` is removed when switching tabs
    params.delete('scope');

    window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (!isFinanceYearActive && currentTab !== 'audit') {
      const timer = setTimeout(() => {
        handleTabChange('audit');
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinanceYearActive, currentTab]);

  const { exportingStatus, handleExportProperties } = useAddTaxesExports({ financeYearId, pathname, t });

  const [isManualScopeBusy, setIsManualScopeBusy] = useState(false);

  const {
    isExportingMasterDataCsv,
    isProceedingMasterData,
    masterDataRecalcHandlerRef,
    handleProceedMasterDataExecution,
    handleExportMasterDataCsv,
    masterDataChangeSummary,
  } = useMasterDataChangeActions({ financeYearId, pathname, t });

  const mappedFinanceYearOptions = financeYearOptions.map(opt => ({
    value: String(opt.value),
    label: opt.label
  }));

  // Shared by both Manual Selection and Excel Import's onStartExecution — identical in both places
  // before this split, deduped here rather than copy-pasted twice.
  const handleJobStarted = (jobId: string, total: number, scheduledTime?: string) => {
    setActiveJob({ jobId, total, scheduledTime });
    refreshStats();
    triggerAuditRefresh();
    setTimeout(() => {
      refreshStats();
      triggerAuditRefresh();
    }, 1000);
    clearSelectionData();
  };

  return (
    <div className={cn("relative w-full", !isFinanceYearActive && "min-h-[450px]")}>
      <div className="flex flex-col gap-4">
        {/* Stats Row */}
        <AddTaxesStatsRow
          t={t}
          mappedFinanceYearOptions={mappedFinanceYearOptions}
          financeYearId={financeYearId}
          handleFinanceYearChange={handleFinanceYearChange}
          stats={stats}
          handleExportProperties={handleExportProperties}
          exportingStatus={exportingStatus}
          isFinanceYearActive={isFinanceYearActive}
          runningJobsCount={runningJobsCount}
          activeJob={activeJob}
          showProgress={showProgress}
        />

        {/* Master Data Change Alert Banner */}
        <MasterDataChangeBanner
          summary={masterDataChangeSummary}
          t={t}
          isProceedingMasterData={isProceedingMasterData}
          isManualScopeBusy={isManualScopeBusy}
          onProceed={handleProceedMasterDataExecution}
          isExportingMasterDataCsv={isExportingMasterDataCsv}
          onExport={handleExportMasterDataCsv}
        />

        {/* Processing Job */}
        {isFinanceYearActive && activeJob && showProgress && (
          <ExecutionProgressPanel
            jobId={activeJob.jobId}
            totalRecords={activeJob.total}
            onComplete={() => {
              toast.success(
                t('messages.executionCompleted', { jobId: activeJob.jobId }),
                { id: `job-complete-${activeJob.jobId}` }
              );
              refreshStats();
              triggerAuditRefresh();
              setTimeout(() => {
                refreshStats();
                triggerAuditRefresh();
              }, 1000);
            }}
          />
        )}

        {/* Main Tabs */}
        <Tabs value={currentTab} onChange={handleTabChange} className="w-full">
          <Tabs.TabList scrollable={false}>
            {isFinanceYearActive && (
              <>
                <Tabs.Tab value="manual">{t('tabs.manualSelection')}</Tabs.Tab>
                <Tabs.Tab value="excel">{t('tabs.excelImport')}</Tabs.Tab>
              </>
            )}
            <Tabs.Tab value="audit">{t('tabs.auditMonitor')}</Tabs.Tab>
          </Tabs.TabList>

          {isFinanceYearActive && (
            <Tabs.TabPanel value="manual">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Scope Selection */}
                <ScopeSelectionPanel
                  onProceedDisabledChange={setIsManualScopeBusy}
                  scopes={scopes}
                  selectedScope={selectedScope}
                  handleScopeChange={handleScopeChange}
                  selectionData={selectionData}
                  handleSelectionChange={handleSelectionChange}
                  scopeOptions={effectiveScopeOptions}
                  onBindMasterDataRecalc={(fn: (scope?: string) => void) => { masterDataRecalcHandlerRef.current = fn; }}
                  onStartExecution={handleJobStarted}
                  isInitialized={isInitialized}
                  financeYear={financeYearOptions.find(opt => String(opt.value) === String(financeYearId))?.label}
                  financeYearId={financeYearId}
                  initialZones={initialZones}
                  initialPropertyTypes={initialPropertyTypes}
                  initialAssessmentStatuses={initialAssessmentStatuses}
                  initialWards={initialWards}
                />

                {/* Right Panel - Validate Eligibility */}
                <ValidateEligibilityPanel
                  actions={eligibilityActions}
                  selectedAction={selectedAction}
                  setSelectedAction={setSelectedAction}
                />
              </div>
            </Tabs.TabPanel>
          )}

          {isFinanceYearActive && (
            <Tabs.TabPanel value="excel">
              <ExcelImportTab
                onStartExecution={handleJobStarted}
                financeYearId={financeYearId}
                scopeOptions={scopeOptions}
                financeYear={financeYearOptions.find(opt => String(opt.value) === String(financeYearId))?.label}
                initialWards={initialWards}
                initialImportTemplate={initialImportTemplate}
              />
            </Tabs.TabPanel>
          )}

          <Tabs.TabPanel value="audit">
            <AuditMonitorTab financeYearId={financeYearId} refreshKey={auditRefreshKey} />
          </Tabs.TabPanel>
        </Tabs>
      </div>

      <GuidelinesModal />
      <UserManualModal />
    </div>
  );
}
