'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/ActionButton';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('bankMaster');

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{t('error.title')}</h2>
      <p className="max-w-md text-sm text-slate-600">{error.message}</p>
      <Button
        onClick={reset}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {t('error.tryAgain')}
      </Button>
    </div>
  );
}
