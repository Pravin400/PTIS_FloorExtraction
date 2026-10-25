import { setRequestLocale } from 'next-intl/server';
import { BillingPeriodMaster } from '@/components/modules/water-bill/billing-configuration/billing-period';
import {
  createBillingPeriodAction,
  updateBillingPeriodAction,
  deleteBillingPeriodAction,
  getBillingPeriodTableData,
} from '../actions';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function BillingPeriodMasterPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const { pagedData, financialYearOptions, billingFrequencyOptions, pageParams } = await getBillingPeriodTableData(sParams);

  return (
    <BillingPeriodMaster
      pagedData={pagedData}
      financialYearOptions={financialYearOptions}
      billingFrequencyOptions={billingFrequencyOptions}
      locale={locale}
      drawer={null}
      initialEditingData={null}
      initialSortBy={pageParams.sortBy}
      initialSortOrder={pageParams.sortOrder}
      initialSearchTerm={pageParams.searchTerm}
      createAction={createBillingPeriodAction}
      updateAction={updateBillingPeriodAction}
      deleteAction={deleteBillingPeriodAction}
    />
  );
}
