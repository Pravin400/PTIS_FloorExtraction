import React from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { QualificationMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/QualificationMaster';
import {
  getQualificationMasterPagedAction,
  getAllQualificationMastersAction,
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
  const t = await getTranslations({ locale, namespace: 'payrollQualificationMaster' });
  return {
    title: `${t('title')} | Municipal Administration`,
    description: t('subtitle'),
  };
}

export default async function QualificationMasterPage({
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

  const [result, allQualifications] = await Promise.all([
    getQualificationMasterPagedAction(
      query.page,
      query.pageSize,
      query.q,
      query.sortBy,
      query.sortOrder,
      isActive
    ),
    getAllQualificationMastersAction().catch(() => []),
  ]);

  const existingCodes = Array.from(
    new Set([
      ...allQualifications.map((item) => item.qualificationCode),
      ...result.items.map((item) => item.qualificationCode),
    ])
  ).filter(Boolean);

  return (
    <QualificationMasterView
      initialItems={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      sortBy={query.sortBy}
      sortOrder={query.sortOrder}
      existingCodes={existingCodes}
    />
  );
}
