'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/common';
import { useRuleFieldsConfig } from './useRuleFieldsConfig';
import { useRuleBlocks } from './useRuleBlocks';
import {
  RuleItem, RuleScope, FieldConfig,
  TargetFilterState, EffectTypeConfig,
} from '@/types/rule-engine';
import { safeParse } from '@/lib/utils/json-parse';
import {
  validateRuleBuilder,
} from './useRuleBuilderHelpers';

interface UseRuleBuilderProps {
  initialRule?: RuleItem;
  scopes: RuleScope[];
  initialFields: FieldConfig[];
  locale: string;
  onFetchFields: (scopeId: number) => Promise<FieldConfig[]>;
  onSaveRule: (payload: RuleItem) => Promise<{ success: boolean; message: string; data?: RuleItem }>;
  effectTypeConfigs: EffectTypeConfig[];
}

export function useRuleBuilder({
  initialRule, scopes, initialFields,
  locale, onFetchFields, onSaveRule,
  effectTypeConfigs: _effectTypeConfigs,
}: UseRuleBuilderProps) {
  const toast = useToast();
  const t = useTranslations('ruleEngine');

  const [currentRuleId, setCurrentRuleId] = React.useState<number | undefined>(initialRule?.id);
  const [ruleName, setRuleName] = React.useState(initialRule?.ruleName ?? '');
  const [ruleCode, setRuleCode] = React.useState(initialRule?.ruleCode ?? '');
  const [isActive, setIsActive] = React.useState(initialRule?.isActive ?? true);
  const [stopProcessing, setStopProcessing] = React.useState(initialRule?.stopProcessing ?? false);
  const [ruleScopeId, setRuleScopeId] = React.useState(initialRule?.ruleScopeId ?? 0);
  const [ruleCategory, setRuleCategory] = React.useState(initialRule?.ruleCategory ?? '');
  const [ruleDescription, setRuleDescription] = React.useState(initialRule?.description ?? '');
  const [priority, setPriority] = React.useState<number | undefined>(initialRule?.priority);
  const [propertyRuleEvaluationMasterId, setPropertyRuleEvaluationMasterId] = React.useState<number | undefined>(
    initialRule?.propertyRuleEvaluationMasterId
  );

  const [targetFilters, setTargetFilters] = React.useState<TargetFilterState>(
    () => safeParse<TargetFilterState>(initialRule?.targetFiltersJson, {})
  );

  const {
    rulesList, setRulesList,
    addRuleBlock, removeRuleBlock, moveRuleBlock, updateRuleBlock,
    updateBlockEffect, addEffectToBlock, removeEffectFromBlock,
  } = useRuleBlocks(initialRule);

  const { fields, setFields } = useRuleFieldsConfig({
    ruleScopeId,
    initialFields,
    onFetchFields,
  });

  const currentData = React.useMemo(() => {
    return JSON.stringify({
      ruleName: ruleName.trim(),
      ruleCategory,
      description: ruleDescription.trim(),
      priority,
      ruleScopeId,
      propertyRuleEvaluationMasterId,
      rulesList,
      isActive,
      stopProcessing,
    });
  }, [ruleName, ruleCategory, ruleDescription, priority, ruleScopeId, propertyRuleEvaluationMasterId, rulesList, isActive, stopProcessing]);

  const currentDataRef = React.useRef(currentData);
  React.useEffect(() => {
    currentDataRef.current = currentData;
  }, [currentData]);

  const [savedSnapshot, setSavedSnapshot] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSavedSnapshot((prev) => (prev === null ? currentDataRef.current : prev));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const hasChanges = savedSnapshot !== null && currentData !== savedSnapshot;

  const [isReasonOpen, setIsReasonOpen] = React.useState(false);
  const [changeReason, setChangeReason] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const activeScopeName = React.useMemo(() => {
    const s = scopes.find((x) => x.id === ruleScopeId);
    return s ? s.scopeName : '';
  }, [scopes, ruleScopeId]);

  const handleSaveClick = () => {
    if (!hasChanges) {
      toast.error(t('builder.noChanges'));
      return;
    }
    const errorMsg = validateRuleBuilder(ruleName, ruleCategory, rulesList, t);
    if (errorMsg) { toast.error(errorMsg); return; }
    setChangeReason('');
    setIsReasonOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!changeReason.trim()) {
      toast.error(t('validation.changeReasonRequired') || 'Please enter a change reason');
      return;
    }
    if (!ruleName.trim()) {
      toast.error(t('validation.ruleNameRequired'));
      return;
    }
    if (isSaving) return;

    setIsReasonOpen(false);
    setIsSaving(true);

    try {
      const firstOverride = rulesList[0]?.effects[0]?.overrideRate;
      const derivedEvalMasterId = firstOverride !== undefined && !isNaN(Number(firstOverride))
        ? Number(firstOverride)
        : undefined;

      const payload: RuleItem = {
        id: currentRuleId ?? initialRule?.id,
        ruleName: ruleName.trim(),
        ruleCode,
        isActive,
        ruleScopeId,
        propertyRuleEvaluationMasterId: propertyRuleEvaluationMasterId ?? derivedEvalMasterId ?? 0,
        conditionsJson: JSON.stringify(
          rulesList.map((block) => {
            const { effect: _effect, ...cleanBlock } = block;
            return {
              ...cleanBlock,
              ruleScopeName: activeScopeName,
            };
          })
        ),
        effectJson: JSON.stringify(rulesList[0]?.effects || []),
        targetFiltersJson: JSON.stringify(targetFilters),
        description: ruleDescription.trim(),
        ruleCategory,
        changeReason: changeReason.trim(),
        priority: priority,
        stopProcessing,
      };
      const res = await onSaveRule(payload);
      if (res.success) {
        toast.success(t('validation.saveSuccess'));
        setSavedSnapshot(currentData);
        if (res.data?.id) {
          setCurrentRuleId(res.data.id);
          window.history.replaceState(null, '', `/${locale}/property-tax/rule-engine/${res.data.id}`);
        }
      } else {
        toast.error(res.message || t('validation.saveFailure'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    ruleName, setRuleName,
    ruleCode, setRuleCode,
    isActive, setIsActive,
    stopProcessing, setStopProcessing,
    ruleScopeId, setRuleScopeId,
    propertyRuleEvaluationMasterId, setPropertyRuleEvaluationMasterId,
    ruleCategory, setRuleCategory,
    ruleDescription, setRuleDescription,
    priority, setPriority,
    targetFilters, setTargetFilters,
    rulesList, setRulesList,
    fields, setFields,
    isReasonOpen, setIsReasonOpen, changeReason, setChangeReason,
    activeScopeName, handleSaveClick, handleConfirmSave,
    isSaving, currentData, hasChanges,
    addRuleBlock, removeRuleBlock, moveRuleBlock, updateRuleBlock,
    updateBlockEffect, addEffectToBlock, removeEffectFromBlock,
  };
}
