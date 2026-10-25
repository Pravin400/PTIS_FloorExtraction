import { useTranslations } from 'next-intl';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface ScopeValidationProps {
  isValidated: boolean;
  eligibleCount: number | null;
  setIsModalOpen: (val: boolean) => void;
}

export function ScopeValidation({
  isValidated,
  eligibleCount,
  setIsModalOpen
}: ScopeValidationProps) {
  const t = useTranslations('addTaxes');

  return (
    <div className="bg-white rounded-xl p-5 flex flex-col md:flex-row items-center justify-between border border-gray-200 mt-1 shadow-sm">
      <div className="w-full md:w-auto mb-4 md:mb-0">
        <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
          {t('executionValidation.title')}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 bg-[#E8F8F0] text-[#10B981] text-[10px] px-2.5 py-1 rounded-full font-medium">
            <Check className="h-3 w-3" /> {t('executionValidation.tags.financeYear')}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium ${isValidated ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-gray-100 text-gray-500'}`}>
            {isValidated ? <Check className="h-3 w-3" /> : <span className="inline-block w-1.5 h-1.5 rounded-full border border-gray-400 mr-0.5"></span>}
            {t('executionValidation.tags.scope')}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium ${isValidated ? 'bg-[#E8F8F0] text-[#10B981]' : 'bg-gray-100 text-gray-500'}`}>
            {isValidated ? <Check className="h-3 w-3" /> : <span className="inline-block w-1.5 h-1.5 rounded-full border border-gray-400 mr-0.5"></span>}
            {t('executionValidation.tags.eligibleRecords')}
          </span>
          <span className="inline-flex items-center gap-1 bg-[#E8F8F0] text-[#10B981] text-[10px] px-2.5 py-1 rounded-full font-medium">
            <Check className="h-3 w-3" /> {t('executionValidation.tags.permission')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t('executionValidation.readyRecords')}</div>
          <div className="text-2xl font-bold text-gray-900 leading-none my-0.5">
            {isValidated && eligibleCount !== null ? eligibleCount : 0}
          </div>
          <div className="text-[10px] text-gray-400 lowercase">{t('executionValidation.eligibleRecordsSub')}</div>
        </div>
        <button
          className={`text-white rounded-lg px-6 py-3 flex items-center justify-between gap-4 transition-colors ${(!isValidated || eligibleCount === null || eligibleCount === 0)
              ? 'bg-[#6B9DF2] opacity-60 cursor-not-allowed'
              : 'bg-[#2563EB] hover:bg-blue-700'
            }`}
          disabled={!isValidated || eligibleCount === null || eligibleCount === 0}
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-white/90" />
            <div className="text-left">
              <div className="text-sm font-semibold leading-tight">{t('executionValidation.reviewExecute')}</div>
              <div className="text-[10px] opacity-90 leading-none mt-0.5">{t('executionValidation.requiresConfirmation')}</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
