'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/common/ActionButton';
import { Tooltip } from '@/components/common/Tooltip';
import { DynamicIcon } from './FooterIconRegistry';
import type { FooterAction } from '@/lib/api/footer.service';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';

interface RightActionsProps {
  actions: FooterAction[];
  onActionClick: (command: string) => void;
  isLoading?: boolean;
  isActionPending?: boolean;
  clickedCommand?: string | null;
  iconOnly?: boolean;
}

export function RightActions({
  actions,
  onActionClick,
  isLoading = false,
  isActionPending = false,
  clickedCommand = null,
  iconOnly = false,
}: RightActionsProps) {
  const t = useTranslations('ptis');

  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {actions.map((action, index) => {
        const { id, actionCommand, buttonName, style, isEnabled, canView, haveNoAccess, haveFullAccess } = action;

        // Render according to permissions from API response
        const hasViewPermission = haveFullAccess || (canView !== false && !haveNoAccess);
        if (!hasViewPermission) {
          return null;
        }

        const iconName = style?.iconName;
        const variant = style?.variant || 'success';

        const localizedButtonName = t.has(`footerActions.${actionCommand}`)
          ? t(`footerActions.${actionCommand}`)
          : buttonName;

        const buttonClasses = cn(
          'text-[10px] h-8 sm:h-9 cursor-pointer rounded-lg transition-all duration-300 active:scale-95 shrink-0 flex flex-row items-center justify-center font-bold whitespace-nowrap shadow-sm border border-slate-200 bg-white/95 text-slate-700',
          iconOnly ? 'w-8 h-8 sm:w-9 sm:h-9 !p-0' : 'px-3 sm:px-4',
          
          variant === 'primary' || variant === 'blue'
            ? 'bg-gradient-to-r from-blue-700 to-indigo-900 text-white! border-transparent! hover:from-blue-800 hover:to-indigo-950 hover:shadow-[0_4px_12px_rgba(30,58,138,0.25)] hover:scale-[1.02]'
            : variant === 'danger'
            ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white! border-transparent! hover:from-red-700 hover:to-rose-800 hover:shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:scale-[1.02]'
            : variant === 'success'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white! border-transparent! hover:from-emerald-700 hover:to-teal-800 hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:scale-[1.02]'
            : variant === 'ghost'
            ? 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'
            : 'hover:border-blue-400/60 hover:bg-blue-50/20 hover:shadow-[0_4px_12px_rgba(59,130,246,0.08)] hover:scale-[1.02]'
        );

        const iconClasses = cn(
          'shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5',
          
          (variant === 'primary' || variant === 'blue' || variant === 'success' || variant === 'danger')
            ? 'text-white!'
            : (
              actionCommand.includes('DELETE') ? 'text-red-500!' :
              actionCommand.includes('SAVE') || actionCommand.includes('SUBMIT') || actionCommand.includes('APPLY') ? 'text-emerald-500!' :
              'text-[#1e3a8a]!'
            )
        );

        const key = `${actionCommand}-${id ?? index}`;
        const hasText = !!localizedButtonName;
        const isThisActionPending = Boolean(isActionPending && clickedCommand === actionCommand);
        const isThisButtonLoading = isThisActionPending;

        if (hasText && !iconOnly) {
          // If button has text + icon, render without Tooltip
          return (
            <Button
              key={key}
              variant="secondary"
              size="sm"
              onClick={() => onActionClick(actionCommand)}
              disabled={isLoading || isActionPending || !isEnabled}
              className={buttonClasses}
              aria-label={localizedButtonName}
            >
              <span className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-full group">
                {isThisButtonLoading ? (
                  <Loader2 size={16} className="animate-spin shrink-0 text-current" />
                ) : iconName && (
                  <DynamicIcon
                    name={iconName}
                    size={16}
                    className={iconClasses}
                  />
                )}
                <span className="truncate uppercase tracking-wider font-semibold text-[11px]">
                  {localizedButtonName}
                </span>
              </span>
            </Button>
          );
        }

        // Fallback in case of icon-only button in the right section
        return (
          <Tooltip
            key={key}
            content={
              <div className="flex flex-col gap-0.5 pointer-events-none">
                <span className="font-bold text-[11px] text-white">
                  {localizedButtonName}
                </span>
              </div>
            }
            placement="top"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onActionClick(actionCommand)}
              disabled={isLoading || isActionPending || !isEnabled}
              className={buttonClasses}
              aria-label={localizedButtonName}
            >
              <span className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 w-full group">
                {isThisButtonLoading ? (
                  <Loader2 size={16} className="animate-spin shrink-0 text-current" />
                ) : iconName && (
                  <DynamicIcon
                    name={iconName}
                    size={16}
                    className={iconClasses}
                  />
                )}
              </span>
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );
}
