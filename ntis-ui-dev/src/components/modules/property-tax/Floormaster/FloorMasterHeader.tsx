'use client';

import { useTranslations } from 'next-intl';

import TableHeader from '@/components/common/TableHeader';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { FloorMasterToolbar } from './FloorMasterToolbar';

export function FloorMasterHeader() {
  const t = useTranslations('floor.floor');
  const floorLabel = useAliasLabel('Floor', t('aliasFallback.floor'));

  return (
    <TableHeader
      title={t('title', { floor: floorLabel })}
      subtitle={t('subtitle', { floor: floorLabel })}
      icon="layers"
      rightContent={<FloorMasterToolbar />}
    />
  );
}
