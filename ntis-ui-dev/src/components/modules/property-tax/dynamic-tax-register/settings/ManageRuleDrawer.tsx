'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Drawer,
  Input,
  Select,
  MasterTable,
  Label,
  Card,
  SaveButton,
  CancelButton,
} from '@/components/common';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { Settings, Info, Plus } from 'lucide-react';
import { DynamicTaxRule, TaxCalculationModeOption } from '@/types/dynamic-tax-register.types';
import {
  createRuleAction,
  updateRuleAction,
  deleteRuleAction,
} from '@/app/[locale]/property-tax/dynamic-tax-register/manageRule/action';
import { ALPHANUMERIC_PUNCTUATION_REGEX, sanitizeAlphanumericPunctuation } from '@/lib/utils/validation-rules';
import { getManageRuleColumns } from './manageRuleColumns';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface FormState {
  displayName: string;
  ruleType: string;
  sortOrder: string;
  isActive: string; // 'active' | 'inactive'
  // preserved from the edited rule so updates don't null them out
  attachedReference: string | null;
  description: string | null;
}

const EMPTY_FORM: FormState = {
  displayName: '',
  ruleType: '',
  sortOrder: '1',
  isActive: 'active',
  attachedReference: null,
  description: null,
};

export default function ManageRuleDrawer({
  initialRules,
  usedRuleIds,
  calculationModes,
}: {
  initialRules: DynamicTaxRule[];
  /** Rule ids currently referenced by at least one tax — these can't be deleted or
   *  deactivated, since doing so would leave a dependent tax without its rule. */
  usedRuleIds: number[];
  /** Active modes from PTIS.TaxCalculationModeMaster — the Rule Type options. Sourced from the
   *  DB, not a hardcoded list, so adding a mode there makes it selectable here immediately. */
  calculationModes: TaxCalculationModeOption[];
}) {
  const t = useTranslations('dynamicTaxRegister');
  const typeOfUseLabel = useAliasLabel('Type_Of_Use', t('aliasFallback.typeOfUse'));
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  // Set when this drawer was opened from a tax's General tab via "Manage Rule Category" —
  // both Close and a successful Save send the admin straight back there (instead of the
  // plain register list) so a newly created rule is immediately selectable.
  const returnTo = searchParams.get('returnTo');
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();

  /**
   * Localized label for a mode code, falling back to the DB's own ModeName.
   *
   * The i18n files still own the four long-standing codes so the screen stays multilingual (a DB
   * ModeName column can only hold one language). A mode added purely in the DB has no key yet, so
   * it renders its ModeName — meaning it shows up correctly without a code change, just untranslated
   * until someone adds the key.
   */
  const I18N_KEY_BY_MODE_CODE: Record<string, string> = {
    MASTER_BASED: 'manageRule.ruleType.masterBased',
    CONDITION_BASED: 'manageRule.ruleType.conditionBased',
    VALUE_BASED: 'manageRule.ruleType.valueBased',
    HYBRID: 'manageRule.ruleType.hybrid',
  };
  const labelForMode = (modeCode: string, fallback: string): string => {
    const key = I18N_KEY_BY_MODE_CODE[modeCode];
    return key ? t(key) : fallback;
  };

  /** Backend RuleType value → user-facing label, built from the DB-driven mode list. */
  const RULE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
    calculationModes.map((m) => [m.modeCode, labelForMode(m.modeCode, m.modeName)])
  );

  const modeByCode = new Map(calculationModes.map((m) => [m.modeCode, m]));
  /** Capability lookups — the UI asks what a mode USES, never whether it "is HYBRID". A mode added
   *  in the DB with UsesMasterConfig=1 therefore gets the Field Data picker automatically. */
  const modeUsesMasterConfig = (modeCode: string) => modeByCode.get(modeCode)?.usesMasterConfig ?? false;
  const modeUsesConditionConfig = (modeCode: string) => modeByCode.get(modeCode)?.usesConditionConfig ?? false;

  const RULE_TYPE_OPTIONS = [
    { label: t('manageRule.ruleType.placeholder'), value: '' },
    ...calculationModes.map((m) => ({
      label: labelForMode(m.modeCode, m.modeName),
      value: m.modeCode,
    })),
  ];

  /** Master data source options for MASTER_BASED rules — values match the backend's MasterSource enum. */
  const MASTER_SOURCE_OPTIONS = [
    { label: t('manageRule.masterSource.placeholder'), value: '' },
    { label: t('manageRule.masterSource.propertyType'), value: 'PropertyType' },
    { label: t('manageRule.masterSource.ownerType'), value: 'OwnerType' },
    { label: typeOfUseLabel, value: 'TypeOfUse' },
  ];

  const rules = initialRules;
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // A rule referenced by at least one tax can't be deleted or deactivated — doing so would
  // leave that tax's Rule Name pointing at nothing.
  const usedRuleIdSet = new Set(usedRuleIds);
  const isRuleInUse = (id: number) => usedRuleIdSet.has(id);
  const editingRule = editingId !== null ? rules.find((r) => r.id === editingId) ?? null : null;
  // Only lock the toggle when the rule is CURRENTLY active and in use — an already-inactive
  // in-use rule (a pre-existing inconsistency) can still be reactivated.
  const lockActiveToggle = !!editingRule && editingRule.isActive && isRuleInUse(editingRule.id);
  // Rule Type drives how a linked tax's configuration is interpreted (Value/Condition/Master/
  // Hybrid) — changing it out from under a tax that's already using this rule would silently
  // break that tax's existing setup, so it's locked for ANY in-use rule regardless of active state.
  const lockRuleType = !!editingRule && isRuleInUse(editingRule.id);

  // When there's no returnTo (opened directly from the register list's "Manage Rule Category"
  // button, not from a tax's General tab), carry the list's own filter/pagination params back —
  // otherwise closing dumps the admin on page 1 unfiltered after they searched/filtered/paged.
  const handleClose = () => {
    if (returnTo) {
      startTransition(() => router.push(returnTo));
      return;
    }
    const next = new URLSearchParams();
    (['search', 'mode', 'status', 'page', 'pageSize'] as const).forEach((key) => {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    });
    const qs = next.toString();
    startTransition(() => router.push(`/${locale}/property-tax/dynamic-tax-register${qs ? `?${qs}` : ''}`));
  };

  const refreshRules = () => startTransition(() => router.refresh());

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (rule: DynamicTaxRule) => {
    setEditingId(rule.id);
    setForm({
      displayName: rule.displayName ?? '',
      ruleType: rule.ruleType ?? '',
      sortOrder: String(rule.sortOrder ?? 1),
      isActive: rule.isActive ? 'active' : 'inactive',
      attachedReference: rule.attachedReference ?? null,
      description: rule.description ?? null,
    });
  };

  const handleSave = async () => {
    const trimmedDisplayName = form.displayName.trim();
    if (!trimmedDisplayName) {
      toast.error(t('manageRule.messages.displayNameRequired'));
      return;
    }
    if (trimmedDisplayName.length > 200) {
      toast.error(t('manageRule.messages.displayNameTooLong'));
      return;
    }
    if (!ALPHANUMERIC_PUNCTUATION_REGEX.test(trimmedDisplayName)) {
      toast.error(t('manageRule.messages.displayNameInvalidChars'));
      return;
    }
    if (!form.ruleType) {
      toast.error(t('manageRule.messages.ruleTypeRequired'));
      return;
    }
    if (modeUsesMasterConfig(form.ruleType) && !form.attachedReference) {
      toast.error(t('manageRule.messages.fieldDataRequired'));
      return;
    }
    if (editingId && editingRule && isRuleInUse(editingId) && form.ruleType !== editingRule.ruleType) {
      toast.error(t('manageRule.messages.ruleInUseCannotChangeType'));
      return;
    }
    if (editingId && editingRule?.isActive && isRuleInUse(editingId) && form.isActive !== 'active') {
      toast.error(t('manageRule.messages.ruleInUseCannotDeactivate'));
      return;
    }
    setSaving(true);
    const sortOrder = Number(form.sortOrder) || 1;
    const isActive = form.isActive === 'active';

    const res = editingId
      ? await updateRuleAction(editingId, {
          displayName: form.displayName.trim(),
          ruleType: form.ruleType,
          attachedReference: form.attachedReference,
          sortOrder,
          description: form.description,
          isActive,
          updatedBy: 1,
        })
      : await createRuleAction({
          displayName: form.displayName.trim(),
          ruleType: form.ruleType,
          attachedReference: form.attachedReference,
          sortOrder,
          description: form.description,
          createdBy: 1,
        });
    setSaving(false);

    if (res.success) {
      toast.success(editingId ? t('manageRule.messages.ruleUpdated') : t('manageRule.messages.ruleCreated'));
      resetForm();
      if (returnTo) {
        startTransition(() => router.push(returnTo));
      } else {
        refreshRules();
      }
    } else {
      toast.error(res.error || t('manageRule.messages.saveFailed'));
    }
  };

  const handleDelete = (rule: DynamicTaxRule) => {
    if (isRuleInUse(rule.id)) {
      toast.error(t('manageRule.messages.ruleInUseCannotDelete'));
      return;
    }
    confirm({
      variant: 'delete',
      title: t('manageRule.deleteTitle', { name: rule.displayName ?? rule.id }),
      description: t('manageRule.deleteDescription'),
      meta: { name: rule.displayName ?? String(rule.id) },
      onConfirm: async () => {
        const res = await deleteRuleAction(rule.id);
        if (res.success) {
          toast.success(t('manageRule.messages.ruleRemoved'));
          if (editingId === rule.id) resetForm();
          refreshRules();
        } else {
          toast.error(res.error || t('manageRule.messages.deleteFailed'));
        }
      },
    });
  };

  const titleNode = (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
        <Settings className="w-5 h-5 text-indigo-600" />
        {t('manageRule.title')}
      </h2>
      <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
        {t('manageRule.subtitle')}
      </p>
    </div>
  );

  const columns = getManageRuleColumns({ t, RULE_TYPE_LABEL, modeByCode, isRuleInUse, handleEdit, handleDelete });

  return (
    <Drawer open={true} onClose={handleClose} title={titleNode} width="lg">
      <div className="p-6 flex flex-col gap-6 h-full bg-white">
        {/* Info Alert */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3 shadow-sm">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
            {t.rich('manageRule.infoBanner', { b: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>

        {/* Add / Edit Rule Form */}
        <Card className="border border-indigo-100 shadow-sm overflow-visible bg-white">
          <div className="bg-indigo-50/30 border-b border-indigo-100 p-3">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Plus className="w-4 h-4" />
              <span>{editingId ? t('manageRule.editRule') : t('manageRule.addNewRule')}</span>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-bold text-slate-700">{t('manageRule.displayName')} <span className="text-red-500">*</span></Label>
                <Input
                  placeholder={t('manageRule.displayNamePlaceholder')}
                  className="h-9 text-xs"
                  value={form.displayName}
                  onChange={(e) => setForm((p) => ({ ...p, displayName: sanitizeAlphanumericPunctuation(e.target.value, 200) }))}
                  maxLength={200}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-bold text-slate-700">{t('manageRule.ruleType.label')} <span className="text-red-500">*</span></Label>
                <Select
                  value={form.ruleType}
                  onChange={(_, v) => setForm((p) => ({ ...p, ruleType: v, attachedReference: null }))}
                  options={RULE_TYPE_OPTIONS}
                  disabled={lockRuleType}
                />
                {lockRuleType && (
                  <span className="text-[10px] text-amber-600 font-medium">{t('manageRule.ruleTypeLockedHint')}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-bold text-slate-700">{t('manageRule.sortOrder')}</Label>
                <Input
                  className="h-9 text-xs"
                  type="number"
                  min={1}
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                />
              </div>
            </div>

            {modeUsesMasterConfig(form.ruleType) && (
              <div className="flex flex-col gap-1.5 max-w-xs">
                <Label className="text-[11px] font-bold text-slate-700">{t('manageRule.masterSource.label')} <span className="text-red-500">*</span></Label>
                <Select
                  value={form.attachedReference ?? ''}
                  onChange={(_, v) => setForm((p) => ({ ...p, attachedReference: v || null }))}
                  options={MASTER_SOURCE_OPTIONS}
                />
              </div>
            )}

            {modeUsesConditionConfig(form.ruleType) && (
              <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 max-w-md">
                {t('manageRule.conditionConfiguredPerTaxHint')}
              </span>
            )}

            <div className="flex items-end gap-6">
              <div className="flex flex-col gap-1.5 w-48">
                <Label className="text-[11px] font-bold text-slate-700">{t('manageRule.isActive')}</Label>
                <Select
                  value={form.isActive}
                  onChange={(_, v) => setForm((p) => ({ ...p, isActive: v }))}
                  options={[
                    { label: t('manageRule.active'), value: 'active' },
                    { label: t('manageRule.inactive'), value: 'inactive' },
                  ]}
                  disabled={lockActiveToggle}
                />
                {lockActiveToggle && (
                  <span className="text-[10px] text-amber-600 font-medium">{t('manageRule.ruleInUseHint')}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <SaveButton
                  label={editingId ? t('manageRule.updateRule') : t('manageRule.saveRule')}
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 px-5 shadow-md active:scale-95 transition-all"
                />
                <CancelButton label={t('manageRule.clear')} onClick={resetForm} className="h-9 px-5" />
              </div>
            </div>
          </div>
        </Card>

        {/* Master Table */}
        <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-[#1a233a] shadow-md bg-white mt-2">
          <MasterTable
            columns={columns}
            data={rules}
            height='sm'
            loading={isPending}
            rowClassName={() => 'hover:bg-slate-50 transition-colors [&_td]:p-3 [&_td]:border-b [&_td]:border-slate-100'}
            getRowKey={(row) => String((row as DynamicTaxRule).id)}
          />
        </div>
      </div>
    </Drawer>
  );
}
