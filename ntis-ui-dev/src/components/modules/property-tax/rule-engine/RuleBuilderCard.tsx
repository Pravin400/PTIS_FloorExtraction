'use client';

import React from 'react';
import { PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FieldConfig, RuleBlock, EffectTypeConfig, ConditionGroupState, EffectState } from '@/types/rule-engine';
import RuleBlockItem from './RuleBlockItem';
import SaveRulesButton from './SaveRulesButton';

interface RuleBuilderCardProps {
  activeScopeName: string;
  handleSaveClick: () => void;
  isSaving: boolean;
  hasChanges: boolean;
  isEdit: boolean;
  rulesList: RuleBlock[];
  fields: FieldConfig[];
  effectTypes: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  effectTypeConfigs: EffectTypeConfig[];
  onAddRuleBlock: () => void;
  onRemoveRuleBlock: (index: number) => void;
  onMoveRuleBlock: (index: number, direction: 'up' | 'down') => void;
  onUpdateRuleBlock: (
    index: number,
    key: 'conditions' | 'effect' | 'effects' | 'description' | 'stopProcessing',
    value: ConditionGroupState | EffectState | RuleBlock['effects'] | string | boolean
  ) => void;
  onUpdateBlockEffect: (blockIndex: number, effectIndex: number, updatedEffect: EffectState) => void;
  onAddEffectToBlock: (blockIndex: number) => void;
  onRemoveEffectFromBlock: (blockIndex: number, effectIndex: number) => void;
}

/** The main IF/THEN card container: card header and rule configurator panel. */
export default function RuleBuilderCard({
  activeScopeName, handleSaveClick, isSaving, hasChanges, isEdit,
  rulesList, fields,
  effectTypes, categoryOptions, effectTypeConfigs,
  onAddRuleBlock, onRemoveRuleBlock, onMoveRuleBlock, onUpdateRuleBlock,
  onUpdateBlockEffect, onAddEffectToBlock, onRemoveEffectFromBlock,
}: RuleBuilderCardProps) {
  const t = useTranslations('ruleEngine');
  const [collapsedBlocks, setCollapsedBlocks] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    rulesList.forEach((block) => {
      initial[block.id] = isEdit;
    });
    return initial;
  });

  const prevLengthRef = React.useRef(rulesList.length);

  React.useEffect(() => {
    if (rulesList.length > prevLengthRef.current) {
      // Collapse all existing blocks and expand the newly added one
      const newCollapsedBlocks: Record<string, boolean> = {};
      rulesList.forEach((block, index) => {
        if (index === rulesList.length - 1) {
          newCollapsedBlocks[block.id] = false; // expanded
        } else {
          newCollapsedBlocks[block.id] = true; // collapsed
        }
      });
      setCollapsedBlocks(newCollapsedBlocks);
    }
    prevLengthRef.current = rulesList.length;
  }, [rulesList]);

  const toggleCollapse = (id: string) => {
    setCollapsedBlocks((prev) => {
      const current = prev[id] !== false;
      return {
        ...prev,
        [id]: !current,
      };
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm mt-1.5 flex flex-col lg:h-full lg:overflow-hidden">

      {/* Card header */}
      <div className="bg-[#dcf0fa]/60 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">{t('builder.title', { scopeName: activeScopeName })}</span>
        <div className="flex items-center gap-2">
          <SaveRulesButton
            hasChanges={hasChanges}
            isSaving={isSaving}
            onSave={handleSaveClick}
          />
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 flex flex-col gap-4 flex-grow lg:min-h-0 lg:overflow-hidden">
        
        {/* Rules list */}
        <div className="flex flex-col gap-4 flex-grow overflow-y-auto pr-1.5">
          {rulesList.map((ruleBlock, index) => {
            const isCollapsed = collapsedBlocks[ruleBlock.id] ?? isEdit;

            return (
              <RuleBlockItem
                key={`${ruleBlock.id}-${index}`}
                ruleBlock={ruleBlock}
                index={index}
                isCollapsed={isCollapsed}
                totalBlocks={rulesList.length}
                fields={fields}
                effectTypes={effectTypes}
                categoryOptions={categoryOptions}
                effectTypeConfigs={effectTypeConfigs}
                onRemoveRuleBlock={onRemoveRuleBlock}
                onMoveRuleBlock={onMoveRuleBlock}
                onUpdateRuleBlock={onUpdateRuleBlock}
                onUpdateBlockEffect={onUpdateBlockEffect}
                onAddEffectToBlock={onAddEffectToBlock}
                onRemoveEffectFromBlock={onRemoveEffectFromBlock}
                onToggleCollapse={() => toggleCollapse(ruleBlock.id)}
              />
            );
          })}
        </div>

        {/* Add Rule Button */}
        <button
          type="button"
          onClick={onAddRuleBlock}
          className="flex items-center justify-center gap-2 w-fit px-8 py-2.5 border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 rounded-xl text-zinc-600 hover:text-zinc-800 transition-all font-semibold text-xs cursor-pointer self-center shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" /> {t('library.addRule')}
        </button>

      </div>
    </div>
  );
}
