import { CheckCircle2 } from 'lucide-react';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';
import type { TranslatorFunction } from '@/types/typeOfUse.types';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface SubTypeStatusSectionProps {
  isActive: boolean;
  onToggle: () => void;
  t: TranslatorFunction;
}

export function SubTypeStatusSection({ isActive, onToggle, t }: SubTypeStatusSectionProps) {
  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">
              {t('subtype.fields.status')}
            </div>
            <div className="text-sm text-slate-500">
              {t('subtype.title', { subTypeOfUse: subTypeOfUseLabel })} {t('status.isCurrently')}{' '}
              <span
                className={
                  isActive ? 'text-emerald-700 font-medium' : 'text-slate-600 font-medium'
                }
              >
                {isActive ? t('status.active') : t('status.inactive')}
              </span>
            </div>
          </div>
        </div>
        <ToggleSwitch checked={isActive} onChange={onToggle} showPopup={false} />
      </div>
    </div>
  );
}
