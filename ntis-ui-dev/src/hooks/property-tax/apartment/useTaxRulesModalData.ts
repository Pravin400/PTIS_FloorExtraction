/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { AssessmentUnit } from '@/types/property-tax/apartment';
import type { PropertyRuleLogItem } from '@/types/rule-engine';
import type { RuleDisplayRow } from '@/components/modules/property-tax/ptis/apartment/tax-rules/TaxRulesTable';
import type { RetroTaxRow } from '@/components/modules/property-tax/ptis/apartment/tax-rules/TaxRulesRetroTable';
import { fetchDiscountDetailsAction, fetchUnitTaxDetailsAction } from '@/app/[locale]/property-tax/ptis/apartment/action';
import type { DiscountAttributeDto } from '@/types/discount.types';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';

export interface UseTaxRulesModalDataProps {
  open: boolean;
  unit: AssessmentUnit | null;
  appliedRules?: PropertyRuleLogItem[];
}

export function useTaxRulesModalData({ open, unit, appliedRules = [] }: UseTaxRulesModalDataProps) {
  const [discounts, setDiscounts] = useState<DiscountAttributeDto[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [taxData, setTaxData] = useState<{ rateable?: TaxDetailsData; capital?: TaxDetailsData } | null>(null);
  const [loadingTaxData, setLoadingTaxData] = useState(false);

  useEffect(() => {
    if (!open || !unit) {
      setDiscounts([]);
      setTaxData(null);
      return;
    }
    const propId = Number(unit.rawSurvey?.id || unit.rawSurvey?.pdnId || unit.id);
    if (!propId || propId <= 0) return;

    let isMounted = true;
    setLoadingDiscounts(true);
    setLoadingTaxData(true);

    Promise.all([
      fetchDiscountDetailsAction(propId).catch(() => ({ success: false, data: undefined })),
      fetchUnitTaxDetailsAction(propId).catch(() => ({ success: false, rateable: undefined, capital: undefined })),
    ])
      .then(([discRes, taxRes]) => {
        if (!isMounted) return;
        if (discRes.success && discRes.data?.discountAttributes) setDiscounts(discRes.data.discountAttributes);
        if (taxRes.success) setTaxData({ rateable: taxRes.rateable, capital: taxRes.capital });
      })
      .finally(() => {
        if (isMounted) {
          setLoadingDiscounts(false);
          setLoadingTaxData(false);
        }
      });

    return () => { isMounted = false; };
  }, [open, unit]);

  const baseValue = useMemo(() => {
    if (appliedRules?.[0]?.baseValue !== undefined) return appliedRules[0].baseValue;
    return unit?.tax || unit?.rawSurvey?.newTaxTotal || 0;
  }, [appliedRules, unit]);

  const taxationRules: RuleDisplayRow[] = useMemo(() => {
    if (!appliedRules || appliedRules.length === 0) return [];
    return appliedRules.map((rule, idx) => {
      const isSurcharge = rule.effectType?.toLowerCase().includes('increase') || (rule.effectValue || 0) > 0;
      const isReduction = rule.effectType?.toLowerCase().includes('decrease') || (rule.effectValue || 0) < 0;
      const taxImpact = rule.computedValue !== undefined
        ? Math.round(rule.computedValue)
        : rule.effectValue ? Math.round(baseValue * (Math.abs(rule.effectValue) / 100)) : 0;
      const revisedTax = rule.cumulativeValue !== undefined
        ? Math.round(rule.cumulativeValue)
        : isSurcharge ? baseValue + taxImpact : isReduction ? Math.max(0, baseValue - taxImpact) : baseValue;

      return {
        id: `rule-${rule.id || idx}`,
        ruleCode: rule.ruleCode || `R0${idx + 1}`,
        name: rule.ruleName || `Rule ${idx + 1}`,
        level: rule.ruleScopeName || rule.ruleCategory || 'Unit',
        description: rule.ruleName || 'Applied tax rule',
        useGroup: rule.typeOfUseName || 'All',
        beforeRate: rule.applyRate ? `${rule.applyRate}%` : '15.0%',
        change: isSurcharge ? `+${Math.abs(rule.effectValue)}%` : isReduction ? `-${Math.abs(rule.effectValue)}%` : '—',
        revisedRate: rule.applyRate && rule.effectValue ? `${(rule.applyRate + rule.effectValue).toFixed(1)}%` : '—',
        beforeTax: rule.baseValue ?? baseValue,
        taxImpact: isSurcharge ? taxImpact : isReduction ? -taxImpact : 0,
        revisedTax,
        isApplied: true,
      };
    });
  }, [appliedRules, baseValue]);

  const totalSurcharge = useMemo(() => {
    if (!appliedRules?.length) return 0;
    return appliedRules
      .filter((r) => r.effectType?.toLowerCase().includes('increase') || (r.effectValue || 0) > 0)
      .reduce((acc, r) => acc + (r.computedValue ?? Math.round(baseValue * ((r.effectValue || 0) / 100))), 0);
  }, [appliedRules, baseValue]);

  const totalReduction = useMemo(() => {
    if (!appliedRules?.length) return 0;
    return Math.abs(
      appliedRules
        .filter((r) => r.effectType?.toLowerCase().includes('decrease') || (r.effectValue || 0) < 0)
        .reduce((acc, r) => acc + (r.computedValue ?? Math.round(baseValue * (Math.abs(r.effectValue || 0) / 100))), 0)
    );
  }, [appliedRules, baseValue]);

  const cumulativeFinalTax = useMemo(() => {
    if (appliedRules?.length) {
      const last = appliedRules[appliedRules.length - 1];
      if (last.cumulativeValue != null) return Math.round(last.cumulativeValue);
    }
    return baseValue + totalSurcharge - totalReduction;
  }, [appliedRules, baseValue, totalSurcharge, totalReduction]);

  const netImpact = useMemo(() => cumulativeFinalTax - baseValue, [cumulativeFinalTax, baseValue]);

  const appliedDiscounts = useMemo(() => {
    return discounts.filter((d) => d.bitValue === true || d.isDiscountApplicable || !!d.propertySocialDetailId);
  }, [discounts]);

  const discountPercentageBenefit = useMemo(() => {
    return appliedDiscounts
      .filter((d) => (d.decimalValue || 0) > 0)
      .reduce((acc, d) => acc + Math.round(baseValue * ((d.decimalValue || 0) / 100)), 0);
  }, [appliedDiscounts, baseValue]);

  const discountFixedBenefit = useMemo(() => {
    return appliedDiscounts
      .filter((d) => (d.intValue || 0) > 0)
      .reduce((acc, d) => acc + (d.intValue || 0), 0);
  }, [appliedDiscounts]);

  const discountTotalBenefit = useMemo(() => discountPercentageBenefit + discountFixedBenefit, [discountPercentageBenefit, discountFixedBenefit]);
  const discountFinalTax = useMemo(() => Math.max(0, baseValue - discountTotalBenefit), [baseValue, discountTotalBenefit]);

  const retroTaxRows: RetroTaxRow[] = useMemo(() => {
    const raw = unit?.rawSurvey;
    const policies = taxData?.rateable?.policies || taxData?.capital?.policies || [];
    const pendingYearsList: string[] = [];

    policies.forEach((policy) => {
      policy.pendingYears?.forEach((p) => {
        const yr = p.yearCode || `FY ${p.pendingYearId}`;
        if (!pendingYearsList.includes(yr)) pendingYearsList.push(yr);
      });
    });

    if (pendingYearsList.length === 0 && (raw?.retroTaxTotal || unit?.rttx)) {
      pendingYearsList.push('FY 2021-22', 'FY 2022-23', 'FY 2023-24');
    }

    const totalYears = pendingYearsList.length;
    return pendingYearsList.map((year, idx) => {
      const yearsAgo = totalYears - idx;
      const months = yearsAgo * 12;
      const surcharges = Math.round(baseValue * 0.1);
      const interestRate = 0.24 * yearsAgo;
      const interestPenalty = Math.round((baseValue + surcharges) * interestRate);
      return {
        financialYear: year,
        retroAgeMonths: months,
        baseTax: baseValue,
        surcharges,
        interestPenaltyRateStr: `24% p.a. (${Math.round(interestRate * 100)}% Total)`,
        interestPenaltyAmt: interestPenalty,
        yearlyNetTotal: baseValue + surcharges + interestPenalty,
      };
    });
  }, [taxData, unit, baseValue]);

  const retroTotalInterest = useMemo(() => retroTaxRows.reduce((sum, r) => sum + r.interestPenaltyAmt, 0), [retroTaxRows]);
  const retroGrandTotal = useMemo(() => retroTaxRows.reduce((sum, r) => sum + r.yearlyNetTotal, 0), [retroTaxRows]);

  return {
    baseValue, taxationRules, totalSurcharge, totalReduction, cumulativeFinalTax,
    netImpact, retroTaxRows, retroTotalInterest, retroGrandTotal, discounts,
    loadingDiscounts, loadingTaxData, appliedDiscountsCount: appliedDiscounts.length,
    discountPercentageBenefit, discountFixedBenefit, discountTotalBenefit, discountFinalTax,
  };
}
