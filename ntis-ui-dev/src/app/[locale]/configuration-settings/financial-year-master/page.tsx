import { setRequestLocale } from 'next-intl/server';
import { FinancialYearMasterContent } from '@/components/modules/configuration-settings/financial-year-master/FinancialYearMasterContent';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FinancialYearMasterPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;
  return (
    <FinancialYearMasterContent 
      locale={locale}
      searchParams={sParams} 
      drawer={null} 
      initialEditingData={null} 
    />
  );
}
