import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BillingPeriodMaster } from '@/components/modules/water-bill/billing-configuration/billing-period';
import type { EditBillingPeriodPageProps } from '@/types/water-bill/billing-configuration/billingPeriodMaster.types';
import {
  fetchBillingPeriodByIdAction,
  createBillingPeriodAction,
  updateBillingPeriodAction,
  deleteBillingPeriodAction,
  getBillingPeriodTableData,
} from '../../../actions';

export default async function EditBillingPeriodPage({ params, searchParams }: EditBillingPeriodPageProps) {
  const { id: idStr, locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    notFound();
  }

  // 1. Fetch data, specific editing record, and dropdown options in parallel
  const [{ pagedData, financialYearOptions, billingFrequencyOptions, pageParams }, editingDataResult] = await Promise.all([
    getBillingPeriodTableData(sParams),
    fetchBillingPeriodByIdAction(id),
  ]);

  const editingData = editingDataResult ?? pagedData.items.find((item) => item.id === id) ?? null;

  if (!editingData) {
    notFound();
  }

  // 2. Open drawer in 'edit' mode with initial preloaded data
  return (
    <BillingPeriodMaster
      pagedData={pagedData}
      financialYearOptions={financialYearOptions}
      billingFrequencyOptions={billingFrequencyOptions}
      locale={locale}
      drawer="edit"
      initialEditingData={editingData}
      initialSortBy={pageParams.sortBy}
      initialSortOrder={pageParams.sortOrder}
      initialSearchTerm={pageParams.searchTerm}
      createAction={createBillingPeriodAction}
      updateAction={updateBillingPeriodAction}
      deleteAction={deleteBillingPeriodAction}
    />
  );
}
