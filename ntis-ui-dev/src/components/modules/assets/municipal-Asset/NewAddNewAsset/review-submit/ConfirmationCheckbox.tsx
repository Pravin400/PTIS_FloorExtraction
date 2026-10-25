import { useTranslations } from 'next-intl';

import type { ConfirmationCheckboxProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function ConfirmationCheckbox({ checked, onChange }: ConfirmationCheckboxProps) {
  const t = useTranslations('newAddNewAsset.review');

  return (
    <label className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-4 w-full cursor-pointer select-none">
      <div className="pt-0.5">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer appearance-none w-4 h-4 border-2 border-blue-400 rounded bg-white checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-colors"
          />
          <svg
            className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <span className="text-[12px] font-medium text-[#1c2aab]">
        {t('declarationConfirm')}
      </span>
    </label>
  );
}
