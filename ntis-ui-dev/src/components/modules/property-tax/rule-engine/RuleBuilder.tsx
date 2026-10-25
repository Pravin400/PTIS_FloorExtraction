'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { RuleItem, RuleScope, FieldConfig, EffectTypeConfig } from '@/types/rule-engine';
import { useRuleBuilder } from '@/hooks/rule-engine/useRuleBuilder';
import RuleBuilderHeader from './RuleBuilderHeader';
import RuleBuilderCard from './RuleBuilderCard';
import RuleSaveReasonModal from './RuleSaveReasonModal';
import TargetFilterPanel from './TargetFilterPanel';

interface RuleBuilderProps {
  initialRule?: RuleItem;
  scopes: RuleScope[];
  initialFields: FieldConfig[];
  locale: string;
  onFetchFields: (scopeId: number) => Promise<FieldConfig[]>;
  onSaveRule: (payload: RuleItem) => Promise<{ success: boolean; message: string }>;
  corporations: { label: string; value: string }[];
  effectTypes: { label: string; value: string }[];
  /** Rate section options — used by EffectPanel inside RuleBuilderCard */
  categoryOptions: { label: string; value: string }[];
  /** Rule category options fetched from /api/RuleCategory — used by TargetFilterPanel */
  ruleCategoryOptions: { label: string; value: string }[];
  effectTypeConfigs: EffectTypeConfig[];
}

export default function RuleBuilder(props: RuleBuilderProps) {
  const router = useRouter();
  const confirmCtx = useConfirm();
  const t = useTranslations('ruleEngine');

  const {
    ruleName, setRuleName,
    ruleScopeId, setRuleScopeId,
    ruleCategory, setRuleCategory,
    ruleDescription, setRuleDescription,
    priority, setPriority,
    isActive, setIsActive,
    stopProcessing, setStopProcessing,
    rulesList, fields,
    isReasonOpen, setIsReasonOpen, changeReason, setChangeReason,
    activeScopeName, handleSaveClick, handleConfirmSave,
    isSaving, hasChanges,
    addRuleBlock, removeRuleBlock, moveRuleBlock, updateRuleBlock,
    updateBlockEffect, addEffectToBlock, removeEffectFromBlock,
  } = useRuleBuilder(props);

  // Prompt before unloading the page/tab
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isSaving]);

  // Prompt when navigating via Back button
  const handleBackClick = () => {
    if (hasChanges && !isSaving) {
      confirmCtx.confirm({
        variant: 'warning',
        title: t('unsavedChanges.title'),
        description: t('unsavedChanges.description'),
        confirmText: t('unsavedChanges.confirm'),
        cancelText: t('unsavedChanges.cancel'),
        onConfirm: () => {
          router.push(`/${props.locale}/property-tax/rule-engine`);
        },
      });
    } else {
      router.push(`/${props.locale}/property-tax/rule-engine`);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 w-full px-1 pb-8 lg:pb-0 select-none lg:h-[calc(100vh-170px)] lg:overflow-hidden">
      <RuleBuilderHeader locale={props.locale} onBackClick={handleBackClick} />

      <div className="flex flex-col gap-4 w-full flex-1 lg:min-h-0 lg:overflow-hidden">
        {/* Top Side: Rule Details Form */}
        <div className="w-full shrink-0">
          <TargetFilterPanel
            ruleName={ruleName} setRuleName={setRuleName}
            ruleScopeId={ruleScopeId} setRuleScopeId={setRuleScopeId}
            ruleCategory={ruleCategory} setRuleCategory={setRuleCategory}
            ruleDescription={ruleDescription} setRuleDescription={setRuleDescription}
            priority={priority} setPriority={setPriority}
            scopes={props.scopes}
            ruleCategoryOptions={props.ruleCategoryOptions}
            isActive={isActive} setIsActive={setIsActive}
            stopProcessing={stopProcessing} setStopProcessing={setStopProcessing}
          />
        </div>

        {/* Bottom Side: Visual Rule Builder */}
        <div className="flex-grow min-w-0 w-full flex flex-col lg:min-h-0 lg:overflow-hidden">
          <RuleBuilderCard
            activeScopeName={activeScopeName}
            handleSaveClick={handleSaveClick}
            isSaving={isSaving}
            hasChanges={hasChanges}
            isEdit={!!props.initialRule}
            rulesList={rulesList}
            fields={fields}
            effectTypes={props.effectTypes}
            categoryOptions={props.categoryOptions}
            effectTypeConfigs={props.effectTypeConfigs}
            onAddRuleBlock={addRuleBlock}
            onRemoveRuleBlock={removeRuleBlock}
            onMoveRuleBlock={moveRuleBlock}
            onUpdateRuleBlock={updateRuleBlock}
            onUpdateBlockEffect={updateBlockEffect}
            onAddEffectToBlock={addEffectToBlock}
            onRemoveEffectFromBlock={removeEffectFromBlock}
          />
        </div>
      </div>

      <RuleSaveReasonModal
        open={isReasonOpen}
        onClose={() => setIsReasonOpen(false)}
        changeReason={changeReason}
        setChangeReason={setChangeReason}
        onConfirm={handleConfirmSave}
      />

    </div>
  );
}

