'use client';

import { useState, useCallback } from 'react';
import type { ReportParameterDefinition, ReportParamValues, ReportFormErrors } from '@/types/report.types';

function clearDependents(
  changedKey: string,
  params: ReportParameterDefinition[],
  current: ReportParamValues,
): ReportParamValues {
  const next = { ...current };
  params
    .filter((p) => p.cascadeFromKey === changedKey)
    .forEach((p) => {
      next[p.parameterKey] = '';
      Object.assign(next, clearDependents(p.parameterKey, params, next));
    });
  return next;
}

export function useReportFormState() {
  const [reportCode, setReportCode] = useState('');
  const [paramValues, setParamValues] = useState<ReportParamValues>({});
  const [errors, setErrors] = useState<ReportFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const setParamValue = useCallback(
    (key: string, value: string, params: ReportParameterDefinition[]) => {
      setParamValues((prev) => clearDependents(key, params, { ...prev, [key]: value }));
    },
    [],
  );

  const touchField = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    setReportCode('');
    setParamValues({});
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmittedOnce(false);
  }, []);

  const showError = useCallback(
    (field: string): string | undefined => {
      if (submittedOnce || touched[field]) return errors[field];
      return undefined;
    },
    [submittedOnce, touched, errors],
  );

  return {
    reportCode,
    setReportCode,
    paramValues,
    setParamValues,
    errors,
    touched,
    isSubmitting,
    submittedOnce,
    setParamValue,
    setErrors,
    setTouched: touchField,
    setIsSubmitting,
    setSubmittedOnce,
    resetForm,
    showError,
  };
}
