'use client';

import { TextArea, CancelButton, SaveButton } from '@/components/common';
import { Modal } from '@/components/common/Modal';
import { useTranslations } from 'next-intl';

interface RuleSaveReasonModalProps {
  open: boolean;
  onClose: () => void;
  changeReason: string;
  setChangeReason: (val: string) => void;
  onConfirm: () => void;
}

/** Modal that prompts the user to enter a change reason before saving a rule. */
export default function RuleSaveReasonModal({
  open, onClose, changeReason, setChangeReason, onConfirm,
}: RuleSaveReasonModalProps) {
  const t = useTranslations('ruleEngine');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('saveReasonModal.title')}
      maxWidth="sm"
      footer={
        <div className="flex justify-end gap-2.5">
          <CancelButton onClick={onClose} />
          <SaveButton
            label={t('saveReasonModal.confirmSave')}
            onClick={onConfirm}
            disabled={!changeReason.trim()}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          {t('saveReasonModal.description')}
        </p>
        <TextArea
          label={t('saveReasonModal.changeReason')}
          required
          placeholder={t('saveReasonModal.placeholder')}
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
