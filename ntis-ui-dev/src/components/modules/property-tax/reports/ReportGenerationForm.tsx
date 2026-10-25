'use client';

import { Select } from '@/components/common/select';
import { Button, Card, Badge } from '@/components/common';
import { useReportForm } from '@/hooks/useReportForm';
import { ReportParamField } from './ReportParamField';
import type { ReportGenerationFormProps } from '@/types/report.types';
import type { Option } from '@/components/common/select';
import { ArrowLeft } from 'lucide-react';

export function ReportGenerationForm({
  copy,
  reportDefinitions,
  onQueued,
  selectedReportCode,
  onBack,
  fetchReportParameters,
  createReportRequest,
}: ReportGenerationFormProps) {
  const {
    reportCode,
    paramValues,
    parameters,
    parametersLoading,
    parametersError,
    isSubmitting,
    showError,
    handleReportChange,
    handleParamChange,
    handleBlur,
    handleSubmit,
    handleReset,
    selectedDefinition,
  } = useReportForm({
    reportDefinitions,
    onQueued,
    selectedReportCode,
    fetchReportParameters,
    createReportRequest,
  });

  const reportOptions: Option[] = reportDefinitions.map((d) => ({
    value: d.reportCode,
    label: d.reportName.replace(/\s*\/\s*/g, ' ').trim(),
  }));

  return (
    <Card className="rounded-xl shadow-sm">
      {/* Form panel */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        {/* Report Type */}
        <Select
          name="reportCode"
          label={copy.fields.reportType}
          required
          placeholder={copy.placeholders.selectReport}
          options={reportOptions}
          value={reportCode}
          onChange={(_, v) => handleReportChange(v)}
          onBlur={() => handleBlur('reportCode')}
          error={showError('reportCode')}
        />

        {/* Dynamic parameter fields */}
        {parametersLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <Badge variant="secondary" className="bg-transparent border-none text-gray-500 hover:bg-transparent px-0">
              {copy.generationForm.loadingParameters}
            </Badge>
          </div>
        )}

        {!parametersLoading && reportCode && parametersError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
            <p className="font-medium">{copy.generationForm.failedToLoadParameters}</p>
            <code className="block font-mono text-xs break-all">{parametersError}</code>
          </div>
        )}

        {!parametersLoading && reportCode && !parametersError && parameters.length === 0 && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            {copy.generationForm.noParametersDefined.replace('{report}', selectedDefinition?.reportName ?? reportCode)}
          </p>
        )}

        {!parametersLoading &&
          parameters.map((param) => (
            <ReportParamField
              key={param.parameterKey}
              param={param}
              value={paramValues[param.parameterKey] ?? ''}
              parentValue={param.cascadeFromKey ? (paramValues[param.cascadeFromKey] ?? '') : undefined}
              onChange={handleParamChange}
              onBlur={handleBlur}
              error={showError(param.parameterKey)}
              copy={copy.paramField}
            />
          ))}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 mt-2">
          {onBack && (
            <Button
              type="button"
              variant="secondary"
              icon={ArrowLeft}
              onClick={onBack}
              disabled={isSubmitting}
            >
              {copy.generationForm.back}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            {copy.buttons.reset}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {copy.buttons.generate}
          </Button>
        </div>
      </form>
    </Card>
  );
}
