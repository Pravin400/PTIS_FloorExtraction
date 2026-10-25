'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm, type TabValue } from '@/components/common';
import {
  DynamicTaxRegisterRow,
  CalculationMode,
  RuleCategory,
  TaxCategoryOption,
  TaxConfigSummary,
  categoryForMode,
} from '@/types/dynamic-tax-register.types';
import {
  saveTaxSettingsAction,
  createTaxAction,
  fetchTaxConfigSummaryAction,
} from '@/app/[locale]/property-tax/dynamic-tax-register/action';
import { ALPHANUMERIC_PUNCTUATION_REGEX, DESCRIPTION_REGEX } from '@/lib/utils/validation-rules';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

/**
 * Tax Name Alias is optional, so an empty value is valid (it clears the stored alias). When
 * present it uses the same multilingual rules as Tax Name — the whole point of the field is a
 * regional-language name, so DESCRIPTION_REGEX (Unicode letters/marks) rather than the
 * ASCII-only rule used for Tax Code. Returns an i18n key, or null when valid.
 */
function validateAlias(alias: string): string | null {
  const trimmed = alias.trim();
  if (!trimmed) return null;
  if (trimmed.length > 200) return 'messages.general.taxNameAliasTooLong';
  if (!DESCRIPTION_REGEX.test(trimmed)) return 'messages.general.taxNameAliasInvalidChars';
  return null;
}

/** Drawer-header badge + mode-change copy: the rule CATEGORY ("Value Based" / "Condition Based" /
 *  "Master Based" / "Hybrid"), not the individual rule's own name — reuses the same mode->label
 *  strings already shown in the register grid's mode filter. */
const CATEGORY_LABEL_KEY: Record<CalculationMode, string> = {
  VALUE_BASED: 'list.modeOptions.value',
  CONDITION_BASED: 'list.modeOptions.condition',
  MASTER_BASED: 'list.modeOptions.master',
  HYBRID: 'list.modeOptions.hybrid',
};

/** Which per-tax configuration tables each mode uses — mirrors ConfigTablesFor in
 *  DynamicTaxRegisterService so the warning names exactly what the backend will delete. */
const MODE_CONFIG_TABLES: Record<CalculationMode, { value: boolean; condition: boolean; master: boolean; hybrid: boolean }> = {
  VALUE_BASED: { value: true, condition: false, master: false, hybrid: false },
  CONDITION_BASED: { value: false, condition: true, master: false, hybrid: false },
  MASTER_BASED: { value: false, condition: false, master: true, hybrid: false },
  HYBRID: { value: false, condition: true, master: true, hybrid: true },
};

/**
 * Human-readable list of what switching `from` → `to` will discard, e.g.
 * "24 percentage rows, 3 condition rules". Returns null when nothing would actually be
 * deleted — an unconfigured tax should switch modes without a scary dialog.
 */
