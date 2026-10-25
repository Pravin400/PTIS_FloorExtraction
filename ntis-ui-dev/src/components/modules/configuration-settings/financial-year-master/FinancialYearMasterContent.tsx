import type { ReactNode } from 'react';

import { FinancialYearStats } from '@/components/modules/configuration-settings/financial-year-master/FinancialYearStats';
import { FinancialYearTable } from '@/components/modules/configuration-settings/financial-year-master/FinancialYearTable';
import { getFinancialYearsPaged } from '@/lib/api/financial-year.service';
import { parsePaginationParams } from '@/lib/utils/pagination';
import { FinancialYear } from '@/types/financialYear.types';

interface FinancialYearMasterContentProps {
  locale: string;
  searchParams?: { [key: string]: string | string[] | undefined };
  drawer?: 'add' | 'edit' | null;
  initialEditingData?: FinancialYear | null;
  modal?: ReactNode;
}

export async function FinancialYearMasterContent({
  locale,
  searchParams = {},
  drawer = null,
  initialEditingData = null,
  modal,
}: FinancialYearMasterContentProps) {
  const { page, pageSize, search, status } = searchParams;

  const { pageNumber, pageSize: size } = parsePaginationParams(page, pageSize);
  const searchTerm = (Array.isArray(search) ? search[0] : (search as string)) || '';
  const statusFilter = (Array.isArray(status) ? status[0] : (status as string)) || '';

  const data = await getFinancialYearsPaged(pageNumber, size, searchTerm, statusFilter);

  const stats = data.stats || {
    total: data.totalCount,
    active: data.items.filter((y) => y.status === 'Active' || y.isActive).length,
    closed: data.items.filter((y) => y.status === 'Closed').length,
  };

  return (
    <FinancialYearTable
      initialData={data.items}
      totalCount={data.totalCount}
      pageNumber={pageNumber}
      pageSize={size}
      drawer={drawer}
      initialEditingData={initialEditingData}
      statsCard={<FinancialYearStats stats={stats} locale={locale} />}
      modal={modal}
    />
  );
}
