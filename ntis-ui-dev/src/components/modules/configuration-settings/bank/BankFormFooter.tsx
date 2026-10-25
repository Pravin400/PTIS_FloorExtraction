'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/common/ActionButton';

interface BankFormFooterProps {
  isEdit: boolean;
  isSubmitting: boolean;
  bankName?: string;
  onCancel: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
  bankLabel?: string;
}

export function BankFormFooter({
  isEdit,
  isSubmitting,
  bankName,
  onCancel,
  t,
  tCommon,
  bankLabel,
}: BankFormFooterProps) {
  const values = bankLabel ? { bank: bankLabel } : undefined;

  return (
    <div className="w-full flex justify-between items-center px-6 py-4 border-t bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className={`w-2 h-2 rounded-full ${isEdit ? 'bg-blue-500' : 'bg-green-500'}`} />
        <span>
          {isEdit
            ? t('drawer.footer.editing', { bankName: bankName ?? '' })
            : t('drawer.footer.adding', values)}
        </span>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {tCommon('buttons.cancel')}
        </Button>
        <Button type="submit" form="bank-form" isLoading={isSubmitting} disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isEdit ? t('drawer.buttons.update', values) : t('drawer.buttons.save', values)}
        </Button>
      </div>
    </div>
  );
}