function describeDiscardedConfig(
  summary: TaxConfigSummary,
  from: CalculationMode,
  to: CalculationMode,
  t: (key: string, values?: Record<string, string | number>) => string
): string | null {
  const oldTables = MODE_CONFIG_TABLES[from];
  const newTables = MODE_CONFIG_TABLES[to];
  const parts: string[] = [];

  if (oldTables.value && !newTables.value && summary.valueRowCount > 0) {
    parts.push(t('general.modeChange.valueRows', { count: summary.valueRowCount }));
  }
  if (oldTables.condition && !newTables.condition && summary.conditionRowCount > 0) {
    parts.push(t('general.modeChange.conditionRows', { count: summary.conditionRowCount }));
  }
  if (oldTables.master && !newTables.master && summary.masterMappingCount > 0) {
    parts.push(t('general.modeChange.masterRows', { count: summary.masterMappingCount }));
  }
  if (oldTables.hybrid && !newTables.hybrid && summary.hasHybridConfig) {
    parts.push(t('general.modeChange.hybridConfig'));
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/** General-tab state: tax identity fields, status flags, and the Rule Name picker. */
export function useDynamicTaxGeneral(
  taxRow: DynamicTaxRegisterRow | null,
  ruleOptions: RuleSelectOption[],
  taxCategoryOptions: TaxCategoryOption[],
  nav: DynamicTaxNav
) {
  const t = useTranslations('dynamicTaxRegister');
  const { confirm } = useConfirm();
  const { isNew, numericId, calcMode, effectiveCategory, buildConfigUrl, router, routeBase } = nav;

  const [status, setStatus] = useState(taxRow?.status === 'DEACTIVE' ? 'deactive' : 'active');
  const [assessmentStatus, setAssessmentStatus] = useState(taxRow?.assessmentStatus ? 'active' : 'deactive');
  const [oldTaxStatus, setOldTaxStatus] = useState(taxRow?.oldTaxStatus ? 'active' : 'deactive');
  const initialRuleDefId =
    taxRow?.ruleDefinitionId && Number(taxRow.ruleDefinitionId) > 0 ? String(taxRow.ruleDefinitionId) : '';
  const [ruleDefinitionId, setRuleDefinitionId] = useState(initialRuleDefId);
  // Tracks whether the admin explicitly picked a different Rule Name this
  // session. HYBRID taxes carry a RuleDefinitionId too (their condition-side
  // rule), so we must NOT re-derive CalculationMode from that rule's type
  // unless the selection actually changed — otherwise re-saving an untouched
  // Hybrid tax would silently downgrade it to CONDITION_BASED.
  const [ruleChanged, setRuleChanged] = useState(false);
  const [taxName, setTaxName] = useState(taxRow?.taxName ?? '');
  const [taxNameAlias, setTaxNameAlias] = useState(taxRow?.taxNameAlias ?? '');
  const [taxCode, setTaxCode] = useState(taxRow?.taxCode ?? '');
  const [taxCategoryId, setTaxCategoryId] = useState(
    taxCategoryOptions[0] ? String(taxCategoryOptions[0].value) : ''
  );
  const [savingSettings, setSavingSettings] = useState(false);

  // Snapshot of every General field at the point it was last known to match the server (initial
  // load, or right after a successful save) — compared against current state to drive the
  // shared "discard unsaved changes?" guard on tab-switch/navigate/close. State, not a ref: it's
  // read during render (to compute generalDirty below) and only ever written from event-handler
  // code (handleSaveSettings' success branches), never during render itself.
  const [initialGeneral, setInitialGeneral] = useState({
    status, assessmentStatus, oldTaxStatus, ruleDefinitionId, taxName, taxNameAlias, taxCode, taxCategoryId,
  });
  const generalDirty =
    status !== initialGeneral.status ||
    assessmentStatus !== initialGeneral.assessmentStatus ||
    oldTaxStatus !== initialGeneral.oldTaxStatus ||
    ruleDefinitionId !== initialGeneral.ruleDefinitionId ||
    taxName !== initialGeneral.taxName ||
    taxNameAlias !== initialGeneral.taxNameAlias ||
    taxCode !== initialGeneral.taxCode ||
    taxCategoryId !== initialGeneral.taxCategoryId;

  // The mode/category implied by the rule CURRENTLY SELECTED in the dropdown.
  const selectedRuleOption = ruleOptions.find((o) => o.value === ruleDefinitionId);
  const selectedCalcMode: CalculationMode = (selectedRuleOption?.ruleType as CalculationMode) ?? calcMode;
  // What will actually be saved / used for navigation this session: the newly
  // selected rule's mode once changed (or always, for a brand-new tax);
  // otherwise the tax's existing, unmodified mode.
  const displayCalcMode: CalculationMode = isNew || ruleChanged ? selectedCalcMode : calcMode;
  const selectedCategory: RuleCategory = categoryForMode(displayCalcMode);
  /** True when saving would move this EXISTING tax to a different calculation mode — the only
   *  case that abandons (and therefore deletes) configuration. */
  const modeChanged = !isNew && displayCalcMode !== calcMode;

  const ruleLabel = !isNew || selectedRuleOption ? t(CATEGORY_LABEL_KEY[displayCalcMode]) : t('general.selectARulePrompt');

  /**
   * Promise wrapper around the callback-based `confirm` API. `settled` makes resolution
   * idempotent: ConfirmProvider keeps no queue and simply replaces a pending payload, so a
   * double-click (or a confirm raised elsewhere) could otherwise leave this promise forever
   * unsettled and freeze `savingSettings` at true. Resolves false on any dismissal — never rejects.
   */
  const confirmAsync = (options: {
    variant: 'warning';
    title: string;
    description: string;
    confirmText: string;
  }): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (result: boolean) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      confirm({ ...options, onConfirm: () => settle(true), onCancel: () => settle(false) });
    });

  const handleRuleDefinitionChange = (value: string) => {
    // Select fires onChange even when the admin re-picks the option that's ALREADY selected.
    // Latching `ruleChanged` on that would re-derive CalculationMode from the linked rule's type
    // — which, for a HYBRID tax pointing at a CONDITION_BASED rule (see the note above), silently
    // reads as a mode change and would trigger the destructive-cleanup confirmation for an action
    // the admin never took. Treat a same-value pick as the no-op it is.
    if (value === ruleDefinitionId) return;
    setRuleDefinitionId(value);
    setRuleChanged(true);
  };

  /**
   * Used only by useDynamicTaxMasterAutoSeed's one-time "default the Rule Name to the first
   * Master Based rule" step for a tax that has none linked yet — a system default, not a user
   * pick, so it must NOT flip `ruleChanged` (which would derive a "new" CalculationMode from it
   * and can surface the destructive mode-change confirmation for a change the admin never made).
   */
  const handleAutoDefaultRuleDefinition = (value: string) => {
    if (value === ruleDefinitionId) return;
    setRuleDefinitionId(value);
  };

  /** Assessment Status only makes sense while the tax itself is Active — deactivating the
   *  tax forces Assessment Status to Deactive too (the Select is disabled in that state). */
  const handleStatusChange = (value: string) => {
    setStatus(value);
    if (value !== 'active') {
      setAssessmentStatus('deactive');
    }
  };

  const handleTabChange = (tab: TabValue) => {
    if (isNew && tab === 'config') {
      toast.error(t('messages.general.saveTaxFirst'));
      return;
    }
    // Use the live rule selection's category when heading to Configuration
    // (matches "Configure"), so switching tabs after changing Rule Name
    // doesn't leave the Rule Name strip and the displayed grid mismatched.
    const targetCategory = tab === 'config' ? selectedCategory : effectiveCategory;
    router.replace(buildConfigUrl({ tab, category: targetCategory }));
  };

  const handleConfigureClick = () => {
    if (isNew) {
      toast.error(t('messages.general.saveTaxFirst'));
      return;
    }
    router.replace(buildConfigUrl({ tab: 'config', category: selectedCategory }));
  };

  /**
   * Sends the admin to the Rule Master ("Manage Rule Category") drawer to define a new
   * rule on the fly, carrying a `returnTo` URL back to this exact General-tab view —
   * ManageRuleDrawer redirects here after a successful save so the newly created rule is
   * immediately selectable in the Rule Name dropdown below, without a manual back-navigation.
   */
  const handleManageRuleCategoryClick = () => {
    const returnTo = buildConfigUrl({ tab: 'general' });
    router.push(`${routeBase}/manageRule?returnTo=${encodeURIComponent(returnTo)}`);
  };

  /**
   * Saves General-tab settings. For a new tax, creates it and returns the assigned id.
   * Tax Name is editable on both paths (create + existing-tax settings save) and validated
   * on each. Tax Code stays creation-only — it's an immutable identifier once assigned — so its
   * format/length validation runs only on the `isNew` path.
   */
  const handleSaveSettings = async (): Promise<{ ok: boolean; newTaxId?: number }> => {
    if (isNew) {
      const trimmedTaxName = taxName.trim();
      const trimmedTaxCode = taxCode.trim();

      if (!trimmedTaxName) {
        toast.error(t('messages.general.taxNameRequired'));
        return { ok: false };
      }
      if (trimmedTaxName.length > 200) {
        toast.error(t('messages.general.taxNameTooLong'));
        return { ok: false };
      }
      if (!DESCRIPTION_REGEX.test(trimmedTaxName)) {
        toast.error(t('messages.general.taxNameInvalidChars'));
        return { ok: false };
      }
      if (!trimmedTaxCode) {
        toast.error(t('messages.general.taxCodeRequired'));
        return { ok: false };
      }
      if (trimmedTaxCode.length > 20) {
        toast.error(t('messages.general.taxCodeTooLong'));
        return { ok: false };
      }
      if (!ALPHANUMERIC_PUNCTUATION_REGEX.test(trimmedTaxCode)) {
        toast.error(t('messages.general.taxCodeInvalidChars'));
        return { ok: false };
      }
      if (!ruleDefinitionId) {
        toast.error(t('messages.general.selectRuleNameRequired'));
        return { ok: false };
      }
      const aliasError = validateAlias(taxNameAlias);
      if (aliasError) {
        toast.error(t(aliasError));
        return { ok: false };
      }
      setSavingSettings(true);
      try {
        const res = await createTaxAction({
          taxName: taxName.trim(),
          taxNameAlias: taxNameAlias.trim() || undefined,
          taxCode: taxCode.trim().toUpperCase(),
          taxCategoryId: Number(taxCategoryId),
          calculationMode: selectedCalcMode,
          ruleDefinitionId: Number(ruleDefinitionId),
          status: status === 'active' ? 'ACTIVE' : 'DEACTIVE',
          assessmentStatus: assessmentStatus === 'active',
          oldTaxStatus: oldTaxStatus === 'active',
          createdBy: 1,
        });
        if (res.success && res.data !== undefined) {
          toast.success(t('messages.general.taxCreated'));
          setInitialGeneral({
            status, assessmentStatus, oldTaxStatus, ruleDefinitionId, taxName, taxNameAlias, taxCode, taxCategoryId,
          });
          return { ok: true, newTaxId: res.data };
        }
        toast.error(res.error || t('messages.general.createTaxFailed'));
        return { ok: false };
      } catch {
        toast.error(t('messages.general.createTaxFailedRetry'));
        return { ok: false };
      } finally {
        setSavingSettings(false);
      }
    }

    // Tax Name is editable for an existing tax too — validate the edited value before saving.
    const trimmedName = taxName.trim();
    if (!trimmedName) {
      toast.error(t('messages.general.taxNameRequired'));
      return { ok: false };
    }
    if (trimmedName.length > 200) {
      toast.error(t('messages.general.taxNameTooLong'));
      return { ok: false };
    }
    if (!DESCRIPTION_REGEX.test(trimmedName)) {
      toast.error(t('messages.general.taxNameInvalidChars'));
      return { ok: false };
    }
    const aliasError = validateAlias(taxNameAlias);
    if (aliasError) {
      toast.error(t(aliasError));
      return { ok: false };
    }
    // Validate Rule Name for an existing tax — require a valid rule before saving settings or changing status.
    if (!ruleDefinitionId || Number(ruleDefinitionId) <= 0) {
      toast.error(t('messages.general.selectRuleNameRequired'));
      return { ok: false };
    }

    setSavingSettings(true);
    try {
      // Each calculation mode keeps its configuration in a different table, so switching modes
      // abandons whatever was configured under the old one. The backend refuses to delete it
      // without an explicit opt-in (409), so warn with real counts and only then re-send with it.
      let confirmModeChangeCleanup = false;
      if (modeChanged) {
        const summaryRes = await fetchTaxConfigSummaryAction(numericId);
        if (!summaryRes.success || !summaryRes.data) {
          toast.error(summaryRes.error || t('messages.general.saveSettingsFailed'));
          return { ok: false };
        }
        const discarded = describeDiscardedConfig(summaryRes.data, calcMode, displayCalcMode, t);
        if (discarded) {
          const proceed = await confirmAsync({
            variant: 'warning',
            title: t('general.modeChange.title'),
            description: t('general.modeChange.description', {
              from: t(CATEGORY_LABEL_KEY[calcMode]),
              to: t(CATEGORY_LABEL_KEY[displayCalcMode]),
              discarded,
            }),
            confirmText: t('general.modeChange.confirm'),
          });
          if (!proceed) return { ok: false };
        }
        confirmModeChangeCleanup = true;
      }

      const res = await saveTaxSettingsAction(numericId, {
        taxName: trimmedName,
        // Always sent (never undefined) so clearing the field actually clears the stored alias —
        // the backend treats "" as "cleared" and only a missing field as "leave unchanged".
        taxNameAlias: taxNameAlias.trim(),
        status: status === 'active' ? 'ACTIVE' : 'DEACTIVE',
        assessmentStatus: assessmentStatus === 'active',
        oldTaxStatus: oldTaxStatus === 'active',
        calculationMode: displayCalcMode,
        ruleDefinitionId: ruleDefinitionId && Number(ruleDefinitionId) > 0 ? Number(ruleDefinitionId) : null,
        updatedBy: 1,
        // Always sent, even when this client sees no mode change: if its view of the tax was
        // stale, the backend 409s instead of deleting configuration nobody was warned about.
        expectedCurrentMode: calcMode,
        confirmModeChangeCleanup,
      });
      if (res.success) {
        toast.success(t('messages.general.settingsSaved'));
        setInitialGeneral({
          status, assessmentStatus, oldTaxStatus, ruleDefinitionId, taxName, taxNameAlias, taxCode, taxCategoryId,
        });
        return { ok: true };
      }
      toast.error(res.error || t('messages.general.saveSettingsFailed'));
      return { ok: false };
    } catch {
      toast.error(t('messages.general.saveSettingsFailedRetry'));
      return { ok: false };
    } finally {
      setSavingSettings(false);
    }
  };

  return {
    status, setStatus,
    assessmentStatus, setAssessmentStatus,
    oldTaxStatus, setOldTaxStatus,
    ruleDefinitionId,
    ruleChanged,
    taxName, setTaxName,
    taxNameAlias, setTaxNameAlias,
    taxCode, setTaxCode,
    taxCategoryId, setTaxCategoryId,
    savingSettings,
    selectedRuleOption,
    selectedCalcMode,
    displayCalcMode,
    selectedCategory,
    modeChanged,
    ruleLabel,
    generalDirty,
    handleRuleDefinitionChange,
    handleAutoDefaultRuleDefinition,
    handleStatusChange,
    handleTabChange,
    handleConfigureClick,
    handleManageRuleCategoryClick,
    handleSaveSettings,
  };
}

export type DynamicTaxGeneral = ReturnType<typeof useDynamicTaxGeneral>;
