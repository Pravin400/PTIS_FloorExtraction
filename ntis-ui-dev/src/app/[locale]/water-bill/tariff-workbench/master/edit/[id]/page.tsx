import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { TariffWorkbench } from '@/components/modules/water-bill/tariff-workbench';
import type { EditTariffPageProps } from '@/types/water-bill/tariff-workbench/tariffWorkbench.types';
import {
  fetchTariffWorkbenchByIdAction,
  getTariffWorkbenchTableData,
  createTariffWorkbenchAction,
  updateTariffWorkbenchAction,
  deleteTariffWorkbenchAction,
} from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditTariffPage({ params, searchParams }: EditTariffPageProps) {
  const { id: idStr, locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    notFound();
  }

  const [tableData, editingData] = await Promise.all([
    getTariffWorkbenchTableData(sParams),
    fetchTariffWorkbenchByIdAction(id),
  ]);

  if (!editingData) {
    notFound();
  }

  return (
    <TariffWorkbench
      pagedData={tableData.pagedData}
      locale={locale}
      drawer="edit"
      initialEditingData={editingData}
      initialSortBy={tableData.pageParams.sortBy}
      initialSortOrder={tableData.pageParams.sortOrder}
      initialSearchTerm={tableData.pageParams.searchTerm}
      financialYearOptions={tableData.financialYearOptions}
      connectionTypeOptions={tableData.connectionTypeOptions}
      connectionCategoryOptions={tableData.connectionCategoryOptions}
      tapSizeOptions={tableData.tapSizeOptions}
      createAction={createTariffWorkbenchAction}
      updateAction={updateTariffWorkbenchAction}
      deleteAction={deleteTariffWorkbenchAction}
    />
  );
}
