import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/common';

interface EditRecordModalFooterProps {
  onClose: () => void;
  isLoading?: boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const EditRecordModalFooter: React.FC<EditRecordModalFooterProps> = ({
  onClose,
  isLoading = false,
  t,
}) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <Button variant="secondary" onClick={onClose} type="button">
        {t('building.cancel') || 'Cancel'}
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        className="!bg-[#5B50E6] hover:!bg-[#4C42D4] !text-white font-bold px-6 py-2.5 rounded-xl shadow-md gap-2"
      >
        <Check className="w-4 h-4" />
        <span>{t('building.updateCertificateRecord') || 'UPDATE CERTIFICATE RECORD'}</span>
      </Button>
    </div>
  );
};
