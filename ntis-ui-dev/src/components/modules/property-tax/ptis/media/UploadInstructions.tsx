'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';

export function UploadInstructions(): React.ReactElement {
  const t = useTranslations('ptis');
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-800 space-y-1">
      <div className="font-semibold flex items-center gap-1.5 text-blue-900">
        <Info className="w-3.5 h-3.5 text-blue-600" />
        <span>{t('media.uploadInstructions') || 'Upload Instructions'}</span>
      </div>
      <ul className="list-disc list-inside space-y-0.5 text-blue-700 ml-1">
        <li>{t('media.allowedFormats') || 'Allowed formats: JPEG, JPG, PNG'}</li>
        <li>{t('media.maxFileSize') || 'Maximum file size: 5 MB'}</li>
        <li>{t('media.photoLegibilityNote') || 'Ensure the photo is clear and legible'}</li>
      </ul>
    </div>
  );
}
