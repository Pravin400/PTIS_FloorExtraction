'use client';

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common';

interface RetrospectiveRuleBuilderFooterProps {
  onSaveDraft: () => void;
  mode?: 'create' | 'edit';
  isDirty?: boolean;
}

export const RetrospectiveRuleBuilderFooter: React.FC<RetrospectiveRuleBuilderFooterProps> = memo(({
  onSaveDraft,
  mode = 'create',
  isDirty = true,
}) => {
  const t = useTranslations('retrospectiveRuleLibrary.builder.footer');
  const isEditMode = mode === 'edit';
  const isDisabled = isEditMode && !isDirty;

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-xs font-medium text-gray-500">
        {t('reviewText')}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <Button
          type="button"
          variant="success"
          icon={isEditMode ? RefreshCw : Save}
          onClick={onSaveDraft}
          disabled={isDisabled}
          className={`h-9 px-5 rounded-xl text-xs font-bold shadow-xs border-none transition-all ${
            isDisabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/80 shadow-none opacity-80'
              : 'bg-[#047857] hover:bg-[#0369a1] text-white cursor-pointer shadow-md hover:shadow-lg active:scale-95'
          }`}
        >
          {isEditMode ? t('update') : t('saveDraft')}
        </Button>
      </div>
    </div>
  );
});

RetrospectiveRuleBuilderFooter.displayName = 'RetrospectiveRuleBuilderFooter';


