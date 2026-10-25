'use client';

import React from 'react';
import { Accordion, AccordionItemType } from '@/components/common/accordion';
import { AccessLevel } from '@/types/screen-access.types';
import {
  DisplayDepartment,
  DisplayScreen,
  DisplayDomain,
} from '@/hooks/configuration-settings/screenAccess/usePermissionHierarchy';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type AccessLevelConfigItem = {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  badgeClass: string;
};

type AccessLevelConfigMap = Record<string, AccessLevelConfigItem>;

type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string;

interface PermissionAccordionProps {
  hierarchy: DisplayDepartment[];
  roleAccess: Record<string, AccessLevel>;
  accessLevelConfig: AccessLevelConfigMap;
  onUpdate: (screenId: string, level: AccessLevel) => void;
  onBulkDomain: (screens: DisplayScreen[], level: AccessLevel) => void;
  onBulkDept: (dept: DisplayDepartment, level: AccessLevel) => void;
}

const ModuleAccordionItem = ({
  domain,
  roleAccess,
  accessLevelConfig,
  t,
  onUpdate,
  onBulkDomain,
}: {
  domain: DisplayDomain;
  roleAccess: Record<string, AccessLevel>;
  accessLevelConfig: AccessLevelConfigMap;
  t: TranslateFn;
  onUpdate: (screenId: string, level: AccessLevel) => void;
  onBulkDomain: (screens: DisplayScreen[], level: AccessLevel) => void;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const accessLevelEntries = Object.entries(accessLevelConfig) as [string, AccessLevelConfigItem][];
  const moduleInactive = domain.isModuleActive === false;

  const screenLabel = useAliasLabel('Screen', t('aliasFallback.screen'));
  const moduleLabel = useAliasLabel('Module', t('aliasFallback.module'));
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));

  // Screens List grouped by screenGroupName
  const groupedScreens = React.useMemo(() => {
    const groups: { groupName: string; screens: DisplayScreen[] }[] = [];
    const groupMap = new Map<string, DisplayScreen[]>();

    domain.screens.forEach((screen) => {
      const gName = screen.screenGroupName?.trim() || '';
      if (!groupMap.has(gName)) {
        groupMap.set(gName, []);
      }
      groupMap.get(gName)!.push(screen);
    });

    groupMap.forEach((screens, groupName) => {
      groups.push({ groupName, screens });
    });

    return groups.sort((a, b) => {
      if (!a.groupName) return 1;
      if (!b.groupName) return -1;
      return a.groupName.localeCompare(b.groupName);
    });
  }, [domain.screens]);

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden shadow-sm mx-2',
        moduleInactive ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white'
      )}
    >
      {/* Module Header */}
      <div
        className={cn(
          'flex items-center justify-between px-6 sm:px-8 md:px-16 py-3 border-b cursor-pointer transition-colors',
          moduleInactive
            ? 'bg-amber-50 border-amber-100 hover:bg-amber-100/60'
            : 'bg-gray-50/50 border-gray-100 hover:bg-gray-100/50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <ChevronRight
            className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-90')}
          />
          <span className="font-bold text-sm text-gray-800">{domain.name}</span>
          <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded border border-gray-200">
            {t('accessControl.labels.screenCount', {
              count: domain.screens.length,
              screen: screenLabel,
            })}
          </span>
          {moduleInactive && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded border border-amber-200">
              {t('accessControl.labels.moduleInactive', { module: moduleLabel })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {accessLevelEntries.map(([level, cfg]) => (
            <button
              type="button"
              key={level}
              onClick={() => onBulkDomain(domain.screens, level as AccessLevel)}
              className={cn(
                'flex items-center justify-center w-6 h-6 rounded border opacity-60 hover:opacity-100 transition-all bg-white',
                level === 'no-access'
                  ? 'text-red-500 border-red-200'
                  : level === 'view'
                    ? 'text-blue-500 border-blue-200'
                    : level === 'edit'
                      ? 'text-amber-500 border-amber-200'
                      : level === 'delete'
                        ? 'text-purple-500 border-purple-200'
                        : 'text-emerald-500 border-emerald-200'
              )}
              title={t('accessControl.actions.applyToAll', { level: cfg.label })}
              aria-label={t('accessControl.actions.applyToAll', { level: cfg.label })}
            >
              <cfg.icon className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      {moduleInactive && (
        <div className="px-6 sm:px-8 md:px-16 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">
          {t('accessControl.labels.moduleInactiveHint', {
            module: moduleLabel,
            department: departmentLabel,
            screen: screenLabel,
          })}
        </div>
      )}

      {/* Screens List grouped by Screen Groups */}
      <div className={cn('p-3 space-y-4', !isExpanded && 'hidden')}>
        {groupedScreens.map((group) => (
          <div key={group.groupName || 'unassigned'} className="space-y-2">
            {/* Screen Group Section Title */}
            <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100/50 rounded-md border border-slate-200/40 flex items-center justify-between">
              <span>{group.groupName || t('accessControl.domains.general')}</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-250 text-slate-600 rounded-full font-medium">
                {t('accessControl.labels.screenCount', {
                  count: group.screens.length,
                  screen: screenLabel,
                })}
              </span>
            </div>

            {/* Screen Items under this group */}
            <div className="space-y-2">
              {group.screens.map((screen: DisplayScreen) => {
                const currentLevel = roleAccess[screen.id] || 'no-access';
                const effectiveLevel = moduleInactive ? 'no-access' : currentLevel;

                return (
                  <div
                    key={screen.id}
                    className={cn(
                      'flex items-center justify-between px-6 sm:px-8 md:px-16 py-2.5 border rounded-lg transition-colors',
                      moduleInactive
                        ? 'bg-amber-50/50 border-amber-200/80'
                        : 'bg-emerald-50/30 border-emerald-200/60 hover:border-emerald-300'
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-700">{screen.name}</span>
                      {moduleInactive && currentLevel !== 'no-access' && (
                        <span className="text-[11px] text-amber-700">
                          {t('accessControl.labels.assignedAccessPreserved', {
                            level: accessLevelConfig[currentLevel]?.label ?? currentLevel,
                            module: moduleLabel,
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {accessLevelEntries.map(([level, levelCfg]) => {
                        const isActive = currentLevel === level;
                        const isEffective = effectiveLevel === level;
                        return (
                          <button
                            type="button"
                            key={level}
                            onClick={() => onUpdate(screen.id, level as AccessLevel)}
                            className={cn(
                              'flex items-center justify-center w-7 h-7 rounded-md border transition-all',
                              isActive
                                ? cn(
                                    'border-transparent shadow-sm ring-2 ring-offset-1 text-white',
                                    moduleInactive && 'opacity-70 ring-amber-200',
                                    level === 'no-access'
                                      ? 'bg-red-500 ring-red-200'
                                      : level === 'view'
                                        ? 'bg-blue-500 ring-blue-200'
                                        : level === 'edit'
                                          ? 'bg-amber-500 ring-amber-200'
                                          : level === 'delete'
                                            ? 'bg-purple-500 ring-purple-200'
                                            : 'bg-emerald-500 ring-emerald-200'
                                  )
                                : cn(
                                    'bg-white hover:bg-gray-50',
                                    level === 'no-access'
                                      ? 'text-red-500 border-red-200'
                                      : level === 'view'
                                        ? 'text-blue-500 border-blue-200'
                                        : level === 'edit'
                                          ? 'text-amber-500 border-amber-200'
                                          : level === 'delete'
                                            ? 'text-purple-500 border-purple-200'
                                            : 'text-emerald-500 border-emerald-200'
                                  ),
                              moduleInactive && !isActive && 'opacity-60'
                            )}
                            title={
                              moduleInactive && isActive
                                ? t('accessControl.labels.storedPermissionHint', {
                                    level: levelCfg.label,
                                    module: moduleLabel,
                                  })
                                : levelCfg.label
                            }
                            aria-label={levelCfg.label}
                          >
                            <levelCfg.icon
                              className={cn(
                                'w-3.5 h-3.5',
                                moduleInactive &&
                                  isEffective &&
                                  level === 'no-access' &&
                                  'opacity-100'
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PermissionAccordion: React.FC<PermissionAccordionProps> = ({
  hierarchy,
  roleAccess,
  accessLevelConfig,
  onUpdate,
  onBulkDomain,
  onBulkDept,
}) => {
  const t = useTranslations('screenAccess');
  const screenLabel = useAliasLabel('Screen', t('aliasFallback.screen'));

  const accordionItems: AccordionItemType[] = hierarchy.map((dept) => {
    // Calculate total screens in dept
    const totalScreens = dept.domains.reduce((acc, dom) => acc + dom.screens.length, 0);

    // Calculate full and none counts
    let fullCount = 0;
    let noneCount = 0;
    dept.domains.forEach((domain) => {
      domain.screens.forEach((screen) => {
        const level = roleAccess[screen.id] || 'no-access';
        if (level === 'no-access') noneCount++;
        else if (level === 'full') fullCount++;
      });
    });

    return {
      title: (
        <div className="flex items-center justify-between w-full pr-4 group py-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-600 text-white rounded-lg transition-colors">
              <dept.icon className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-800">{dept.name}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md border border-gray-200">
              {t('accessControl.labels.screenCount', { count: totalScreens, screen: screenLabel })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded border border-red-200">
                {t('accessControl.labels.noneCount', { count: noneCount > 0 ? noneCount : '' })}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded border border-green-200">
                {t('accessControl.labels.fullCount', { count: fullCount > 0 ? fullCount : '' })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
              {Object.entries(accessLevelConfig).map(([level, cfg]) => (
                <button
                  type="button"
                  key={level}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBulkDept(dept, level as AccessLevel);
                  }}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded border transition-all cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 bg-white',
                    level === 'no-access'
                      ? 'text-red-500 border-red-200 hover:border-red-300'
                      : level === 'view'
                        ? 'text-blue-500 border-blue-200 hover:border-blue-300'
                        : level === 'edit'
                          ? 'text-amber-500 border-amber-200 hover:border-amber-300'
                          : level === 'delete'
                            ? 'text-purple-500 border-purple-200 hover:border-purple-300'
                            : 'text-emerald-500 border-emerald-200 hover:border-emerald-300'
                  )}
                  title={t('accessControl.actions.applyToAll', { level: cfg.label })}
                  aria-label={t('accessControl.actions.applyToAll', { level: cfg.label })}
                >
                  <cfg.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
      content: (
        <div className="space-y-4 pt-4 pb-4">
          {dept.domains.map((domain: DisplayDomain) => (
            <ModuleAccordionItem
              key={domain.id}
              domain={domain}
              roleAccess={roleAccess}
              accessLevelConfig={accessLevelConfig}
              t={t}
              onUpdate={onUpdate}
              onBulkDomain={onBulkDomain}
            />
          ))}
        </div>
      ),
    };
  });

  return (
    <div className="space-y-4 pr-1 pb-10">
      <Accordion
        items={accordionItems}
        multiple
        defaultOpen={[0]}
        className="space-y-4 border-none divide-none"
      />
    </div>
  );
};
