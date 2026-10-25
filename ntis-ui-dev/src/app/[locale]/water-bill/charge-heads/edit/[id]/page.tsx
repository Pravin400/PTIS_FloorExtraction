import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ChargeHeads } from '@/components/modules/water-bill/charge-heads';
import type { EditChargeHeadPageProps } from '@/types/water-bill/chargeHeads.types';
import { parsePagedSearchParams } from '@/lib/utils/search-params-helper';
import {
  getChargeHeadsPagedAction,
  getChargeHeadByIdAction,
  createChargeHeadAction,
  updateChargeHeadAction,
  deleteChargeHeadAction,
} from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditChargeHeadPage({ params, searchParams }: EditChargeHeadPageProps) {
  const { id: idStr, locale } = await params;
  setRequestLocale(locale);
  const sParams = await searchParams;

  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    notFound();
  }

  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = parsePagedSearchParams(sParams);

  const [pagedData, fetchedData] = await Promise.all([
    getChargeHeadsPagedAction(
      pageNumber,
      pageSize,
      searchTerm,
      sortBy,
      sortOrder
    ),
    getChargeHeadByIdAction(id),
  ]);

  let editingData = fetchedData && Number(fetchedData.id) === Number(id) ? fetchedData : null;

  if (!editingData && pagedData?.items?.length) {
    const foundInPage = pagedData.items.find((item) => Number(item.id) === Number(id));
    if (foundInPage) {
      editingData = foundInPage;
    }
  }

  if (!editingData) {
    notFound();
  }

  return (
    <ChargeHeads
      pagedData={pagedData}
      locale={locale}
      drawer="edit"
      initialEditingData={editingData}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
      initialSearchTerm={searchTerm}
      createAction={createChargeHeadAction}
      updateAction={updateChargeHeadAction}
      deleteAction={deleteChargeHeadAction}
    />
  );
}

