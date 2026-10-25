'use client';
import { Send } from 'lucide-react';
import { Badge, ValidationMessage } from '@/components/common';

import type {
  ReportDefinition,
  ReportParameterDefinition,
  ReportParamsPanelCopy,
  ZoneSummary,
  WardSummary,
  PropertySummary,
  CreateReportRequest,
} from '@/types/report.types';
import type { FinancialYear } from '@/types/financialYear.types';
import { SmartLayoutFields } from './SmartLayoutFields';
import { ReportPanelActionBar } from './ReportPanelActionBar';
import { ReportPanelDrawerSection } from './ReportPanelDrawerSection';
import { useReportPanelOrchestrator } from '@/hooks/reports/useReportPanelOrchestrator';

interface ReportParametersPanelProps {
  report: ReportDefinition | null;
  onQueued?: (reportRequestId: string) => void;
  copy: ReportParamsPanelCopy;
  zones?: ZoneSummary[];
  financialYears?: FinancialYear[];
  fetchWards?: (zoneId: number) => Promise<WardSummary[]>;
  fetchProperties?: (wardId: number) => Promise<PropertySummary[]>;
  fetchReportParameters?: (
    reportDefinitionId: number
  ) => Promise<{ data: ReportParameterDefinition[]; error: string | null }>;
  createReportRequest?: CreateReportRequest;
}

export function ReportParametersPanel(props: ReportParametersPanelProps) {
  const {
    report, copy,
    loadingParameters, parametersError, paramValues, fieldErrors,
    isPending, submitStatus, errorMsg,
    handleParamChange, handleSubmit, handleResetAll,
    selectionMode, financialYear, zoneId, wardId, fromProperty, toProperty,
    propertyNo, partitionNo, amountOperator, amountValue, propertyDescription, assessmentStatus,
    isNotice119, noticeDateKey, objectionLastDateKey,
    isPropertyDrawerOpen, selectedProperties, propSearchQuery, hasViewedProperties,
    setSelectionMode, setFinancialYear, setZoneId, setWardId, setFromProperty, setToProperty,
    setPropertyNo, setPartitionNo, setAmountOperator, setAmountValue, setPropertyDescription, setAssessmentStatus,
    setIsPropertyDrawerOpen, setSelectedProperties, setPropSearchQuery, setHasViewedProperties,
    paginatedProperties, hasMoreProperties, isFetchingProperties, isLoadingMoreProperties,
    loadMoreProperties, onPropertySearchChange,
    fyOptions, zoneOptions, wards, wardOptions, wardLoading,
    properties, propLoading, propertyTypeMap, propertyDescriptionOptions, assessmentStatusOptions,
    handleGenerateFromDrawer, extraParams, paramFieldCopy,
    zones, financialYears, fetchWards,
  } = useReportPanelOrchestrator(props);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-3">
        <Badge variant="secondary" size="lg" icon={Send} className="h-auto py-2.5 px-4 font-medium text-gray-500 rounded-2xl">
          {copy.emptyState}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full gap-4 p-4 sm:p-5">
      {/* ── Loading state (inline inside panel) ── */}
      {loadingParameters && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-12 justify-center">
          <svg className="w-5 h-5 animate-spin text-[#800000]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <Badge variant="secondary" className="font-medium">{copy.loading || 'Loading parameters...'}</Badge>
        </div>
      )}

      {/* ── Error state ── */}
      {parametersError && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="font-semibold">Failed to load parameters</p>
          <p className="mt-1">{parametersError}</p>
        </div>
      )}

      {!loadingParameters && !parametersError && (
        <SmartLayoutFields
          state={{
            selectionMode, financialYear, zoneId, wardId, fromProperty, toProperty,
            propertyNo, partitionNo, amountOperator, amountValue, propertyDescription, assessmentStatus,
          }}
          actions={{
            setSelectionMode, setFinancialYear, setZoneId, setWardId, setFromProperty, setToProperty,
            setPropertyNo, setPartitionNo, setAmountOperator, setAmountValue, setPropertyDescription, setAssessmentStatus,
          }}
          options={{ fyOptions, zoneOptions, wardOptions, propertyDescriptionOptions, assessmentStatusOptions }}
          errors={fieldErrors}
          extraParams={extraParams}
          paramValues={paramValues}
          handleParamChange={handleParamChange}
          paramFieldCopy={paramFieldCopy}
          zones={zones}
          financialYears={financialYears}
          fetchWards={fetchWards}
          paginatedProperties={paginatedProperties}
          hasMoreProperties={hasMoreProperties}
          loadMoreProperties={loadMoreProperties}
          isLoadingMoreProperties={isLoadingMoreProperties}
          isFetchingProperties={isFetchingProperties}
          onPropertySearchChange={onPropertySearchChange}
          selectedProperties={selectedProperties}
          setIsPropertyDrawerOpen={setIsPropertyDrawerOpen}
          wardLoading={wardLoading}
          isNotice119={isNotice119}
          noticeDateKey={noticeDateKey}
          objectionLastDateKey={objectionLastDateKey}
        />
      )}

      {/* ── Status messages ── */}
      <ValidationMessage message={errorMsg} visible={submitStatus === 'error'} />

      {!loadingParameters && !parametersError && (
        <ReportPanelActionBar
          isPending={isPending}
          loadingParameters={loadingParameters}
          selectionMode={selectionMode}
          fromProperty={fromProperty}
          toProperty={toProperty}
          hasViewedProperties={hasViewedProperties}
          copy={copy}
          handleResetAll={handleResetAll}
          handleSubmit={handleSubmit}
          setIsPropertyDrawerOpen={setIsPropertyDrawerOpen}
          setHasViewedProperties={setHasViewedProperties}
        />
      )}

      {/* ── Property Selection Drawer ── */}
      <ReportPanelDrawerSection
        zones={zones}
        wards={wards}
        wardId={wardId}
        zoneId={zoneId}
        selectionMode={selectionMode}
        isPropertyDrawerOpen={isPropertyDrawerOpen}
        setIsPropertyDrawerOpen={setIsPropertyDrawerOpen}
        properties={properties}
        propLoading={propLoading}
        fromProperty={fromProperty}
        toProperty={toProperty}
        selectedProperties={selectedProperties}
        setSelectedProperties={setSelectedProperties}
        propertyTypeMap={propertyTypeMap}
        isPending={isPending}
        onGenerate={handleGenerateFromDrawer}
        propSearchQuery={propSearchQuery}
        setPropSearchQuery={setPropSearchQuery}
      />
    </div>
  );
}
