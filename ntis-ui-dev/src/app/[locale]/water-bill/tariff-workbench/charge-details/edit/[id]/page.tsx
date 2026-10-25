import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { TariffChargeDetails } from '@/components/modules/water-bill/tariff-workbench/charge-details';
import {
  fetchTariffChargeDetailByIdAction,
  fetchTariffChargeTariffOptionsAction,
  fetchTariffChargeHeadOptionsAction,
  fetchTariffChargeGeographyUnitOptionsAction,
  getTariffChargeDetailsTableData,
  updateTariffChargeDetailAction,
  createTariffChargeDetailAction,
  deleteTariffChargeDetailAction,
} from '../../actions';

export const dynamic = 'force-dynamic';

interface EditChargeDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditChargeDetailPage({ params, searchParams }: EditChargeDetailPageProps) {
  const { id: idStr, locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    notFound();
  }

  const [tableData, editingData, tariffOptions, chargeHeadOptions, geographyUnitOptions] = await Promise.all([
    getTariffChargeDetailsTableData(sParams),
    fetchTariffChargeDetailByIdAction(id),
    fetchTariffChargeTariffOptionsAction(),
    fetchTariffChargeHeadOptionsAction(),
    fetchTariffChargeGeographyUnitOptionsAction(),
  ]);

  if (!editingData) {
    notFound();
  }

  return (
    <TariffChargeDetails
      locale={locale}
      pagedData={tableData.pagedData}
      initialSearchTerm={tableData.pageParams.searchTerm}
      initialSortBy={tableData.pageParams.sortBy}
      initialSortOrder={tableData.pageParams.sortOrder}
      drawer="edit"
      initialEditingData={editingData}
      tariffOptions={tariffOptions}
      chargeHeadOptions={chargeHeadOptions}
      geographyUnitOptions={geographyUnitOptions}
      updateAction={updateTariffChargeDetailAction}
      createAction={createTariffChargeDetailAction}
      deleteAction={deleteTariffChargeDetailAction}
    />
  );
}
