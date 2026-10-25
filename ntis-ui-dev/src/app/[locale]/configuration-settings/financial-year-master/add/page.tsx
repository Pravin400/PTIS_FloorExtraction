import React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { FinancialYearMasterContent } from '@/components/modules/configuration-settings/financial-year-master/FinancialYearMasterContent';

interface AddFinancialYearPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AddFinancialYearPage({ params, searchParams }: AddFinancialYearPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;
  
  return (
    <FinancialYearMasterContent
      locale={locale}
      searchParams={sParams}
      drawer="add"
      initialEditingData={null}
    />
  );
}
