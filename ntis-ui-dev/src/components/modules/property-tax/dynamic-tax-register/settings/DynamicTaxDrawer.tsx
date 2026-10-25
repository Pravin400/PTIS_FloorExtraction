'use client';

import { useTranslations } from 'next-intl';
import { Drawer, Tabs } from '@/components/common';
import { FileText, Settings, Table2 } from 'lucide-react';
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
import { useDynamicTaxDrawer } from '@/hooks/dynamic-tax-register/useDynamicTaxDrawer';
import { DynamicTaxDrawerTitle, DynamicTaxDrawerFooter } from './DynamicTaxDrawerChrome';
import { GeneralSection } from './sections/GeneralSection';
import { ConditionSection } from './sections/condition/ConditionSection';
import { ValueSection } from './sections/value/ValueSection';
import { MasterSection } from './sections/master/MasterSection';
import { HybridSection } from './sections/HybridSection';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface DynamicTaxDrawerProps {
  id: string;
  initialTab?: string;
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

export default function DynamicTaxDrawer(props: DynamicTaxDrawerProps) {
  const t = useTranslations('dynamicTaxRegister');
  const { taxRow, ruleOptions, yearRangeOptions } = props;
  const { nav, general, value, master, hybrid, condition, handleSaveAll } = useDynamicTaxDrawer({
    id: props.id,
    initialTab: props.initialTab ?? 'general',
    category: props.category,
    taxRow: props.taxRow,
    ruleOptions: props.ruleOptions,
    yearRangeOptions: props.yearRangeOptions,
    valueRows: props.valueRows,
    valueRowsTotalCount: props.valueRowsTotalCount,
    masterRows: props.masterRows,
    masterRowsTotalCount: props.masterRowsTotalCount,
    hybridConfig: props.hybridConfig,
    masterSource: props.masterSource,
    typeOfUseOptions: props.typeOfUseOptions,
    masterKeyOptionsBySource: props.masterKeyOptionsBySource,
    conditionRows: props.conditionRows,
    conditionFields: props.conditionFields,
    conditionScopeId: props.conditionScopeId,
    taxCategoryOptions: props.taxCategoryOptions,
    referenceTaxOptions: props.referenceTaxOptions,
    valueLoadFailed: props.valueLoadFailed,
    masterLoadFailed: props.masterLoadFailed,
    hybridLoadFailed: props.hybridLoadFailed,
  });

  const resolvedConfigTab = nav.isNew ? (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
      <p className="text-sm text-slate-500 font-medium">{t('drawer.saveFirstNotice')}</p>
      <p className="text-xs text-slate-400">{t('drawer.configAvailableAfterSave')}</p>
    </div>
  ) : nav.isHybrid ? (
    <HybridSection
      hybrid={hybrid}
      master={master}
      condition={condition}
      ruleOptions={ruleOptions}
      yearRangeOptions={yearRangeOptions}
      onRetryLoad={() => nav.router.refresh()}
    />
  ) : nav.effectiveCategory === 'Value' ? (
    <ValueSection value={value} onRetryLoad={() => nav.router.refresh()} />
  ) : nav.effectiveCategory === 'Data' ? (
    <MasterSection master={master} ruleOptions={ruleOptions} yearRangeOptions={yearRangeOptions} onRetryLoad={() => nav.router.refresh()} />
  ) : (
    <ConditionSection condition={condition} />
  );

  return (
    <Drawer
      open={true}
      onClose={nav.handleClose}
      width="lg"
      // NOTE: the Drawer's default body scroll (overflow-y-auto) is left in place deliberately.
      // Overriding it to overflow-hidden does remove the thin outer scrollbar beside the tab bar,
      // but only the Drawer/Tabs shared components can give the panels a genuinely bounded height
      // (Drawer wraps children in a min-h-full block, so the h-full chain below it resolves to
      // auto) — without that, hiding the outer scroll just clips whatever overflows, which cost
      // the Data/Value grids their pagination row. The outer scrollbar is the lesser problem.
      title={
        <DynamicTaxDrawerTitle
          isNew={nav.isNew}
          taxName={general.taxName}
          taxRow={taxRow}
          taxCode={(nav.isNew ? general.taxCode : taxRow?.taxCode) || ''}
          ruleLabel={general.ruleLabel}
        />
      }
      footer={
        <DynamicTaxDrawerFooter
          isNew={nav.isNew}
          savingSettings={general.savingSettings}
          handleClose={nav.handleClose}
          rawClose={nav.rawClose}
          handleSaveSettings={handleSaveAll}
          selectedCategory={general.selectedCategory}
          routeBase={nav.routeBase}
          numericId={nav.numericId}
          startTransition={nav.startTransition}
          router={nav.router}
          rawRouter={nav.rawRouter}
        />
      }
    >
      <Tabs
        value={nav.activeTab}
        onChange={general.handleTabChange}
        variant="line"
        className="h-full flex flex-col [&>div[role=tablist]]:px-5 [&>div[role=tablist]]:bg-white [&>div[role=tablist]]:border-b [&>div[role=tablist]]:border-slate-200 [&>div[role=tablist]]:shadow-sm [&>div[role=tablist]]:shrink-0"
        items={[
          {
            value: 'general',
            label: (
              <span className="flex items-center gap-2 font-bold text-[13px] py-2 px-1">
                <FileText className="w-3.5 h-3.5" />
                {t('drawer.generalTab')}
              </span>
            ),
            content: (
              <GeneralSection
                isNew={nav.isNew}
                taxRow={taxRow}
                ruleOptions={ruleOptions}
                taxCategoryOptions={props.taxCategoryOptions}
                general={general}
              />
            ),
            panelClassName: 'overflow-auto flex-1 min-h-0 outline-none',
          },
          {
            value: 'config',
            label: (
              <span className="flex items-center gap-2 font-bold text-[13px] py-2 px-1">
                {nav.effectiveCategory === 'Value' ? <Table2 className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                {t('drawer.configurationTab')}
                {nav.isHybrid && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">{t('drawer.hybridBadge')}</span>
                )}
              </span>
            ),
            content: resolvedConfigTab,
            panelClassName:
              nav.effectiveCategory === 'Value' || nav.effectiveCategory === 'Data'
                ? 'flex flex-col flex-1 min-h-0 outline-none overflow-hidden'
                : 'overflow-auto flex-1 min-h-0 outline-none',
          },
        ]}
      />
    </Drawer>
  );
}
