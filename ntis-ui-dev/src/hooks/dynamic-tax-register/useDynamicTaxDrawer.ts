'use client';

import { useEffect } from 'react';
import {
  DynamicTaxRegisterRow,
  ValueBasedTaxRow,
  TaxMasterMappingRow,
  TaxHybridConfig,
  YearRangeOption,
  MasterSource,
  TypeOfUseOption,
  MasterKeyOption,
  ConditionRuleRow,
  TaxCategoryOption,
} from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import { useDynamicTaxNav } from './shared/useDynamicTaxNav';
import { useDynamicTaxGeneral } from './general/useDynamicTaxGeneral';
import { useDynamicTaxValue } from './value/useDynamicTaxValue';
import { useDynamicTaxMaster } from './master/useDynamicTaxMaster';
import { useDynamicTaxHybrid } from './hybrid/useDynamicTaxHybrid';
import { useDynamicTaxCondition } from './condition/useDynamicTaxCondition';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface DynamicTaxDrawerHookProps {
  id: string;
  initialTab: string;
  category?: string;
  taxRow: DynamicTaxRegisterRow | null;
  ruleOptions: RuleSelectOption[];
  yearRangeOptions: YearRangeOption[];
  valueRows: ValueBasedTaxRow[];
  valueRowsTotalCount: number;
  masterRows: TaxMasterMappingRow[];
  masterRowsTotalCount: number;
  hybridConfig: TaxHybridConfig | null;
  masterSource: MasterSource | null;
  typeOfUseOptions: TypeOfUseOption[];
  masterKeyOptionsBySource: Record<MasterSource, MasterKeyOption[]>;
  conditionRows: ConditionRuleRow[];
  conditionFields: FieldConfig[];
  conditionScopeId: number | null;
  taxCategoryOptions: TaxCategoryOption[];
  referenceTaxOptions: TaxCategoryOption[];
  valueLoadFailed: boolean;
  masterLoadFailed: boolean;
  hybridLoadFailed: boolean;
}

/**
 * Top-level orchestrator composing every tab's hook slice. Returns a
 * two-level nested object (not one flattened bag) — this drawer has 5
 * distinct tab concerns, unlike the single-table containers this pattern
 * is modeled after, so each section component destructures only its own slice.
 *
 * `master` is instantiated exactly ONCE here and shared by both the standalone
 * Data tab and Hybrid's nested Data section — never call useDynamicTaxMaster
 * a second time, or their row/pagination state would diverge.
 */
