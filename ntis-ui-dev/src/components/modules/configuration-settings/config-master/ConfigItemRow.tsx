'use client';

import { Shield, Calendar, Loader2 } from 'lucide-react';
import { Card, Badge, ToggleSwitch, useToast } from '@/components/common';
import { ConfigItemActions } from './ConfigItemActions';
import { ConfigItem } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { updateConfigItemAction } from '@/app/[locale]/configuration-settings/config-master/actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { highlightText } from './config-master-ui.utils';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';
import { DateUtils } from '@/lib/utils/date-helpers';

interface ConfigItemRowProps {
  item: ConfigItem;
  searchTerm?: string;
  locale: string;
}

export function ConfigItemRow({ item, searchTerm = '' }: ConfigItemRowProps) {
  const t = useTranslations('configMaster');
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();

  const { canEdit, canDelete, haveFullAccess } = useActivePagePermissions();
  const showToggle = canEdit || canDelete || haveFullAccess;

  const handleToggle = () => {
    const newValue = !item.isEnabled;

    startTransition(async () => {
      const result = await updateConfigItemAction({
        id: item.id,
        configKeyId: item.configKeyId,
        value: newValue,
        isKey: true,
      });

      if (result.success) {
        success(result.message || '');
        router.refresh();
      } else {
        toastError(result.error || '');
      }
    });
  };

  return (
    <Card
      className={cn(
        'group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 gap-3 overflow-visible h-full',
        item.isEnabled
          ? 'bg-white border-emerald-100/80 shadow-sm hover:shadow-md hover:border-emerald-200'
          : 'bg-slate-50/50 border-slate-200/60 shadow-none opacity-80 hover:opacity-100',
        isPending && 'pointer-events-none'
      )}
    >
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        {/* Header: Icon, Title & Badge */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'p-2 rounded-xl transition-all shrink-0 border mt-0.5',
              item.isEnabled
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/50'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            )}
          >
            <Shield className="w-4 h-4 transition-transform group-hover:scale-110" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                className={cn(
                  'font-bold text-sm leading-snug tracking-tight transition-colors break-words',
                  item.isEnabled ? 'text-slate-900' : 'text-slate-500'
                )}
                title={item.name}
              >
                {highlightText(item.name, searchTerm)}
              </span>
              <Badge
                variant={item.isEnabled ? 'success' : 'secondary'}
                size="sm"
                className={cn(
                  'h-4 py-0 px-1.5 text-[8px] font-black uppercase tracking-widest shrink-0',
                  !item.isEnabled && 'bg-slate-100 text-slate-400 border-slate-200'
                )}
              >
                {item.isEnabled ? t('list.on') : t('list.off')}
              </Badge>
            </div>

            {item.description && (
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 break-words [overflow-wrap:anywhere] leading-relaxed">
                {highlightText(item.description, searchTerm)}
              </p>
            )}
          </div>
        </div>

        {/* Current Value & Updated Date */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs font-medium mt-auto">
          <div className="flex items-center gap-1.5 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100/80">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              {t('list.currentValue') || 'Value'}
            </span>
            <span className="text-xs font-bold text-indigo-700 break-all">
              {(() => {
                const val = item.value || item.defaultValue || '';
                const control = (item.controlType || '').toLowerCase();
                if (val === 'true') return t('list.on') || 'ON';
                if (val === 'false') return t('list.off') || 'OFF';
                if (val !== '' && val !== null && val !== undefined) {
                  const valStr = String(val);
                  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(valStr)
                    ? valStr.replace('T', ' ')
                    : valStr;
                }
                if (control === 'toggle' || control === 'checkbox') {
                  return item.isEnabled ? t('list.on') || 'ON' : t('list.off') || 'OFF';
                }
                return '-';
              })()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="uppercase tracking-tight">
              {DateUtils.formatDisplayDate(item.updatedDate || item.createdDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Action Area */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto min-h-[44px]">
        {isPending ? (
          <div className="w-full flex items-center justify-center py-0.5">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100/80 shadow-2xs">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider animate-pulse">
                {t('messages.savingConfig') || 'Saving...'}
              </span>
            </div>
          </div>
        ) : (
          <>
            <ConfigItemActions
              id={item.id}
              configKeyId={item.configKeyId}
              isEnabled={item.isEnabled}
            />

            {showToggle && (
              <div className="flex items-center justify-center shrink-0">
                <ToggleSwitch
                  checked={item.isEnabled}
                  onChange={handleToggle}
                  showPopup={false}
                  disabled={isPending}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}