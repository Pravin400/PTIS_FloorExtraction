'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Button } from '@/components/common';

interface SurveyorErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SurveyorError({ reset }: SurveyorErrorProps) {
  const t = useTranslations('fireAuditSurveyor.error');

  return (
    <Card className="max-w-md mx-auto my-12 text-center p-6 bg-white border border-slate-200 shadow-md">
      <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-base font-bold text-slate-900 mb-1">
        {t('title')}
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        {t('message')}
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={() => reset()}
        className="w-full justify-center"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        {t('retry')}
      </Button>
    </Card>
  );
}
