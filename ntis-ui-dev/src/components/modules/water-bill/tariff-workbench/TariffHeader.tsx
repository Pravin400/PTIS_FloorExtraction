'use client';

import { useTranslations } from 'next-intl';
import TableHeader from '@/components/common/TableHeader';
import { Layers } from 'lucide-react';

export function TariffHeader() {
  const t = useTranslations('tariffWorkbench');

  return (
    <TableHeader
      title={t('title')}
      subtitle={t('subtitle')}
      icon={Layers}
    />
  );
}
