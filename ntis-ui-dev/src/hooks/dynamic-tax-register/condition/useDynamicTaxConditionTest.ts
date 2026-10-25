'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  EvaluateConditionRuleResult,
  TestCascadeOption,
  TestPropertyRow,
} from '@/types/dynamic-tax-register.types';
import {
  evaluateConditionRuleAction,
  fetchTestZonesAction,
  fetchTestWardsAction,
  fetchTestPropertiesAction,
  fetchTestFinanceYearsAction,
} from '@/app/[locale]/property-tax/dynamic-tax-register/action';

export interface DynamicTaxConditionTestParams {
  numericId: number;
  rowsCount: number;
  dirty: boolean;
}

interface Option {
  label: string;
  value: string;
}

/**
 * "Test this Rule" panel state — evaluates this tax's already-SAVED condition rows against one
 * real property. The property is chosen through a dependent Zone → Ward → Property → Partition
 * cascade (instead of a raw PropertyId): a "partition" here is a Property-level row, so the chosen
 * partition IS the resolved PropertyId. PropertyDetailsId is left to the backend (it auto-selects
 * the property's first detail). Deliberately disabled while there are unsaved edits — a meaningful
 * PERCENT-effect preview needs real RV/ALV data, which only exists for the persisted configuration.
 */
export function useDynamicTaxConditionTest({ numericId, rowsCount, dirty }: DynamicTaxConditionTestParams) {
  const t = useTranslations('dynamicTaxRegister');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EvaluateConditionRuleResult | null>(null);

  // Cascade selections (all string-valued for the Select/SearchSelect controls).
  const [zoneId, setZoneId] = useState('');
  const [wardId, setWardId] = useState('');
  const [propertyNo, setPropertyNo] = useState('');
  // The chosen partition's value IS a PropertyId (stringified) — the cascade's final output.
  const [partitionKey, setPartitionKey] = useState('');
  const [financeYear, setFinanceYear] = useState('');

  // Option sources fetched from the backend as the cascade progresses.
  const [zoneOptions, setZoneOptions] = useState<TestCascadeOption[]>([]);
  const [wardOptions, setWardOptions] = useState<TestCascadeOption[]>([]);
  const [propertyRows, setPropertyRows] = useState<TestPropertyRow[]>([]);
  const [financeYearOptions, setFinanceYearOptions] = useState<TestCascadeOption[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  // Guard against stale cascade responses overwriting a newer selection.
  const wardReqRef = useRef(0);
  const propReqRef = useRef(0);

  const disabledReason =
    rowsCount === 0
      ? t('condition.testPanel.noRowsToTest')
      : dirty
      ? t('condition.testPanel.saveFirst')
      : null;

  // Load the top-level lists (zones + finance years) whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [zones, years] = await Promise.all([fetchTestZonesAction(), fetchTestFinanceYearsAction()]);
      if (cancelled) return;
      setZoneOptions(zones);
      setFinanceYearOptions(years);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const resetCascadeBelowZone = () => {
    setWardId('');
    setPropertyNo('');
    setPartitionKey('');
    setWardOptions([]);
    setPropertyRows([]);
  };

  const onZoneChange = (value: string) => {
    setZoneId(value);
    resetCascadeBelowZone();
    const zid = Number(value);
    if (!value || !Number.isFinite(zid)) return;
    const reqId = ++wardReqRef.current;
    setWardsLoading(true);
    fetchTestWardsAction(zid).then((opts) => {
      if (wardReqRef.current !== reqId) return;
      setWardOptions(opts);
      setWardsLoading(false);
    });
  };

  const onWardChange = (value: string) => {
    setWardId(value);
    setPropertyNo('');
    setPartitionKey('');
    setPropertyRows([]);
    const wid = Number(value);
    if (!value || !Number.isFinite(wid)) return;
    const reqId = ++propReqRef.current;
    setPropertiesLoading(true);
    fetchTestPropertiesAction(wid).then((rows) => {
      if (propReqRef.current !== reqId) return;
      setPropertyRows(rows);
      setPropertiesLoading(false);
    });
  };

  // Distinct property numbers for the ward (the Property dropdown).
  const propertyOptions = useMemo<Option[]>(() => {
    const seen = new Set<string>();
    const opts: Option[] = [];
    for (const row of propertyRows) {
      if (row.propertyNo && !seen.has(row.propertyNo)) {
        seen.add(row.propertyNo);
        opts.push({ label: row.propertyNo, value: row.propertyNo });
      }
    }
    return opts;
  }, [propertyRows]);

  // Partitions of the selected property — each maps to a distinct PropertyId (the option value).
  const partitionOptions = useMemo<Option[]>(
    () =>
      propertyRows
        .filter((row) => row.propertyNo === propertyNo)
        .map((row) => ({ label: row.partitionNo || t('condition.testPanel.noPartition'), value: String(row.propertyId) })),
    [propertyRows, propertyNo, t]
  );

  const onPropertyChange = (value: string) => {
    setPropertyNo(value);
    // Auto-select the partition when the property has exactly one — no point making the user pick.
    const matches = propertyRows.filter((row) => row.propertyNo === value);
    setPartitionKey(matches.length === 1 ? String(matches[0].propertyId) : '');
  };

  const resolvedPropertyId = partitionKey ? Number(partitionKey) : 0;

  const handleOpen = () => {
    setResult(null);
    setZoneId('');
    resetCascadeBelowZone();
    setFinanceYear('');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleRunTest = async () => {
    if (!resolvedPropertyId || resolvedPropertyId <= 0) {
      toast.error(t('condition.testPanel.selectProperty'));
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await evaluateConditionRuleAction({
        taxId: numericId,
        propertyId: resolvedPropertyId,
        // PropertyDetailsId intentionally omitted — the backend evaluates the property's first detail.
        financeYear: financeYear ? Number(financeYear) : undefined,
      });
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        toast.error(res.error || t('condition.testPanel.evaluateFailed'));
      }
    } catch {
      toast.error(t('condition.testPanel.evaluateFailedRetry'));
    } finally {
      setBusy(false);
    }
  };

  return {
    open,
    handleOpen,
    handleClose,
    // cascade state + options
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
    onPartitionChange: setPartitionKey,
    resolvedPropertyId,
    // run/result
    testBusy: busy,
    testResult: result,
    testDisabledReason: disabledReason,
    handleRunTest,
  };
}

export type DynamicTaxConditionTest = ReturnType<typeof useDynamicTaxConditionTest>;
