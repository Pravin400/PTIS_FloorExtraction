'use client';

import React from 'react';
import { Eye, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/common/Drawer';
import { FieldConfig, RuleItem, RuleBlock } from '@/types/rule-engine';
import { initializeRulesList } from '@/hooks/rule-engine/useRuleBuilderHelpers';
import { formatEffectPhrase } from '@/hooks/rule-engine/useRuleLibraryHelpers';
import { fetchFieldsForScopeAction, fetchEffectTypeConfigsAction, fetchDynamicFieldOptionsAction } from '@/app/[locale]/property-tax/rule-engine/actions';
import RenderConditionGroup from './RuleViewConditionGroup';

interface RuleViewDrawerProps {
  rule: RuleItem | null;
  open: boolean;
  onClose: () => void;
  scopeName?: string;
}

export default function RuleViewDrawer({ rule, open, onClose, scopeName }: RuleViewDrawerProps) {
  const t = useTranslations('ruleEngine');
  const [fields, setFields] = React.useState<FieldConfig[]>([]);
  const [paramOptions, setParamOptions] = React.useState<Record<string, string>>({});

  const ruleBlocks = React.useMemo<RuleBlock[]>(() => {
    if (!rule) return [];
    return initializeRulesList(rule);
  }, [rule]);

  React.useEffect(() => {
    if (open && rule?.ruleScopeId) {
      let active = true;
      fetchFieldsForScopeAction(rule.ruleScopeId)
        .then((list) => { if (active) setFields(list); })
        .catch(() => {});
      return () => {
        active = false;
        setFields([]);
      };
    }
  }, [open, rule?.ruleScopeId]);

  React.useEffect(() => {
    if (open && rule && ruleBlocks.length > 0) {
      let active = true;
      fetchEffectTypeConfigsAction()
        .then(async (configs) => {
          if (!active) return;
          const uniqueTypes = Array.from(
            new Set(
              ruleBlocks
                .flatMap((b) => (b.effects && b.effects.length > 0 ? b.effects : b.effect ? [b.effect] : []))
                .map((e) => e.effectType)
                .filter(Boolean)
            )
          );
          const newMap: Record<string, string> = {};

          for (const type of uniqueTypes) {
            const cfg = configs.find((c) => c.effectType === type);
            if (cfg?.staticApiEndpoint) {
              const opts = await fetchDynamicFieldOptionsAction(
                cfg.staticApiEndpoint,
                cfg.staticApiMethod ?? 'GET',
                cfg.staticApiParamter ?? undefined,
                cfg.staticApiResponseMapping ?? undefined
              );
              opts.forEach((opt) => {
                newMap[opt.value] = opt.label;
              });
            }
          }
          if (active) {
            setParamOptions((prev) => ({ ...prev, ...newMap }));
          }
        })
        .catch(() => {});

      return () => {
        active = false;
        setParamOptions({});
      };
    }
  }, [open, rule, ruleBlocks]);

  if (!rule) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center gap-2 text-[#1E3A8A] font-bold text-base">
          <Eye className="w-4 h-4 text-blue-600 stroke-[2.5]" />
          <span>{t('simulation.viewRuleTitle', { code: rule.ruleCode })}</span>
        </div>
      }
    >
      {open && (
        <div className="flex flex-col gap-3 p-3 bg-[#F8FAFF] min-h-[calc(100vh-56px)] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">{t('simulation.ruleCode')}</span>
              <span className="text-sm font-bold text-slate-800">{rule.ruleCode}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">{t('simulation.ruleName')}</span>
              <span className="text-sm font-bold text-slate-800">{rule.ruleName}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">{t('simulation.category')}</span>
              <span className="text-sm font-bold text-slate-800">{rule.ruleCategory}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block">{t('simulation.scope')}</span>
              <span className="text-sm font-bold text-slate-800">{scopeName || `Scope ID: ${rule.ruleScopeId}`}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {ruleBlocks.map((block, idx) => (
              <div
                key={`${block.id}-${idx}`}
                className="bg-white px-3 py-2.5 rounded-lg border border-zinc-200 shadow-sm flex flex-col gap-2 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-1.5">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                    {t('simulation.ruleIndex', { index: idx + 1 })}
                  </span>
                  <span className="text-sm font-semibold text-slate-600 truncate">
                    {block.description || t('simulation.noDescription')}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('simulation.conditions')}</span>
                  {(!block.conditions || (block.conditions.conditions.length === 0 && block.conditions.groups.length === 0)) ? (
                    <div className="text-xs text-gray-400 italic pl-3">{t('simulation.noConditions')}</div>
                  ) : (
                    <RenderConditionGroup group={block.conditions} fields={fields} />
                  )}
                </div>

                <div className="flex flex-col gap-2 bg-slate-50/60 px-3 py-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('simulation.outcomeAction')}</span>
                    {block.stopProcessing && (
                      <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-200">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{t('simulation.stopProcessingText')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5 pl-2 border-l border-slate-200">
                    {(block.effects && block.effects.length > 0 ? block.effects : (block.effect ? [block.effect] : [])).map((eff, effIdx, effArr) => {
                      const phrase = formatEffectPhrase(eff, paramOptions);

                      return (
                        <div key={`${block.id}-eff-${effIdx}`} className="flex items-center gap-2 text-sm text-slate-800">
                          {effArr.length > 1 && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1 rounded select-none">
                              #{effIdx + 1}
                            </span>
                          )}
                          <span className="font-semibold text-slate-800">
                            {phrase}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
