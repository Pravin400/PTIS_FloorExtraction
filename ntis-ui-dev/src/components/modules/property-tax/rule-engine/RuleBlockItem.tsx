'use client';


import { Pencil, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FieldConfig, RuleBlock, EffectTypeConfig, ConditionGroupState, EffectState } from '@/types/rule-engine';
import { Input, ToggleSwitch } from '@/components/common';
import ConditionGroup from './ConditionGroup';
import EffectPanel from './EffectPanel';
import RuleBlockControls from './RuleBlockControls';

interface RuleBlockItemProps {
  ruleBlock: RuleBlock;
  index: number;
  isCollapsed: boolean;
  totalBlocks: number;
  fields: FieldConfig[];
  effectTypes: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  effectTypeConfigs: EffectTypeConfig[];
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
  onToggleCollapse: () => void;
}

export default function RuleBlockItem({
  ruleBlock,
  index,
  isCollapsed,
  totalBlocks,
  fields,
  effectTypes,
  categoryOptions,
  effectTypeConfigs,
  onRemoveRuleBlock,
  onMoveRuleBlock,
  onUpdateRuleBlock,
  onUpdateBlockEffect,
  onAddEffectToBlock,
  onRemoveEffectFromBlock,
  onToggleCollapse,
}: RuleBlockItemProps) {
  const t = useTranslations('ruleEngine');
  const effects = ruleBlock.effects || (ruleBlock.effect ? [ruleBlock.effect] : []);

  return (
    <div className={`border border-zinc-200 bg-zinc-50/10 p-3.5 rounded-xl flex flex-col gap-3 relative shadow-sm hover:shadow-md transition-all ${!isCollapsed ? 'z-10' : 'z-0'}`}>
      
      {/* Rule block header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-3 flex-grow w-full sm:w-auto">
          <span className="text-sm font-bold text-blue-800 shrink-0">{t('builder.ruleIndex', { index: index + 1 })}</span>
          
          <div className="flex items-center gap-2 flex-grow sm:flex-1 min-w-[180px]">
            <span className="text-[13px] font-semibold text-zinc-500 shrink-0">{t('targetFilter.description')}:</span>
            <div className="flex-grow">
              <Input
                value={ruleBlock.description}
                onChange={(e) => onUpdateRuleBlock(index, 'description', e.target.value)}
                placeholder={t('targetFilter.descriptionPlaceholder')}
                fullWidth
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <RuleBlockControls
              index={index}
              totalBlocks={totalBlocks}
              onMoveRuleBlock={onMoveRuleBlock}
              onRemoveRuleBlock={onRemoveRuleBlock}
            />

            {/* Edit Rule — only shown when collapsed */}
            {isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-all"
                title="Edit Rule"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{t('builder.editRule')}</span>
              </button>
            )}

            {/* Collapse / Expand chevron — always visible */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-all"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed
                ? <ChevronDown className="w-4 h-4 text-zinc-500" />
                : <ChevronUp className="w-4 h-4 text-zinc-500" />}
            </button>
          </div>
        </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="flex flex-col gap-4 border-t border-zinc-100 pt-3">
          {/* Conditions Group */}
          <ConditionGroup
            group={ruleBlock.conditions}
            fields={fields}
            onChange={(updatedConditions) => onUpdateRuleBlock(index, 'conditions', updatedConditions)}
          />

          {/* Effects Section */}
          <div className="flex flex-col gap-3.5 bg-zinc-50/50 p-3 rounded-xl border border-zinc-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-zinc-600 uppercase tracking-wide">
                {t('effectPanel.outcomeActions') || 'Outcome Actions'}
              </span>
              <button
                type="button"
                onClick={() => onAddEffectToBlock(index)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-850 px-2.5 py-1 rounded bg-white border border-indigo-100 hover:bg-indigo-50 transition duration-150"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('effectPanel.addEffect') || 'Add Effect'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {effects.map((eff, effIdx) => (
                <div 
                  key={`${ruleBlock.id}-eff-${effIdx}`} 
                  className="relative p-4 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 transition duration-150 flex flex-col"
                >
                  {effects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveEffectFromBlock(index, effIdx)}
                      className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-red-50 text-red-500 border border-transparent hover:border-red-200 transition duration-150"
                      title="Remove outcome action"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {effects.length > 1 && (
                    <span className="text-[11px] font-black text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded w-fit mb-2.5">
                      {t('effectPanel.actionIndex', { index: effIdx + 1 }) || `Action #${effIdx + 1}`}
                    </span>
                  )}

                  <EffectPanel
                    effect={eff}
                    onChange={(updatedEffect) => onUpdateBlockEffect(index, effIdx, updatedEffect)}
                    effectTypes={effectTypes}
                    categoryOptions={categoryOptions}
                    effectTypeConfigs={effectTypeConfigs}
                  />
                </div>
              ))}
            </div>

            {/* Single Block-level Stop Processing configuration */}
            <div className="pt-3 border-t border-zinc-200 flex items-center gap-3">
              <div className={`inline-flex items-center gap-3.5 px-3 py-1.5 rounded-lg border transition-all duration-200 w-fit ${
                ruleBlock.stopProcessing ? 'bg-amber-50/70 border-amber-200/80 shadow-sm' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <span className="text-xs font-bold text-zinc-800 select-none">{t('stopProcessing.toggleLabel')}</span>
                <ToggleSwitch
                  checked={ruleBlock.stopProcessing || false}
                  onChange={(checked) => onUpdateRuleBlock(index, 'stopProcessing', checked)}
                  showPopup={false}
                />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded border transition-colors ${
                ruleBlock.stopProcessing ? 'text-amber-800 bg-amber-50 border-amber-200 shadow-sm' : 'text-emerald-800 bg-emerald-50 border-emerald-200 shadow-sm'
              }`}>
                {ruleBlock.stopProcessing ? t('stopProcessing.activeNotice') : t('stopProcessing.inactiveNotice')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
