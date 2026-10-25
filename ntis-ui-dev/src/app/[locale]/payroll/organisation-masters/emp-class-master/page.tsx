import React from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmpClassMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpClassMaster';
import { getEmpClassMasterPaged } from '@/lib/api/payroll/EmpClassMaster/empClassMaster.service';
import { empClassMasterQuerySchema } from '@/lib/validations/payroll/empClassMaster.schema';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'payrollEmployeeClassMaster' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function EmpClassMasterPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawParams = await searchParams;
  const parsed = empClassMasterQuerySchema.safeParse(rawParams);
  const query = parsed.success
    ? parsed.data
    : {
        page: 1,
        pageSize: 10,
        q: undefined,
        status: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      };

  const isActive =
    query.status === 'active' ? true : query.status === 'inactive' ? false : undefined;

  const res = await getEmpClassMasterPaged(
    query.page,
    query.pageSize,
    query.q,
    query.sortBy,
    query.sortOrder,
    isActive
  );

  return (
    <EmpClassMasterView
      initialItems={res.items}
      pageNumber={res.pageNumber}
      pageSize={res.pageSize}
      totalCount={res.totalCount}
      totalPages={res.totalPages}
      sortBy={query.sortBy}
      sortOrder={query.sortOrder as 'asc' | 'desc' | undefined}
    />
  );
}