export function useDynamicTaxDrawer(props: DynamicTaxDrawerHookProps) {
  const nav = useDynamicTaxNav(props.id, props.taxRow, props.category, props.initialTab);

  const general = useDynamicTaxGeneral(props.taxRow, props.ruleOptions, props.taxCategoryOptions, nav);

  const value = useDynamicTaxValue({
    numericId: nav.numericId,
    yearRangeOptions: props.yearRangeOptions,
    valueRows: props.valueRows,
    valueRowsTotalCount: props.valueRowsTotalCount,
    typeOfUseOptions: props.typeOfUseOptions,
    loadFailed: props.valueLoadFailed,
    nav,
  });

  const master = useDynamicTaxMaster({
    numericId: nav.numericId,
    taxRow: props.taxRow,
    ruleOptions: props.ruleOptions,
    yearRangeOptions: props.yearRangeOptions,
    masterRows: props.masterRows,
    masterRowsTotalCount: props.masterRowsTotalCount,
    masterSource: props.masterSource,
    isHybrid: nav.isHybrid,
    effectiveCategory: nav.effectiveCategory,
    generalRuleDefinitionId: general.ruleDefinitionId,
    handleGeneralRuleChange: general.handleRuleDefinitionChange,
    handleAutoDefaultRuleDefinition: general.handleAutoDefaultRuleDefinition,
    masterKeyOptionsBySource: props.masterKeyOptionsBySource,
    loadFailed: props.masterLoadFailed,
    nav,
  });

  const hybrid = useDynamicTaxHybrid(nav.numericId, props.hybridConfig, props.hybridLoadFailed);

  const condition = useDynamicTaxCondition({
    numericId: nav.numericId,
    taxRow: props.taxRow,
    conditionRows: props.conditionRows,
    conditionFields: props.conditionFields,
    conditionScopeId: props.conditionScopeId,
    yearRangeOptions: props.yearRangeOptions,
    generalRuleDefinitionId: general.ruleDefinitionId,
    taxOptions: props.referenceTaxOptions,
    nav,
  });

  /**
   * The drawer's "Save Settings" footer button is shared by both tabs, so it must save
   * General settings AND whichever Configuration data is currently relevant — otherwise
   * edits made on the Configuration tab are silently lost when the admin saves from the
   * footer instead of that tab's own local "Save Configuration"/"Save Mappings" button.
   * Only runs the Configuration-section save for an EXISTING tax — a brand-new tax has no
   * Configuration state yet (its grid isn't even rendered until the tax is created and the
   * footer navigates to the Configuration tab).
   */
  const handleSaveAll = async (): Promise<{ ok: boolean; newTaxId?: number }> => {
    const settingsResult = await general.handleSaveSettings();
    if (!settingsResult.ok) return settingsResult;
    if (nav.isNew) return settingsResult;

    // The settings save just switched this tax to a different calculation mode, which deleted the
    // configuration held under the OLD one. The branches below still target that old mode (they
    // key off `nav.effectiveCategory`, which comes from the URL and hasn't caught up), so running
    // them here would immediately re-create the rows the backend just removed. Note the existing
    // row-count guards would NOT save us: the Value grid auto-seeds so its count is never 0, and
    // the Hybrid save has no guard at all and re-inserts unconditionally.
    if (general.modeChanged) return settingsResult;

    // The admin saved from the footer without ever opening the Configuration tab this session —
    // nothing there was actually reviewed, so don't persist whatever a tab's hooks auto-seeded
    // just by mounting (Value seeds unconditionally at hook init; see useDynamicTaxValueRowOps).
    if (!nav.hasVisitedConfigRef.current) return { ok: true };

    let configOk = true;
    if (nav.isHybrid) {
      // A failed hybrid-config fetch must never be resaved — its defaults
      // (MASTER_THEN_CONDITION/DEFAULT_ZERO/NONE) would overwrite the tax's real strategy.
      const hybridOk = hybrid.loadFailed ? true : await hybrid.handleHybridSave();
      const masterOk = master.mstRows.length > 0 ? await master.handleMstSave() : true;
      const conditionOk = condition.rows.length > 0 ? await condition.handleSave() : true;
      configOk = hybridOk && masterOk && conditionOk;
    } else if (nav.effectiveCategory === 'Value') {
      configOk = value.valRowsCount > 0 ? await value.handleValSave() : true;
    } else if (nav.effectiveCategory === 'Data') {
      configOk = master.mstRows.length > 0 ? await master.handleMstSave() : true;
    } else if (nav.effectiveCategory === 'Field') {
      configOk = condition.rows.length > 0 ? await condition.handleSave() : true;
    }

    return { ok: configOk };
  };

  // Single combined "is there anything unsaved right now" signal driving the shared
  // discard-changes guard in useDynamicTaxNav (tab switch, pagination/filter changes, Rule Name
  // changes, and closing the drawer all go through it). Deliberately not narrowed by
  // effectiveCategory/isHybrid: a hook whose section isn't currently rendered never has its
  // dirty flag set in the first place, so including all of them here is always safe.
  const hasUnsavedChanges =
    general.generalDirty || value.dirty || master.dirty || condition.dirty || hybrid.dirty;
  // Kept current via an effect and through the setter useDynamicTaxNav exposes for exactly this
  // purpose (its own dirty-check ref must never be mutated directly by a caller). nav is
  // constructed before these tab hooks exist, so it can't receive their dirty flags as a normal
  // argument — registerDirtyCheck is the deferred hookup instead.
  useEffect(() => {
    nav.registerDirtyCheck(() => hasUnsavedChanges);
    // nav itself is a fresh object every render (useDynamicTaxNav returns a new object literal
    // each time) — depending on it here would refire this effect every render for no reason.
    // registerDirtyCheck's identity is stable (useCallback with no deps in useDynamicTaxNav), so
    // it alone is the precise dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.registerDirtyCheck, hasUnsavedChanges]);

  return { nav, general, value, master, hybrid, condition, handleSaveAll };
}

export type DynamicTaxDrawerState = ReturnType<typeof useDynamicTaxDrawer>;
