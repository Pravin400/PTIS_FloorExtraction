import { setRequestLocale } from 'next-intl/server';
import { TariffSlabs } from '@/components/modules/water-bill/tariff-workbench/slabs';
import {
    getTariffSlabsTableData,
    fetchTariffSlabTariffOptionsAction,
    fetchTariffSlabGeographyUnitOptionsAction,
    updateTariffSlabAction,
    createTariffSlabAction,
    deleteTariffSlabAction
} from '../actions';

export const dynamic = 'force-dynamic';

interface AddSlabPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AddSlabPage({ params, searchParams }: AddSlabPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const sParams = await searchParams;

    const [tableData, tariffOptions, geographyUnitOptions] = await Promise.all([
        getTariffSlabsTableData(sParams),
        fetchTariffSlabTariffOptionsAction(),
        fetchTariffSlabGeographyUnitOptionsAction(),
    ]);

    return (
        <TariffSlabs
            locale={locale}
            pagedData={tableData.pagedData}
            initialSearchTerm={tableData.pageParams.searchTerm}
            initialSortBy={tableData.pageParams.sortBy}
            initialSortOrder={tableData.pageParams.sortOrder}
            initialTariffId={tableData.pageParams.tariffId}
            tariffOptions={tariffOptions}
            geographyUnitOptions={geographyUnitOptions}
            drawer="add"
            initialEditingData={null}
            updateAction={updateTariffSlabAction}
            createAction={createTariffSlabAction}
            deleteAction={deleteTariffSlabAction}
        />
    );
}
