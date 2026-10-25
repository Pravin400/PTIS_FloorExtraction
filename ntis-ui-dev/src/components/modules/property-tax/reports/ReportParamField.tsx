'use client';

import { Checkbox, Input, SearchSelect } from '@/components/common';
import { useState, useEffect, useRef } from 'react';
import { getLookupOptions } from '@/hooks/useLookupOptions';
import type { ReportParameterDefinition, LookupOption, ZoneSummary, WardSummary } from '@/types/report.types';
import type { FinancialYear } from '@/types/financialYear.types';

interface ParamFieldCopy {
  selectPreviousFirst: string;
  loading: string;
  select: string;
}

interface ReportParamFieldProps {
  param: ReportParameterDefinition;
  value: string;
  /** Current value of the param named by cascadeFromKey (parent), if any. */
  parentValue: string | undefined;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string) => void;
  error?: string;
  copy: ParamFieldCopy;
  zones?: ZoneSummary[];
  financialYears?: FinancialYear[];
  fetchWards?: (zoneId: number) => Promise<WardSummary[]>;
}

function resolveSource(param: ReportParameterDefinition): string | null {
  if (param.optionsSource && param.optionsSource.trim()) {
    return param.optionsSource.trim();
  }
  const combo = `${param.parameterKey} ${param.label}`.toLowerCase();
  if (combo.includes('financial') || combo.includes('year') || combo.includes('fy')) {
    return 'FinancialYear';
  }
  if (combo.includes('zone')) {
    return 'Zone';
  }
  if (combo.includes('ward')) {
    return 'Ward';
  }
  return null;
}

/**
 * Renders ONE report parameter generically from its metadata.
 * 'select' fetches its options dynamically from the API (Financial Year, Zone, Ward, or generic lookup);
 * 'date' supports a min-bound from its cascade parent (date ranges); plus text/number/boolean.
 */
export function ReportParamField({
  param,
  value,
  parentValue,
  onChange,
  onBlur,
  error,
  copy,
  zones,
  financialYears,
  fetchWards,
}: ReportParamFieldProps) {
  const isSelect = param.parameterType === 'select';
  const hasParent = !!param.cascadeFromKey;
  const cascadeBlocked = hasParent && !parentValue?.trim();

  const [options, setOptions] = useState<LookupOption[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const source = isSelect ? resolveSource(param) : null;
    const blocked = !source || (hasParent && !parentValue?.trim());

    if (blocked) {
      queueMicrotask(() => {
        if (mountedRef.current) {
          setOptions([]);
          setIsFetching(false);
        }
      });
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled && mountedRef.current) {
        setIsFetching(true);
      }
    });

    const normSource = (source || '').toLowerCase();

    // 1. Client-side Financial Year resolution
    if (normSource.includes('financial') || normSource.includes('year') || normSource === 'fy') {
      if (financialYears && financialYears.length > 0) {
        const normKey = param.parameterKey.toLowerCase();
        const sortedYears = [...financialYears].sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return (b.year || 0) - (a.year || 0);
        });
        const mapped = sortedYears.map((y) => {
          const yearLabel = y.yearCode || (y.year ? `${y.year}-${y.year + 1}` : y.description || `FY ${y.id}`);
          const val = normKey.endsWith('id')
            ? String(y.id)
            : (y.yearCode || (y.year ? `${y.year}-${y.year + 1}` : String(y.id)));
          return { value: val, label: yearLabel };
        });
        queueMicrotask(() => {
          if (!cancelled && mountedRef.current) {
            setOptions(mapped);
            setIsFetching(false);
          }
        });
        return () => { cancelled = true; };
      }
    }

    // 2. Client-side Zone resolution
    if (normSource.includes('zone')) {
      if (zones && zones.length > 0) {
        const normKey = param.parameterKey.toLowerCase();
        const mapped = zones.map((z) => ({
          value: normKey.includes('no') || normKey.includes('code') ? z.zoneNo : String(z.id),
          label: z.description ? `${z.zoneNo} - ${z.description}` : (z.zoneNo || `Zone ${z.id}`),
        }));
        queueMicrotask(() => {
          if (!cancelled && mountedRef.current) {
            setOptions(mapped);
            setIsFetching(false);
          }
        });
        return () => { cancelled = true; };
      }
    }

    // 3. Client-side Ward resolution (cascaded by Zone)
    if (normSource.includes('ward')) {
      if (parentValue && fetchWards) {
        const zoneId = Number(parentValue);
        if (!isNaN(zoneId) && zoneId > 0) {
          fetchWards(zoneId)
            .then((wards) => {
              if (!cancelled && mountedRef.current) {
                const normKey = param.parameterKey.toLowerCase();
                setOptions(
                  wards.map((w) => ({
                    value: normKey.includes('no') || normKey.includes('code') ? w.wardNo : String(w.id),
                    label: (w.description && w.description !== w.wardNo) ? `${w.wardNo} - ${w.description}` : (w.wardNo || `Ward ${w.id}`),
                  }))
                );
              }
            })
            .catch(() => {
              if (!cancelled && mountedRef.current) setOptions([]);
            })
            .finally(() => {
              if (!cancelled && mountedRef.current) setIsFetching(false);
            });
          return () => { cancelled = true; };
        }
      }
    }

    // Server-side lookup fallback (integrates Financial Year, Zone, Ward APIs)
    getLookupOptions(source, parentValue?.trim() || undefined)
      .then((opts) => {
        if (!cancelled && mountedRef.current) {
          setOptions(opts);
        }
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) {
          setOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSelect, param, parentValue, hasParent, zones, financialYears, fetchWards]);

  const change = (v: string) => onChange(param.parameterKey, v);
  const blur = () => onBlur(param.parameterKey);

  switch (param.parameterType) {
    case 'select':
      return (
        <SearchSelect
          name={param.parameterKey}
          label={param.label}
          required={param.isRequired}
          placeholder={cascadeBlocked ? copy.selectPreviousFirst : isFetching ? copy.loading : copy.select}
          options={options.map((o) => ({ value: o.value, label: o.label }))}
          value={value}
          disabled={cascadeBlocked || isFetching}
          isLoading={isFetching}
          onChange={(_, v) => change(v)}
          error={error}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          name={param.parameterKey}
          label={param.label}
          required={param.isRequired}
          fullWidth
          value={value}
          disabled={cascadeBlocked}
          min={hasParent ? (parentValue || undefined) : undefined}
          onChange={(e) => change(e.target.value)}
          onBlur={blur}
          error={error}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          name={param.parameterKey}
          label={param.label}
          required={param.isRequired}
          fullWidth
          value={value}
          disabled={cascadeBlocked}
          onChange={(e) => change(e.target.value)}
          onBlur={blur}
          error={error}
        />
      );

    case 'boolean':
      return (
        <Checkbox
          name={param.parameterKey}
          checked={value === 'true'}
          onCheckedChange={(checked) => change(checked ? 'true' : 'false')}
          onBlur={blur}
          label={`${param.label}${param.isRequired ? ' *' : ''}`}
        />
      );

    default: // 'text'
      return (
        <Input
          type="text"
          name={param.parameterKey}
          label={param.label}
          required={param.isRequired}
          fullWidth
          value={value}
          disabled={cascadeBlocked}
          onChange={(e) => change(e.target.value)}
          onBlur={blur}
          error={error}
        />
      );
  }
}
