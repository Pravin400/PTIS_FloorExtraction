import React from 'react';
import { Plus, X } from 'lucide-react';

interface EditRecordModalHeaderProps {
  onClose: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const EditRecordModalHeader: React.FC<EditRecordModalHeaderProps> = ({ onClose, t }) => {
  return (
    <div className="bg-[#1E1E38] px-6 py-4 flex items-center justify-between text-white shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <Plus className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-wide uppercase">
            {t('building.editCertificateRecordTitle') || 'EDIT CERTIFICATE RECORD'}
          </h2>
          <p className="text-xs text-slate-300 font-normal mt-0.5">
            {t('building.editCertificateRecordSubtitle') ||
              'Specify scope level, certificate reference, and upload supporting files.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 text-slate-300 hover:text-white" />
      </button>
    </div>
  );
};
