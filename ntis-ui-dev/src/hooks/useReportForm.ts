/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type {
  ReportDefinition,
  ReportParameterDefinition,
  ReportParamValues,
  ReportFormErrors,
} from '@/types/report.types';
import { useReportFormState } from './useReportFormState';
import { useReportFormSubmission } from './useReportFormSubmission';

function validate(
  reportCode: string,
  paramValues: ReportParamValues,
  parameters: ReportParameterDefinition[],
  t: ReturnType<typeof useTranslations<'report'>>,
): ReportFormErrors {
  const errors: ReportFormErrors = {};

  if (!reportCode) {
    errors.reportCode = t('validation.reportRequired');
    return errors;
  }

  for (const param of parameters) {
    if (param.isRequired && !paramValues[param.parameterKey]?.trim()) {
      errors[param.parameterKey] = t('validation.fieldRequired', { label: param.label });
    }
    // A 'date' param with a cascade parent is a range "to": must not be before the parent ("from").
    if (param.parameterType === 'date' && param.cascadeFromKey) {
      const fromValue = paramValues[param.cascadeFromKey] ?? '';
      const toValue = paramValues[param.parameterKey] ?? '';
      if (fromValue && toValue && toValue < fromValue) {
        errors[param.parameterKey] = t('validation.dateRangeInvalid');
      }
    }
  }

  return errors;
}

interface UseReportFormOptions {
  reportDefinitions: ReportDefinition[];
  onQueued?: () => void;
  /** Pre-selected report code from the category grid. */
  selectedReportCode?: string;
  fetchReportParameters?: (reportDefinitionId: number) => Promise<{ data: ReportParameterDefinition[]; error: string | null }>;
  createReportRequest?: (
    reportCode: string,
    parameters: Record<string, string>,
  ) => Promise<{ success: boolean; data?: { reportRequestId: string; status: string }; error?: string }>;
}

export function useReportForm({
  reportDefinitions,
  onQueued,
  selectedReportCode,
  fetchReportParameters,
  createReportRequest,
}: UseReportFormOptions) {
  const t = useTranslations('report');
  const state = useReportFormState();
  const {
    reportCode,
    setReportCode,
    paramValues,
    setParamValues,
    setParamValue,
    errors,
    isSubmitting,
    setErrors,
    setTouched,
    setIsSubmitting,
    setSubmittedOnce,
    resetForm,
    showError,
  } = state;

  const [parameters, setParameters] = useState<ReportParameterDefinition[]>([]);
  const [parametersLoading, setParametersLoading] = useState(false);
  const [parametersError, setParametersError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Sync selectedReportCode from parent (category grid click) into the form state
  useEffect(() => {
    if (selectedReportCode && selectedReportCode !== reportCode) {
      setReportCode(selectedReportCode);
      setErrors({});
      setParamValues({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReportCode]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectedDefinition = reportDefinitions.find((d) => d.reportCode === reportCode);

  // Load parameter metadata when the selected report changes. Option lists for 'select' params are
  // fetched per-field by ReportParamField via the generic lookup endpoint — no hardcoded lookups here.
  useEffect(() => {
    if (!selectedDefinition) {
      setParameters([]);
      setParamValues({});
      return;
    }
    let cancelled = false;
    setParametersLoading(true);
    setParametersError(null);
    if (!fetchReportParameters) {
      setParametersLoading(false);
      return;
    }
    fetchReportParameters(selectedDefinition.id)
      .then(({ data, error }) => {
        if (!cancelled && mountedRef.current) {
          setParameters(data);
          setParametersError(error);
          setParamValues({});
          setParametersLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) {
          setParameters([]);
          setParametersError(t('errors.loadFailed'));
          setParametersLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDefinition?.id, fetchReportParameters]);

  const { submitReport } = useReportFormSubmission({
    reportCode,
    paramValues,
    selectedDefinition,
    setIsSubmitting,
    queuedMessage: t('status.queued'),
    errorMessage: t('errors.generationFailed'),
    onQueued,
    createReportRequest,
  });

  const handleReportChange = useCallback(
    (value: string) => {
      setReportCode(value);
      setErrors({});
      setParamValues({});
    },
    [setReportCode, setErrors, setParamValues],
  );

  const handleParamChange = useCallback(
    (key: string, value: string) => {
      setParamValue(key, value, parameters);
    },
    [setParamValue, parameters],
  );

  const handleBlur = useCallback(
    (field: string) => {
      setTouched(field);
    },
    [setTouched],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setSubmittedOnce(true);
      const errs = validate(reportCode, paramValues, parameters, t);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      await submitReport();
    },
    [reportCode, paramValues, parameters, t, isSubmitting, setSubmittedOnce, setErrors, submitReport],
  );

  const handleReset = useCallback(() => {
    resetForm();
    setParameters([]);
  }, [resetForm]);

  return {
    reportCode,
    paramValues,
    parameters,
    parametersLoading,
    parametersError,
    errors,
    isSubmitting,
    showError,
    handleReportChange,
    handleParamChange,
    handleBlur,
    handleSubmit,
    handleReset,
    selectedDefinition,
    t,
  };
}
