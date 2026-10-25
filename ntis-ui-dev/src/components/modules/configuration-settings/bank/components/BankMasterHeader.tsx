'use client';

import { Landmark } from 'lucide-react';
import TableHeader from '@/components/common/TableHeader';
import { BankFilters } from '../BankFilters';

interface BankMasterHeaderProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  onAdd?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  bankLabel?: string;
}

export function BankMasterHeader({
  t,
  onAdd,
  search,
  onSearchChange,
  bankLabel,
}: BankMasterHeaderProps) {
  const values = bankLabel ? { bank: bankLabel } : undefined;
  const addActionLabel = onAdd ? t('addBank', values) : undefined;

  return (
    <TableHeader
      title={t('title', values)}
      subtitle={t('subtitle', values)}
      icon={Landmark}
      actionLabel={addActionLabel}
      onActionClick={onAdd}
      rightContent={<BankFilters search={search} onSearchChange={onSearchChange} t={t} />}
    />
  );
}
