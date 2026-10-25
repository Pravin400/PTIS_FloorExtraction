import { setRequestLocale } from 'next-intl/server';
import { BillingFrequencyMaster } from '@/components/modules/water-bill/billing-configuration/billing-frequency';
import {
  createBillingFrequencyAction,
  updateBillingFrequencyAction,
  deleteBillingFrequencyAction,
  getBillingFrequencyTableData,
} from '../actions';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function BillingFrequencyMasterPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const { pagedData, pageParams } = await getBillingFrequencyTableData(sParams);

  return (
    <BillingFrequencyMaster
      pagedData={pagedData}
      locale={locale}
      drawer={null}
      initialEditingData={null}
      initialSortBy={pageParams.sortBy}
      initialSortOrder={pageParams.sortOrder}
      initialSearchTerm={pageParams.searchTerm}
      createAction={createBillingFrequencyAction}
      updateAction={updateBillingFrequencyAction}
      deleteAction={deleteBillingFrequencyAction}
    />
  );
}
