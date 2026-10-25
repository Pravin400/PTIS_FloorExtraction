import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { TariffSlabs } from '@/components/modules/water-bill/tariff-workbench/slabs';
import {
  fetchTariffSlabByIdAction,
  fetchTariffSlabTariffOptionsAction,
  fetchTariffSlabGeographyUnitOptionsAction,
  getTariffSlabsTableData,
  updateTariffSlabAction,
  createTariffSlabAction,
  deleteTariffSlabAction,
} from '../../actions';

export const dynamic = 'force-dynamic';

interface EditSlabPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EditSlabPage({ params, searchParams }: EditSlabPageProps) {
  const { id: idStr, locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    notFound();
  }

  const [tableData, editingData, tariffOptions, geographyUnitOptions] = await Promise.all([
    getTariffSlabsTableData(sParams),
    fetchTariffSlabByIdAction(id),
    fetchTariffSlabTariffOptionsAction(),
    fetchTariffSlabGeographyUnitOptionsAction(),
  ]);

  if (!editingData) {
    notFound();
  }

  return (
    <TariffSlabs
      locale={locale}
      pagedData={tableData.pagedData}
      initialSearchTerm={tableData.pageParams.searchTerm}
      initialSortBy={tableData.pageParams.sortBy}
      initialSortOrder={tableData.pageParams.sortOrder}
      initialTariffId={tableData.pageParams.tariffId}
      drawer="edit"
      initialEditingData={editingData}
      tariffOptions={tariffOptions}
      geographyUnitOptions={geographyUnitOptions}
      updateAction={updateTariffSlabAction}
      createAction={createTariffSlabAction}
      deleteAction={deleteTariffSlabAction}
    />
  );
}
