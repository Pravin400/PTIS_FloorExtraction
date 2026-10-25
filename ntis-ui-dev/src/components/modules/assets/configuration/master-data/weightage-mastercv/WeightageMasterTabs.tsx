'use client';

import { useMemo } from 'react';
import { Tabs, type TabItem, TableHeader } from '@/components/common';
import { WeightageMasterHeaderProps } from '@/types/asset-masters/floor-cv-weightageMaster.types';
import { Lock, Layers, Hammer, Users, Calendar } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useWeightageMasterError } from './WeightageMasterErrorContext';

/** Maps tab value to its URL path segment relative to the weightage-master base */
const TAB_TO_PATH: Record<string, string> = {
  floor: '',
  nature: 'nature-weightage',
  subType: 'sub-type-weightage',
  age: 'age-weightage',
};

export function WeightageMasterHeader({ locale, title, subtitle, labels }: WeightageMasterHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasError } = useWeightageMasterError();

  const base = `/${locale}/assets/configuration/master-data/weightage-master`;

  const activeTab =
    pathname.includes('/nature-weightage')
      ? 'nature'
      : pathname.includes('/sub-type-weightage')
        ? 'subType'
        : pathname.includes('/age-weightage')
          ? 'age'
          : 'floor';

  // Memoized tabs — labels may change on locale switch but not on every re-render
  const tabs: TabItem[] = useMemo(
    () => [
      { value: 'floor', label: labels.floor, icon: Layers, content: null },
      { value: 'nature', label: labels.nature, icon: Hammer, content: null },
      { value: 'subType', label: labels.subType, icon: Users, content: null },
      { value: 'age', label: labels.age, icon: Calendar, content: null },
    ],
    [labels.floor, labels.nature, labels.subType, labels.age]
  );

  if (hasError) return null;

  return (
    <TableHeader
      title={title}
      subtitle={subtitle}
      icon={Lock}
      rightContent={
        <Tabs
          value={activeTab}
          variant="pills"
          items={tabs}
          onChange={(v) => {
            const path = TAB_TO_PATH[v] ?? '';
            router.push(path ? `${base}/${path}` : base);
          }}
        />
      }
    />
  );
}
