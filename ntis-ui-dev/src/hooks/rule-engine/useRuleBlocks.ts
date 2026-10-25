import React from 'react';
import { RuleItem, RuleBlock } from '@/types/rule-engine';
import { initializeRulesList, safeUUID } from './useRuleBuilderHelpers';

/**
 * Custom hook to manage RuleBlock list operations and state mutations.
 */
export function useRuleBlocks(initialRule?: RuleItem) {
  const [rulesList, setRulesList] = React.useState<RuleBlock[]>(() =>
    initializeRulesList(initialRule)
  );

  const addRuleBlock = () => {
    setRulesList((prev) => [
      ...prev,
      {
        id: safeUUID(),
        description: '',
        conditions: { id: safeUUID(), logicalOperator: 'AND', conditions: [], groups: [] },
        effects: [{ effectType: '', value: '', isPercentage: true }],
        effect: { effectType: '', value: '', isPercentage: true },
      },
    ]);
  };

  const removeRuleBlock = (index: number) => {
    setRulesList((prev) => prev.filter((_, i) => i !== index));
  };

  const moveRuleBlock = (index: number, direction: 'up' | 'down') => {
    setRulesList((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const updateRuleBlock = (
    index: number,
    key: 'conditions' | 'effect' | 'effects' | 'description' | 'stopProcessing',
    value: RuleBlock['conditions'] | RuleBlock['effect'] | RuleBlock['effects'] | string | boolean
  ) => {
    setRulesList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value } as RuleBlock;
      return copy;
    });
  };

  const updateBlockEffect = (
    blockIndex: number,
    effectIndex: number,
    updatedEffect: RuleBlock['effects'][number]
  ) => {
    setRulesList((prev) => {
      const copy = [...prev];
      const block = copy[blockIndex];
      if (block) {
        const effectsCopy = [...(block.effects || [])];
        effectsCopy[effectIndex] = updatedEffect;
        copy[blockIndex] = {
          ...block,
          effects: effectsCopy,
          effect: effectsCopy[0],
        };
      }
      return copy;
    });
  };

  const addEffectToBlock = (blockIndex: number) => {
    setRulesList((prev) => {
      const copy = [...prev];
      const block = copy[blockIndex];
      if (block) {
        const effectsCopy = [...(block.effects || []), { effectType: '', value: '', isPercentage: true }];
        copy[blockIndex] = {
          ...block,
          effects: effectsCopy,
          effect: effectsCopy[0],
        };
      }
      return copy;
    });
  };

  const removeEffectFromBlock = (blockIndex: number, effectIndex: number) => {
    setRulesList((prev) => {
      const copy = [...prev];
      const block = copy[blockIndex];
      if (block) {
        const effectsCopy = (block.effects || []).filter((_, i) => i !== effectIndex);
        copy[blockIndex] = {
          ...block,
          effects: effectsCopy.length > 0 ? effectsCopy : [{ effectType: '', value: '', isPercentage: true }],
          effect: effectsCopy[0],
        };
      }
      return copy;
    });
  };

  return {
    rulesList,
    setRulesList,
    addRuleBlock,
    removeRuleBlock,
    moveRuleBlock,
    updateRuleBlock,
    updateBlockEffect,
    addEffectToBlock,
    removeEffectFromBlock,
  };
}
