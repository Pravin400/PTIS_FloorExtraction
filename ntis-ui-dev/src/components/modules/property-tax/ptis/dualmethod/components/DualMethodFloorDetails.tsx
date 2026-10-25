'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { PTIS_UI_CLASSES } from '@/components/modules/property-tax/ptis/constants';

interface Props {
  rateableSection?: React.ReactNode;
  capitalSection?: React.ReactNode;
}

/**
 * Renders the expandable floor details section for Dual Method view.
 * Receives Server Components as props to avoid client-side translation errors.
 */
export const DualMethodFloorDetails: React.FC<Props> = ({
  rateableSection,
  capitalSection,
}) => {
  const t = useTranslations('ptis.modules.DualMethod');
  
  return (
    <div className="space-y-3 mt-2">
      <div className={PTIS_UI_CLASSES.sectionCard}>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 py-1 px-2 rounded-t-md">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white py-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            {t('rateableMethod')}
          </h3>
        </div>
        {rateableSection}
      </div>

      <div className={PTIS_UI_CLASSES.sectionCard}>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 py-1 px-2 rounded-t-md">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white py-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            {t('capitalMethod')}
          </h3>
        </div>
        {capitalSection}
      </div>
    </div>
  );
};
