import { getUlbConfigForLogin } from '@/lib/api/ulb-config.service';
import { AssetGisDashboard } from '@/components/modules/assets/asset-gis/AssetGisDashboard';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { sanitizeTextInput } from '@/lib/utils/input-sanitization';
import { getDashboardInitialData } from './actions';
import type { GisPageProps } from '@/types/asset-gis.types';

export const dynamic = 'force-dynamic';

function sanitizeParams(raw: Record<string, string | string[] | undefined> | undefined) {
    if (!raw) return {};
    const getString = (val: string | string[] | undefined): string | undefined => {
        if (!val) return undefined;
        const str = Array.isArray(val) ? val[0] : val;
        if (!str || typeof str !== 'string') return undefined;
        const cleaned = sanitizeTextInput(str.trim());
        return cleaned || undefined;
    };

    return {
        propertyTypeId: getString(raw.propertyTypeId),
        wardNo: getString(raw.wardNo),
        ownerIdListCsv: getString(raw.ownerIdListCsv),
        category: getString(raw.category),
        propertyTypeGroup: getString(raw.propertyTypeGroup),
        assetId: getString(raw.assetId),
        ownerId: getString(raw.ownerId),
        propertyId: getString(raw.propertyId),
    };
}

export default async function GisPage({ params, searchParams }: GisPageProps) {
    // 1. Resolve Next.js async params & searchParams
    await params;
    const resolvedSearchParams = await searchParams;
    const sanitizedSearchParams = sanitizeParams(resolvedSearchParams);

    // 2. Fetch critical data on the Server
    const ulbData = await getUlbConfigForLogin().catch(() => undefined);
    const initialRes = await getDashboardInitialData(sanitizedSearchParams);

    return (
        <main className="h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-900 flex flex-col">
            <QueryProvider>
                <AssetGisDashboard
                    initialData={{
                        initData: initialRes.initData,
                        kpiSummary: initialRes.kpiSummary,
                        wardSummary: initialRes.wardSummary,
                        deepLinkCoords: initialRes.deepLinkCoords,
                        propertyDetail: initialRes.propertyDetail,
                        isSingleAssetMode: initialRes.isSingleAssetMode ?? false,
                        ssrSuccess: initialRes.success ?? false,
                        ulbData: ulbData as Record<string, unknown> | undefined,
                    }}
                />
            </QueryProvider>
        </main>
    );
}

