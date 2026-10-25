import { CancelButton, SaveButton } from '@/components/common';
import type { TranslatorFunction } from '@/types/typeOfUse.types';

interface SubTypeFormFooterProps {
  isEdit: boolean;
  onCancel: () => void;
  t: TranslatorFunction;
}

export function SubTypeFormFooter({ isEdit, onCancel, t }: SubTypeFormFooterProps) {
  return (
    <>
      <CancelButton label={t('buttons.cancel')} onClick={onCancel} />
      <SaveButton
        label={isEdit ? t('buttons.edit') : t('buttons.save')}
        type="submit"
        form="use-subtype-form"
      />
    </>
  );
}
