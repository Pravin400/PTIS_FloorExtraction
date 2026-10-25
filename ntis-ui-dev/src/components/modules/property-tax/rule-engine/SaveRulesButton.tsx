'use client';

import { PlusCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/common';

interface SaveRulesButtonProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export default function SaveRulesButton({ hasChanges, isSaving, onSave }: SaveRulesButtonProps) {
  const t = useTranslations('ruleEngine');
  const toast = useToast();

  const handleClick = () => {
    if (isSaving) return;
    if (!hasChanges) {
      toast.error(t('builder.noChanges'));
      return;
    }
    onSave();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSaving}
      className={[
        'relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm border border-transparent',
        isSaving
          ? 'bg-emerald-500 opacity-70 cursor-not-allowed'
          : hasChanges
            ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer ring-2 ring-emerald-300 ring-offset-1'
            : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer opacity-75',
      ].join(' ')}
    >
      {/* Pulsing dot — visible only when there are unsaved changes */}
      {hasChanges && !isSaving && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 border border-white animate-pulse" />
      )}
      {isSaving
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('builder.saving')}</>
        : <><PlusCircle className="w-3.5 h-3.5" />{t('builder.saveRules')}</>
      }
    </button>
  );
}
