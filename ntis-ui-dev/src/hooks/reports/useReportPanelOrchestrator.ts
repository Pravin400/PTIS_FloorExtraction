'use client';
import { useEffect } from 'react';
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
import { useReportParameters } from '@/hooks/reports/useReportParameters';
import {
  buildCanonicalSmartLayoutParameters,
  buildSmartLayoutMetadataParameters,
  prepareReportSubmissionParameters,
  useSmartLayoutSync,
} from '@/hooks/reports/useSmartLayoutSync';
import { usePaginatedProperties, useGenerateFromDrawer } from '@/hooks/reports/useReportDataHooks';
import { useReportOptionLists } from '@/hooks/reports/useReportOptionLists';
import { useSmartLayoutState } from '@/hooks/reports/useSmartLayoutState';

// ─── keys that the smart layout handles (excluded from extra-params loop) ─────
const HANDLED_PREFIXES = ['financial', 'year', 'fy', 'zone', 'ward', 'property', 'fromprop', 'toprop', 'partition', 'amount', 'propertydescription', 'propertytype', 'assessment', 'assessmenttype', 'assessmentstatus', 'top', 'lessthan', 'searchcat', 'notice', 'objection', 'lastdate'];

const NOTICE_119_PROVIDER_CODE = 'notice119dataprovider';

