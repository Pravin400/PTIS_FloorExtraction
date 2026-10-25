'use client';

import {
  YearRangeOption,
  TaxMasterMappingRow,
  MasterSource,
  DynamicTaxRegisterRow,
  MasterKeyOption,
} from '@/types/dynamic-tax-register.types';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';
import { useDynamicTaxMasterFilters } from './useDynamicTaxMasterFilters';
import { useDynamicTaxMasterRuleSelection } from './useDynamicTaxMasterRuleSelection';
import { useDynamicTaxMasterRowOps } from './useDynamicTaxMasterRowOps';
import { useDynamicTaxMasterAutoSeed } from './useDynamicTaxMasterAutoSeed';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface DynamicTaxMasterParams {
  numericId: number;
  taxRow: DynamicTaxRegisterRow | null;
  ruleOptions: RuleSelectOption[];
  yearRangeOptions: YearRangeOption[];
  masterRows: TaxMasterMappingRow[];
  masterRowsTotalCount: number;
  masterSource: MasterSource | null;
  isHybrid: boolean;
  effectiveCategory: string;
  generalRuleDefinitionId: string;
  handleGeneralRuleChange: (value: string) => void;
  handleAutoDefaultRuleDefinition: (value: string) => void;
  masterKeyOptionsBySource: Record<MasterSource, MasterKeyOption[]>;
  loadFailed: boolean;
  nav: DynamicTaxNav;
}

/**
 * Orchestrator for the Master/Data config tab — shared by the standalone Data
 * tab and Hybrid's nested Master Data Mapping section (call this exactly ONCE
 * per drawer instance; both sections must consume the same returned slice,
 * never call this hook twice, or their row/pagination state would diverge).
 */
export function useDynamicTaxMaster({
  numericId,
  taxRow,
  ruleOptions,
  yearRangeOptions,
  masterRows,
  masterRowsTotalCount,
  masterSource,
  isHybrid,
  effectiveCategory,
  generalRuleDefinitionId,
  handleGeneralRuleChange,
  handleAutoDefaultRuleDefinition,
  masterKeyOptionsBySource,
  loadFailed,
  nav,
}: DynamicTaxMasterParams) {
  const filters = useDynamicTaxMasterFilters(yearRangeOptions, nav);

  const ruleSelection = useDynamicTaxMasterRuleSelection({
    ruleOptions,
    masterSource,
    masterRowsFirstRuleId: masterRows[0]?.ruleDefinitionId,
    isHybrid,
    generalRuleDefinitionId,
    handleGeneralRuleChange,
    handleAutoDefaultRuleDefinition,
    nav,
  });

  const rowOps = useDynamicTaxMasterRowOps({
    numericId,
    taxRow,
    yearRangeOptions,
    mstYearId: filters.mstYearId,
    mstPage: filters.mstPage,
    mstPageSize: filters.mstPageSize,
    onMstPageChange: filters.onMstPageChange,
    onMstPageSizeChange: filters.onMstPageSizeChange,
    effectiveMstRuleId: ruleSelection.effectiveMstRuleId,
    effectiveMasterSource: ruleSelection.effectiveMasterSource,
    mstBulkMode: filters.mstBulkMode,
    mstBulkBase: filters.mstBulkBase,
    mstBulk: filters.mstBulk,
    setMstBulk: filters.setMstBulk,
    masterRows,
    masterRowsTotalCount,
    masterKeyOptionsBySource,
    loadFailed,
    router: nav.router,
  });

  useDynamicTaxMasterAutoSeed({
    activeTab: String(nav.activeTab),
    effectiveCategory,
    isHybrid,
    ruleOptions,
    effectiveMstRuleId: ruleSelection.effectiveMstRuleId,
    mstYearId: filters.mstYearId,
    mstRows: rowOps.mstRows,
    mstBusy: rowOps.mstBusy,
    loadFailed,
    applyAutoDefaultMasterRule: ruleSelection.applyAutoDefaultMasterRule,
    handleHybridMasterRuleChange: ruleSelection.handleHybridMasterRuleChange,
    handleSeedMaster: rowOps.handleSeedMaster,
  });

  return { ...filters, ...rowOps, ...ruleSelection, loadFailed };
}

export type DynamicTaxMaster = ReturnType<typeof useDynamicTaxMaster>;
