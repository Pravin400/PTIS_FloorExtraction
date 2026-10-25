import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import RenterDetailsForm from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/Renter/RenterDetailsForm';
import { 
    getFloorByIdAction, 
    getPropertyByDetailsAction, 
    getFloorDataAction,
    getConstructionTypeDataAction,
    getTypeOfUseDataAction,
    getSubTypeOfUseDataAction,
    getSubFloorDataAction,
} from '../actions';
import { PageContainer } from '@/components/common/PageContainer';
import { floorNeedsLookupLabels } from '@/lib/utils/renter/renter-form-mapper';

interface RenterDetailsPageProps {
    params: Promise<{ locale: string; propertyId: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

export const dynamic = 'force-dynamic';

function parseFloorResponse(rawFloorResponse: unknown): Record<string, unknown> | null {
    if (!rawFloorResponse) return null;
    if (typeof rawFloorResponse === 'object' && rawFloorResponse !== null && 'data' in rawFloorResponse) {
        return (rawFloorResponse as Record<string, unknown>).data as Record<string, unknown>;
    }
    return rawFloorResponse as Record<string, unknown>;
}

export default async function RenterDetailsPage({ params, searchParams }: RenterDetailsPageProps) {
    const { locale, propertyId } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('quickDataEntry');
    const resolvedParams = await searchParams;
    
    const floorId = resolvedParams.floorId || '';
    const wardNo = resolvedParams.wardNo || '';
    const propertyNo = resolvedParams.propertyNo || '';
    const partitionNo = resolvedParams.partitionNo || '';

    // Critical path: fetch the floor record first so we can skip expensive secondary calls.
    const rawFloorResponse = floorId ? await getFloorByIdAction(floorId) : null;
    const initialFloorData = parseFloorResponse(rawFloorResponse);

    const needsLookups = floorNeedsLookupLabels(initialFloorData);
    const needsPropertyFetch =
        Boolean(wardNo && propertyNo && partitionNo) &&
        !String(initialFloorData?.propertyName || '').trim();

    const secondaryResults = await Promise.allSettled([
        needsPropertyFetch
            ? getPropertyByDetailsAction(wardNo, propertyNo, partitionNo)
            : Promise.resolve(null),
        ...(needsLookups
            ? [
                getFloorDataAction(),
                getConstructionTypeDataAction(),
                getTypeOfUseDataAction(),
                getSubTypeOfUseDataAction(),
                getSubFloorDataAction(),
            ]
            : []),
    ]);

    const propertyRaw =
        needsPropertyFetch && secondaryResults[0]?.status === 'fulfilled'
            ? secondaryResults[0].value
            : null;

    const lookupOffset = needsPropertyFetch ? 1 : 0;
    const lookupResults = needsLookups ? secondaryResults.slice(lookupOffset) : [];

    const pickLookupData = (index: number) => {
        const res = lookupResults[index];
        if (!res || res.status !== 'fulfilled') return [];
        return ((res.value as Record<string, unknown>)?.data as unknown[]) || [];
    };

    const fallbackPropertyInfo = {
        propertyName: String((propertyRaw as Record<string, unknown>)?.ownerName || "New Renter Registration"),
        floorNumber: String(initialFloorData?.subFloorName || "Select Floor"),
        zone: String((propertyRaw as Record<string, unknown>)?.zoneName || "Assigned Zone")
    };

    const propertyInfo = {
        propertyName: String(initialFloorData?.propertyName || fallbackPropertyInfo.propertyName),
        floorNumber: String(initialFloorData?.subFloorName || fallbackPropertyInfo.floorNumber),
        zone: String(initialFloorData?.zoneName || fallbackPropertyInfo.zone),
    };

    const lookups = {
        floorLookup: needsLookups ? pickLookupData(0) : [],
        constructionLookup: needsLookups ? pickLookupData(1) : [],
        useLookup: needsLookups ? pickLookupData(2) : [],
        subTypeLookup: needsLookups ? pickLookupData(3) : [],
        subFloorLookup: needsLookups ? pickLookupData(4) : [],
    };

    return (
        <PageContainer>
            <Suspense fallback={<div className="p-8 flex items-center justify-center">{t('renter.loadingScreen')}</div>}>
                <div className="flex flex-col flex-1 w-full">
                    <RenterDetailsForm 
                        initialData={initialFloorData} 
                        propertyInfo={propertyInfo} 
                        wardNo={wardNo}
                        propertyNo={propertyNo}
                        partitionNo={partitionNo}
                        propertyId={propertyId}
                        floorId={floorId}
                        {...lookups}
                    />
                </div>
            </Suspense>
        </PageContainer>
    );
}
