/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import type { FinancialYear } from '@/types/financialYear.types';
import type {
  ZoneSummary,
  WardSummary,
  PropertySummary,
  CreateReportRequest,
  ReportDefinition,
  ReportJobType,
  ReportParameterDefinition,
  ReportParamsPanelCopy,
} from '@/types/report.types';
import { getReportParametersAction, getDesignerReportStatusAction } from '@/app/[locale]/property-tax/reports/actions';

interface UseReportParametersOptions {
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

export function useReportParameters({
  report,
  onQueued,
  copy, 
  fetchReportParameters,
  createReportRequest,
}: UseReportParametersOptions) {
  const [parameters, setParameters] = useState<ReportParameterDefinition[]>([]);
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [parametersError, setParametersError] = useState<string | null>(null);

  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isPending, startTransition] = useTransition();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setSubmitStatus('idle');
    setErrorMsg('');

    if (!report?.id) {
      setParameters([]);
      setParamValues({});
      setFieldErrors({});
      setParametersError(null);
      return;
    }

    let isCancelled = false;
    setLoadingParameters(true);
    setParametersError(null);
    setFieldErrors({});

    const fetchFn = fetchReportParameters || getReportParametersAction;

    fetchFn(report.id)
      .then((res) => {
        if (isCancelled) return;
        if (res.error) {
          setParametersError(res.error);
          setParameters([]);
          setParamValues({});
        } else {
          setParameters(res.data || []);
          const initialValues: Record<string, string> = {};
          for (const p of res.data || []) {
            initialValues[p.parameterKey] = '';
          }
          setParamValues(initialValues);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setParametersError(err instanceof Error ? err.message : 'Failed to load report parameters');
        setParameters([]);
        setParamValues({});
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingParameters(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [report?.id, fetchReportParameters]);

  const handleParamChange = (key: string, val: string) => {
    setParamValues((prev) => {
      const next = { ...prev, [key]: val };
      const resetChildren = (parentKey: string) => {
        for (const p of parameters) {
          if (p.cascadeFromKey === parentKey) {
            next[p.parameterKey] = '';
            resetChildren(p.parameterKey);
          }
        }
      };
      resetChildren(key);
      return next;
    });

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleReset = () => {
    const initialValues: Record<string, string> = {};
    for (const p of parameters) {
      initialValues[p.parameterKey] = '';
    }
    setParamValues(initialValues);
    setSubmitStatus('idle');
    setErrorMsg('');
    setFieldErrors({});
  };

  const handleSubmit = (overrideParams?: Record<string, string>, jobType?: ReportJobType) => {
    if (!report) return;

    setSubmitStatus('idle');
    setErrorMsg('');

    const currentParams = overrideParams || paramValues;

    const nextFieldErrors: Record<string, string> = {};
    for (const p of parameters) {
      if (p.isRequired && !currentParams[p.parameterKey]?.trim()) {
        nextFieldErrors[p.parameterKey] = copy.validation?.fillAllRequired || `${p.label} is required`;
      }
      if (p.parameterType === 'date' && p.cascadeFromKey) {
        const fromVal = currentParams[p.cascadeFromKey] ?? '';
        const toVal = currentParams[p.parameterKey] ?? '';
        if (fromVal && toVal && toVal < fromVal) {
          nextFieldErrors[p.parameterKey] = 'End date cannot be earlier than start date';
        }
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitStatus('error');
      setErrorMsg(copy.validation?.fillAllRequired || 'Please fill in all required fields');
      return;
    }

    startTransition(async () => {
      try {
        if (!createReportRequest) {
          throw new Error('createReportRequest server action is not provided');
        }

        const result = await createReportRequest(report.reportCode, currentParams, jobType);

        if (!result.success || !result.data || !result.data.reportRequestId) {
          setSubmitStatus('error');
          setErrorMsg(result.error || copy.validation?.failedToQueue || 'Failed to queue report');
          return;
        }

        const reqId = result.data.reportRequestId;

        let attempts = 0;
        const maxAttempts = 15;
        let downloaded = false;

        while (attempts < maxAttempts) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            const statusData = await getDesignerReportStatusAction(reqId);
            {

              const canDownload = statusData.status === 'Completed'
                || (statusData.status === 'PartiallyCompleted' && Number(statusData.processedRecords) > 0);
              if (canDownload) {
                const downloadUrl = `/api/designer-report-download/${encodeURIComponent(reqId)}`;
                const dlRes = await fetch(downloadUrl);
                if (dlRes.ok) {
                  const blob = await dlRes.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;

                  const disposition = dlRes.headers.get('Content-Disposition');
                  let filename = `report_${report.reportCode}.pdf`;
                  if (disposition && disposition.includes('filename=')) {
                    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) filename = match[1].replace(/['"]/g, '');
                  }

                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);

                  setSubmitStatus('success');
                  toast.success(`${report.reportName} generated and downloaded successfully!`);
                  downloaded = true;
                  break;
                }
              } else if (statusData.status === 'Failed' || statusData.status === 'Cancelled') {
                setSubmitStatus('error');
                setErrorMsg('Generation failed on server');
                return;
              }
            }
          } catch (_e) {
            // ignore network errors during polling
          }
        }

        if (!downloaded) {
          setSubmitStatus('success');
          toast.success(copy.reportQueued?.replace('{name}', report.reportName) || 'Report queued successfully');
          onQueued?.(reqId);
        }
      } catch {
        setSubmitStatus('error');
        setErrorMsg(copy.validation?.networkError || 'Network error');
      }
    });
  };

  return {
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
    handleSubmit,
    setSubmitStatus,
    setErrorMsg,
    setFieldErrors,
  };
}
