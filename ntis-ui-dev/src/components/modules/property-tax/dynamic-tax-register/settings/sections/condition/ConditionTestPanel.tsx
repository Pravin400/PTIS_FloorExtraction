'use client';

import { useTranslations } from 'next-intl';
import { Drawer, Select, SearchSelect, Label, SaveButton, CancelButton } from '@/components/common';
import type { DynamicTaxCondition } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxCondition';

export interface ConditionTestPanelProps {
  condition: DynamicTaxCondition;
}

function formatTraceValue(value: string | number | boolean | (string | number | boolean)[] | null): string {
  if (value === null || value === undefined) return '—';
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/**
 * "Test this Rule" side panel — evaluates the tax's already-SAVED condition rows against a real
 * property, chosen through a dependent Zone → Ward → Property → Partition cascade (the partition
 * resolves to the PropertyId). Finance Year is optional; PropertyDetailsId is left to the backend.
 */
export function ConditionTestPanel({ condition }: ConditionTestPanelProps) {
  const t = useTranslations('dynamicTaxRegister');
  const {
    open,
    handleClose,
    zoneId,
    wardId,
    propertyNo,
    partitionKey,
    financeYear,
    setFinanceYear,
    zoneOptions,
    wardOptions,
    propertyOptions,
    partitionOptions,
    financeYearOptions,
    wardsLoading,
    propertiesLoading,
    onZoneChange,
    onWardChange,
    onPropertyChange,
    onPartitionChange,
    testBusy,
    testResult,
    handleRunTest,
    rows,
    taxOptions,
    fields,
  } = condition;

  const toStr = (opts: { value: number; label: string }[]) =>
    opts.map((o) => ({ label: o.label, value: String(o.value) }));

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={<span className="text-base font-bold text-slate-800">{t('condition.testPanel.title')}</span>}
      width="md"
      footer={
        <>
          <CancelButton label={t('condition.testPanel.close')} onClick={handleClose} />
          <SaveButton label={t('condition.testPanel.runTest')} onClick={handleRunTest} disabled={testBusy} />
        </>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <p className="text-xs text-slate-500">{t('condition.testPanel.cascadeHint')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">{t('condition.testPanel.zone')}</Label>
            <Select
              options={[{ label: t('condition.testPanel.selectZone'), value: '' }, ...toStr(zoneOptions)]}
              value={zoneId}
              onChange={(_, v) => onZoneChange(v)}
              selectSize="sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">{t('condition.testPanel.ward')}</Label>
            <Select
              options={[{ label: t('condition.testPanel.selectWard'), value: '' }, ...toStr(wardOptions)]}
              value={wardId}
              onChange={(_, v) => onWardChange(v)}
              disabled={!zoneId || wardsLoading}
              selectSize="sm"
            />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">{t('condition.testPanel.property')}</Label>
            <SearchSelect
              options={propertyOptions}
              value={propertyNo}
              onChange={(_, v) => onPropertyChange(v)}
              placeholder={t('condition.testPanel.selectProperty')}
              disabled={!wardId || propertiesLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">{t('condition.testPanel.partition')}</Label>
            <Select
              options={[{ label: t('condition.testPanel.selectPartition'), value: '' }, ...partitionOptions]}
              value={partitionKey}
              onChange={(_, v) => onPartitionChange(v)}
              disabled={!propertyNo}
              selectSize="sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">{t('condition.testPanel.financeYear')}</Label>
            <Select
              options={[{ label: t('condition.testPanel.optional'), value: '' }, ...toStr(financeYearOptions)]}
              value={financeYear}
              onChange={(_, v) => setFinanceYear(v)}
              selectSize="sm"
            />
          </div>
        </div>

        {testResult && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
            {testResult.matched ? (
              <div className="flex flex-col gap-2.5">
                {testResult.matchedResults.map((m) => {
                  const row = rows.find((r) => r.id === m.ruleId);
                  const referenceTaxLabel =
                    row?.referenceTaxId != null
                      ? taxOptions.find((o) => o.value === row.referenceTaxId)?.label
                      : undefined;
                  const unitFieldLabel =
                    row?.unitFieldId != null
                      ? fields.find((f) => f.fieldId === row.unitFieldId)?.fieldName ?? row.unitFieldId
                      : undefined;
                  // The row DID match, so a bare ₹0 would read as a confident answer — say why.
                  const unitCountUnresolved = m.resultMode === 'PER_UNIT' && m.unitCountResolved === false;
                  const referenceTaxAmountUnresolved = m.resultBase === 'OTHER_TAX' && m.referenceTaxAmountResolved === false;
                  return (
                    <div
                      key={`${m.ruleId}-${m.sortOrder}`}
                      className="flex flex-col gap-1 pb-2.5 border-b border-slate-200 last:border-b-0 last:pb-0"
                    >
                      <p className="text-xs font-bold text-emerald-700">
                        {t('condition.testPanel.matchedRow', { sortOrder: m.sortOrder })}
                        {m.stoppedFurtherProcessing && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 align-middle">
                            {t('condition.testPanel.stoppedHere')}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {m.resultMode === 'PER_UNIT'
                          ? `${m.resultMode} / ${unitFieldLabel ?? t('condition.multiplyBy')}`
                          : m.resultBase === 'OTHER_TAX'
                          ? `${m.resultMode} / ${referenceTaxLabel ?? t('condition.resultBaseOtherTax')}`
                          : `${m.resultMode} / ${m.resultBase}`}
                        {m.referenceTaxAmountUsed != null &&
                          ` (${t('condition.testPanel.computedAmount', { amount: m.referenceTaxAmountUsed })})`}
                        {m.unitCountUsed != null &&
                          ` (${t('condition.testPanel.unitCountUsed', { count: m.unitCountUsed })})`}
                        {' — '}
                        <span className="font-semibold text-slate-800">
                          {t('condition.testPanel.computedAmount', { amount: m.computedAmount })}
                        </span>
                      </p>
                      {unitCountUnresolved && (
                        <p className="text-[11px] font-medium text-amber-700">
                          {t('condition.testPanel.unitCountUnresolved', { field: unitFieldLabel ?? '' })}
                        </p>
                      )}
                      {referenceTaxAmountUnresolved && (
                        <p className="text-[11px] font-medium text-amber-700">
                          {t('condition.testPanel.referenceTaxAmountUnresolved', { tax: referenceTaxLabel ?? '' })}
                        </p>
                      )}
                    </div>
                  );
                })}
                {testResult.matchedResults.length > 1 && (
                  <p className="text-xs font-bold text-slate-800">
                    {t('condition.testPanel.totalComputedAmount', { amount: testResult.computedAmount })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs font-bold text-amber-700">{t('condition.testPanel.noRowMatched')}</p>
            )}
            {testResult.trace.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('condition.testPanel.rowTrace')}</span>
               {testResult.trace.map((tr) => (
                  <div key={`${tr.ruleId}-${tr.sortOrder}`} className="flex flex-col gap-1 border-l-2 border-slate-200 pl-2.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tr.isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {tr.isMatch
                          ? t('condition.testPanel.traceMatch')
                          : tr.skipped
                          ? t('condition.testPanel.traceSkipped')
                          : t('condition.testPanel.traceNoMatch')}
                      </span>
                      <span className="text-slate-600">#{tr.sortOrder}</span>
                      {tr.skipped && tr.skipReason && <span className="text-slate-400">{tr.skipReason}</span>}
                    </div>
                    {tr.conditions.length === 0 && !tr.skipped && (
                      <span className="text-[11px] text-slate-400 italic">
                        {t('condition.alwaysMatches')}
                      </span>
                    )}
                    {tr.conditions.map((c, i) => (
                      <div key={`${tr.ruleId}-${i}-${c.fieldId}`} className="flex items-center gap-1.5 text-[11px] pl-1">
                        {i > 0 && (
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase shrink-0">
                            {c.logicalOperator}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                            c.isMatch ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {c.isMatch ? '✓' : '✕'}
                        </span>
                        <span className="text-slate-700 font-medium">{c.fieldId}</span>
                        <span className="text-slate-400">{c.operator}</span>
                        <span className="text-slate-600">{formatTraceValue(c.expectedValue)}</span>
                        <span className="text-slate-400">
                          {t('condition.testPanel.actualValue', { value: formatTraceValue(c.actualValue) })}
                        </span>
                        {!c.fieldResolved && (
                          <span className="text-amber-600">{t('condition.testPanel.fieldUnresolved')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
