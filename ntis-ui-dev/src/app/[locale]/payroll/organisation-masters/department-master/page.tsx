import React from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DeptMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/DepartmentMaster';
import {
  getDeptMasterPagedAction,
  getAllDeptMastersAction,
} from './action';
import { payrollMasterQuerySchema } from '@/lib/validations/payroll/common.schema';

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
  const t = await getTranslations({ locale, namespace: 'payrollDepartmentMaster' });
  return {
    title: `${t('title')} | Municipal Administration`,
    description: t('subtitle'),
  };
}

export default async function DepartmentMasterPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawParams = await searchParams;
  const parsed = payrollMasterQuerySchema.safeParse(rawParams);
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

  const [deptResult, allDepts] = await Promise.all([
    getDeptMasterPagedAction(
      query.page,
      query.pageSize,
      query.q,
      query.sortBy,
      query.sortOrder,
      isActive
    ),
    getAllDeptMastersAction().catch(() => []),
  ]);

  const existingCodes = Array.from(
    new Set([
      ...allDepts.map((item) => item.departmentCode),
      ...deptResult.items.map((item) => item.departmentCode),
    ])
  ).filter(Boolean);

  return (
    <DeptMasterView
      initialItems={deptResult.items}
      pageNumber={deptResult.pageNumber}
      pageSize={deptResult.pageSize}
      totalCount={deptResult.totalCount}
      totalPages={deptResult.totalPages}
      sortBy={query.sortBy}
      sortOrder={query.sortOrder}
      existingCodes={existingCodes}
    />
  );
}
