import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BillingFrequencyMaster } from '@/components/modules/water-bill/billing-configuration/billing-frequency';
import type { EditBillingFrequencyPageProps } from '@/types/water-bill/billing-configuration/billingFrequencyMaster.types';
import {
  fetchBillingFrequencyByIdAction,
  createBillingFrequencyAction,
  updateBillingFrequencyAction,
  deleteBillingFrequencyAction,
  getBillingFrequencyTableData,
} from '../../../actions';

export default async function EditBillingFrequencyPage({ params, searchParams }: EditBillingFrequencyPageProps) {
  const { id: idStr, locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    notFound();
  }

  // 1. Fetch billing frequencies list and specific editing record on server
  const [{ pagedData, pageParams }, editingData] = await Promise.all([
    getBillingFrequencyTableData(sParams),
    fetchBillingFrequencyByIdAction(id),
  ]);

  if (!editingData) {
    notFound();
  }

  // 2. Open drawer in 'edit' mode with initial preloaded data
  return (
    <BillingFrequencyMaster
      pagedData={pagedData}
      locale={locale}
      drawer="edit"
      initialEditingData={editingData}
      initialSortBy={pageParams.sortBy}
      initialSortOrder={pageParams.sortOrder}
      initialSearchTerm={pageParams.searchTerm}
      createAction={createBillingFrequencyAction}
      updateAction={updateBillingFrequencyAction}
      deleteAction={deleteBillingFrequencyAction}
    />
  );
}
