'use client';

import { Briefcase } from 'lucide-react';
import TableHeader from '@/components/common/TableHeader';
import { ModuleFilters } from './ModuleFilters';

interface ModuleMasterHeaderProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  onAdd?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  moduleLabel?: string;
  departmentLabel?: string;
}

export function ModuleMasterHeader({
  t,
  onAdd,
  search,
  onSearchChange,
  moduleLabel,
  departmentLabel,
}: ModuleMasterHeaderProps) {
  const values = {
    module: moduleLabel ?? '',
    department: departmentLabel ?? '',
  };

  return (
    <TableHeader
      title={t('title', values)}
      subtitle={t('subtitle', values)}
      icon={Briefcase}
      actionLabel={onAdd ? t('addLabel', values) : undefined}
      onActionClick={onAdd}
      rightContent={<ModuleFilters search={search} onSearchChange={onSearchChange} t={t} />}
    />
  );
}
