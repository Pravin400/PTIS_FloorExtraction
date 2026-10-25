'use client';

import { LayoutGrid, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common';

interface RuleBuilderHeaderProps {
  locale: string;
  onBackClick?: () => void;
}

/** Displays the Rule Engine page header with icon, title, and back button. */
export default function RuleBuilderHeader({ locale, onBackClick }: RuleBuilderHeaderProps) {
  const t = useTranslations('ruleEngine');
  const router = useRouter();

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('header.title')}</h1>
          <p className="text-xs text-gray-500 font-medium">
            {t('header.subtitle')}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        icon={ArrowLeft}
        onClick={onBackClick || (() => router.push(`/${locale}/property-tax/rule-engine`))}
        className="h-10 px-4 font-bold text-slate-900 border-slate-300 hover:bg-slate-100 hover:text-blue-700 transition-all shadow-sm"
      >
        {t('header.backToList')}
      </Button>
    </div>
  );
}

