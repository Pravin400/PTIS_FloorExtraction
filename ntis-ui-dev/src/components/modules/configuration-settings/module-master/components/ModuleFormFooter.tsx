'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/common/ActionButton';

interface ModuleFormFooterProps {
  isEdit: boolean;
  isSubmitting: boolean;
  moduleName?: string;
  onCancel: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
  moduleLabel?: string;
}

export function ModuleFormFooter({
  isEdit,
  isSubmitting,
  moduleName,
  onCancel,
  t,
  tCommon,
  moduleLabel,
}: ModuleFormFooterProps) {
  return (
    <div className="w-full flex justify-between items-center px-6 py-4 border-t bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className={`w-2 h-2 rounded-full ${isEdit ? 'bg-blue-500' : 'bg-green-500'}`} />
        <span>
          {isEdit
            ? t('drawer.footer.editing', {
                module: moduleLabel ?? '',
                moduleName: moduleName ?? '',
              })
            : t('drawer.footer.adding', {
                module: moduleLabel ?? '',
              })}
        </span>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {tCommon('buttons.cancel')}
        </Button>
        <Button type="submit" form="module-form" isLoading={isSubmitting} disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isEdit
            ? t('drawer.buttons.update', { module: moduleLabel ?? '' })
            : t('drawer.buttons.save', { module: moduleLabel ?? '' })}
        </Button>
      </div>
    </div>
  );
}