function normalizeParameterKey(key: string) {
  return key.toLowerCase().replace(/[_\s-]/g, '');
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isHandled(key: string) {
  const lower = key.toLowerCase().replace(/[_\s]/g, '');
  return HANDLED_PREFIXES.some((p) => lower.startsWith(p) || lower.includes(p));
}

export interface ReportPanelOrchestratorProps {
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

export function useReportPanelOrchestrator({
  report,
  onQueued,
  copy,
  zones = [],
  financialYears = [],
  fetchWards,
  fetchProperties,
  fetchReportParameters,
  createReportRequest,
}: ReportPanelOrchestratorProps) {
  const {
    parameters,
    loadingParameters,
    parametersError,
    paramValues,
    fieldErrors,
    isPending,
    submitStatus,
    errorMsg,
    handleParamChange,
    handleReset,
    handleSubmit: submitReport,
    setSubmitStatus,
    setErrorMsg,
    setFieldErrors,
  } = useReportParameters({
    report,
    onQueued,
    copy,
    zones,
    financialYears,
    fetchWards,
    fetchProperties,
    fetchReportParameters,
    createReportRequest,
  });

  const { state, actions } = useSmartLayoutState(report?.id, handleReset);
  const isNotice119 = report?.dataProviderCode?.trim().toLowerCase() === NOTICE_119_PROVIDER_CODE
    || (report?.reportCode ? report.reportCode.toLowerCase().includes('119') : false)
    || (report?.reportName ? report.reportName.toLowerCase().includes('119') : false);
  const noticeDateKey = parameters.find(
    (parameter) => normalizeParameterKey(parameter.parameterKey) === 'noticedate'
  )?.parameterKey ?? 'noticeDate';
  const objectionLastDateKey = parameters.find((parameter) => {
    const key = normalizeParameterKey(parameter.parameterKey);
    return key === 'objectionlastdate' || key === 'lastdate';
  })?.parameterKey ?? 'objectionLastDate';

  const {
    selectionMode, financialYear, zoneId, wardId, fromProperty, toProperty,
    propertyNo, partitionNo, ownerIdList, isPropertyDrawerOpen, selectedProperties,
    propSearchQuery, hasViewedProperties, amountOperator, amountValue,
    propertyDescription, assessmentStatus,
  } = state;

  const {
    setSelectionMode, setFinancialYear, setZoneId, setWardId, setFromProperty, setToProperty,
    setPropertyNo, setPartitionNo, setIsPropertyDrawerOpen, setSelectedProperties,
    setPropSearchQuery, setHasViewedProperties, setAmountOperator, setAmountValue,
    setPropertyDescription, setAssessmentStatus, handleResetAll,
  } = actions;

  const handleSubmit = (overrideParams?: Record<string, string>) => {
    const smartLayoutErrors: Record<string, string> = {};
    const requiredMessage = copy.validation?.fillAllRequired || 'Please fill in all required fields';

    if (!selectionMode) smartLayoutErrors.propertySelectionMode = requiredMessage;
    if (!financialYear) {
      smartLayoutErrors.financialYear = copy.validation?.financialYearRequired || requiredMessage;
    }
    if (selectionMode && !zoneId) {
      smartLayoutErrors.zone = copy.validation?.zoneRequired || requiredMessage;
    }
    if (selectionMode && wardId.length === 0) {
      smartLayoutErrors.ward = copy.validation?.wardRequired || requiredMessage;
    }
    if (selectionMode === 'range') {
      if (!fromProperty) smartLayoutErrors.fromPropertyNo = requiredMessage;
      if (!toProperty) smartLayoutErrors.toPropertyNo = requiredMessage;
      if (fromProperty && toProperty && fromProperty.localeCompare(
        toProperty, undefined, { numeric: true, sensitivity: 'base' }
      ) > 0) {
        smartLayoutErrors.toPropertyNo = requiredMessage;
      }
    }
    if (selectionMode === 'property' && !propertyNo && selectedProperties.length === 0) {
      smartLayoutErrors.propertyNo = requiredMessage;
    }

    if (Object.keys(smartLayoutErrors).length > 0) {
      setFieldErrors((previous) => ({ ...previous, ...smartLayoutErrors }));
      setSubmitStatus('error');
      setErrorMsg(requiredMessage);
      return;
    }

    setFieldErrors({});

    const smartLayoutInput = {
      financialYear, zoneId, wardId, fromProperty, toProperty, propertyNo, partitionNo,
      ownerIdList, selectedProperties, selectionMode, amountOperator, amountValue,
      propertyDescription, assessmentStatus,
    };
    const canonicalValues = buildCanonicalSmartLayoutParameters(smartLayoutInput);
    const metadataValues = buildSmartLayoutMetadataParameters(smartLayoutInput, parameters);

    const submissionParameters = prepareReportSubmissionParameters(
      report?.reportCode ?? '',
      selectionMode,
      {
        ...paramValues,
        ...metadataValues,
        ...canonicalValues,
        ...overrideParams,
      },
    );

    if (isNotice119) {
      const today = formatDateInputValue(new Date());
      const objectionDate = new Date();
      objectionDate.setDate(objectionDate.getDate() + 30);
      const defaultObjection = formatDateInputValue(objectionDate);

      submissionParameters[noticeDateKey] = submissionParameters[noticeDateKey] || today;
      submissionParameters[objectionLastDateKey] = submissionParameters[objectionLastDateKey] || defaultObjection;
      submissionParameters['noticeDate'] = submissionParameters['noticeDate'] || today;
      submissionParameters['objectionLastDate'] = submissionParameters['objectionLastDate'] || defaultObjection;
    }

    const explicitPropertyIds = (canonicalValues.propertyId ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const jobType = selectionMode === 'property' && explicitPropertyIds.length === 1
      ? 'Single'
      : 'Bulk';

    submitReport(submissionParameters, jobType);
  };

  const {
    paginatedProperties,
    hasMoreProperties,
    isFetchingProperties,
    isLoadingMoreProperties,
    loadMoreProperties,
    onPropertySearchChange,
  } = usePaginatedProperties(wardId, selectionMode);

  const {
    fyOptions,
    zoneOptions,
    wards,
    wardOptions,
    wardLoading,
    properties,
    propLoading,
    propertyTypeMap,
    propertyDescriptionOptions,
    assessmentStatusOptions,
  } = useReportOptionLists({
    financialYears,
    zones,
    zoneId,
    wardId,
    selectionMode,
    isPropertyDrawerOpen,
    fetchWards,
    fetchProperties,
  });

  const handleGenerateFromDrawer = useGenerateFromDrawer({
    selectedProperties,
    report,
    createReportRequest,
    setIsPropertyDrawerOpen,
    paramValues,
    parameters,
    handleSubmit,
  });

  // Reset ward/property when zone changes; reset property when ward changes
  useEffect(() => {
    setWardId([]);
    setSelectedProperties([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  useEffect(() => {
    setSelectedProperties([]);
    setPropSearchQuery('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardId]);

  useEffect(() => {
    if (!isNotice119 || loadingParameters) return;

    if (!paramValues[noticeDateKey]) {
      handleParamChange(noticeDateKey, formatDateInputValue(new Date()));
    }
    if (!paramValues[objectionLastDateKey]) {
      const objectionDate = new Date();
      objectionDate.setDate(objectionDate.getDate() + 30);
      handleParamChange(objectionLastDateKey, formatDateInputValue(objectionDate));
    }
    // handleParamChange is intentionally omitted because it is recreated by the form hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotice119, loadingParameters, noticeDateKey, objectionLastDateKey, paramValues]);

  useSmartLayoutSync({
    financialYear, zoneId, wardId, fromProperty, toProperty, propertyNo, partitionNo,
    ownerIdList, selectedProperties, selectionMode, amountOperator, amountValue,
    propertyDescription, assessmentStatus, parameters, handleParamChange,
  });

  const extraParams = parameters.filter((parameter) => {
    if (isHandled(parameter.parameterKey)) return false;
    if (!isNotice119) return true;

    const key = normalizeParameterKey(parameter.parameterKey);
    return key !== 'noticedate' && key !== 'objectionlastdate' && key !== 'lastdate';
  });

  const paramFieldCopy = {
    selectPreviousFirst: copy.selectZoneFirst || 'Select previous first',
    loading: copy.loading || 'Loading...',
    select: copy.selectZone || 'Select',
  };

  return {
    report,
    copy,
    // param state
    parameters,
    loadingParameters,
    parametersError,
    paramValues,
    fieldErrors,
    isPending,
    submitStatus,
    errorMsg,
    handleParamChange,
    handleSubmit,
    // smart layout state
    selectionMode, financialYear, zoneId, wardId, fromProperty, toProperty,
    propertyNo, partitionNo, isPropertyDrawerOpen, selectedProperties,
    propSearchQuery, hasViewedProperties, amountOperator, amountValue,
    propertyDescription, assessmentStatus,
    isNotice119, noticeDateKey, objectionLastDateKey,
    // smart layout actions
    setSelectionMode, setFinancialYear, setZoneId, setWardId, setFromProperty, setToProperty,
    setPropertyNo, setPartitionNo, setIsPropertyDrawerOpen, setSelectedProperties,
    setPropSearchQuery, setHasViewedProperties, setAmountOperator, setAmountValue,
    setPropertyDescription, setAssessmentStatus, handleResetAll,
    // paginated properties
    paginatedProperties, hasMoreProperties, isFetchingProperties, isLoadingMoreProperties,
    loadMoreProperties, onPropertySearchChange,
    // option lists
    fyOptions, zoneOptions, wards, wardOptions, wardLoading, properties, propLoading,
    propertyTypeMap, propertyDescriptionOptions, assessmentStatusOptions,
    // derived
    handleGenerateFromDrawer,
    extraParams,
    paramFieldCopy,
    zones,
    financialYears,
    fetchWards,
  };
}
