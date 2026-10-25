'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/ActionButton';
import { Download } from 'lucide-react';

interface ExcelGuideProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-intl translate function type varies
  t: any;
  isDownloading: boolean;
  handleDownloadTemplate: () => Promise<void>;
}

export function ExcelGuide({ t, isDownloading, handleDownloadTemplate }: ExcelGuideProps) {
  return (
    <Card className="lg:col-span-1 flex flex-col justify-between p-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t('excelGuide.title')}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          {t('excelGuide.description')}
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex gap-3 text-xs text-gray-600">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-50 text-blue-600 font-bold shrink-0">1</span>
            <span>{t('excelGuide.step1')}</span>
          </div>
          <div className="flex gap-3 text-xs text-gray-600">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-50 text-blue-600 font-bold shrink-0">2</span>
            <span>{t('excelGuide.step2')}</span>
          </div>
          <div className="flex gap-3 text-xs text-gray-600">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-50 text-blue-600 font-bold shrink-0">3</span>
            <span>{t('excelGuide.step3')}</span>
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        icon={Download}
        onClick={handleDownloadTemplate}
        isLoading={isDownloading}
        className="w-full justify-center"
      >
        {t('excelGuide.downloadTemplate')}
      </Button>
    </Card>
  );
}
