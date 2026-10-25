import React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { FinancialYearMasterContent } from '@/components/modules/configuration-settings/financial-year-master/FinancialYearMasterContent';
import { getFinancialYearById } from '@/lib/api/financial-year.service';
import { notFound } from 'next/navigation';

interface EditPageProps {
  params: Promise<{ yearId: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditFinancialYearPage({ params, searchParams }: EditPageProps): Promise<React.ReactElement> {
  const { yearId, locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;
  const id = parseInt(yearId, 10);
  
  if (isNaN(id) || id <= 0) {
    notFound();
  }

  const editingData = await getFinancialYearById(id).catch(() => null);

  if (!editingData) {
    notFound();
  }

  return (
    <FinancialYearMasterContent
      locale={locale}
      searchParams={sParams}
      drawer="edit"
      initialEditingData={editingData}
    />
  );
}
