import { setRequestLocale } from 'next-intl/server';
import { BillingPeriodMaster } from '@/components/modules/water-bill/billing-configuration/billing-period';
import type { AddBillingPeriodPageProps } from '@/types/water-bill/billing-configuration/billingPeriodMaster.types';
import {
  createBillingPeriodAction,
  updateBillingPeriodAction,
  deleteBillingPeriodAction,
  getBillingPeriodTableData,
} from '../../actions';

export default async function AddBillingPeriodPage({ params, searchParams }: AddBillingPeriodPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;
  // 1. Fetch data and dropdown options in parallel
  const { pagedData, financialYearOptions, billingFrequencyOptions, pageParams } = await getBillingPeriodTableData(sParams);

  // 2. Open drawer in 'add' mode
  return (
    <BillingPeriodMaster
      pagedData={pagedData}
      financialYearOptions={financialYearOptions}
      billingFrequencyOptions={billingFrequencyOptions}
      locale={locale}
      drawer="add"
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
