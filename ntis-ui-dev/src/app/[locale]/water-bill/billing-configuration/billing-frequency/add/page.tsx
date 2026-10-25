import { setRequestLocale } from 'next-intl/server';
import { BillingFrequencyMaster } from '@/components/modules/water-bill/billing-configuration/billing-frequency';
import type { AddBillingFrequencyPageProps } from '@/types/water-bill/billing-configuration/billingFrequencyMaster.types';
import {
  createBillingFrequencyAction,
  updateBillingFrequencyAction,
  deleteBillingFrequencyAction,
  getBillingFrequencyTableData,
} from '../../actions';

export default async function AddBillingFrequencyPage({ params, searchParams }: AddBillingFrequencyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;
  // 1. Server-side fetch action call and store in a variable
  const { pagedData, pageParams } = await getBillingFrequencyTableData(sParams);

  // 2. Open drawer in 'add' mode
  return (
    <BillingFrequencyMaster
      pagedData={pagedData}
      locale={locale}
      drawer="add"
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
