import { setRequestLocale } from 'next-intl/server';
import BuildingForm from "@/components/modules/property-tax/ptis/QuickDataEntry/building/BuildingForm";
import {
    getBuildingPermissionsAction,
    getSocietyWingTypesWithStatusAction,
    getWingsByPropertyAction,
    getUnitsByPropertyAction,
    getCertificateTypeMasterAction,
    getApartmentQcCertificateGridAction,
    getFloorCertificatesAction,
    getUnitCertificatesByPropertyIdsAction,
} from "./action";
import { normalizeCertificateGridData, mapRawCertificateItem } from '@/lib/utils/certificate-grid-mapper';
import {
    getFloorDataAction,
    getConstructionTypeDataAction,
    getTypeOfUseDataAction,
    getPropertyBasicDetailsAction,
    getSubFloorDataAction,
    getSubTypeOfUseDataAction,
    getFloorSubmissionsByOwnerAction,
} from '../FloorSubmission/actions';
import { normalizeArrayResponse } from '@/lib/utils/action-response-helpers';
import type { FloorResponse, ConstructionTypeResponse, TypeOfUseApiItem, SubFloorResponse, SubTypeOfUseResponse } from '@/types/floor-details.types';
import type { FloorData } from '@/types/room-details.types';

export const dynamic = 'force-dynamic';

interface BuildingPageProps {
    params: Promise<{ locale: string; propertyId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// 1. The Data Loader Component (Server Component)
async function BuildingFormDataLoader({
    propertyId,
    selectedFloorIdNum,
    searchCategory,
    searchSocietyId,
    searchWingDetailId,
    isWingWise,
    levelParam: _levelParam,
    rawSearchParams,
    locale: _locale,
}: {
    propertyId: string,
    selectedFloorIdNum?: number,
    searchCategory?: string,
    searchSocietyId?: string,
    searchWingDetailId?: string,
    returnTab?: string,
    isSocietyWise?: string,
    isWingWise?: string,
    levelParam?: string,
    rawSearchParams?: Record<string, string | string[] | undefined>,
    locale?: string,
}) {
    const rawReturnTab = rawSearchParams?.returnTab;
    const returnTab = Array.isArray(rawReturnTab) ? rawReturnTab[0] : rawReturnTab;
    const fromParam = Array.isArray(rawSearchParams?.from) ? rawSearchParams.from[0] : rawSearchParams?.from;
    const sCat = (searchCategory || '').toLowerCase();
    const isExplicitIndividual =
        returnTab === 'individual' ||
        fromParam === 'individual' ||
        sCat.includes('individual');

    function checkResult<T>(res: unknown): T[] {
        if (res && typeof res === 'object' && 'success' in res && !(res as { success: boolean }).success) {
            return [];
        }
        return Array.isArray(res) ? (res as T[]) : [];
    }

    if (isExplicitIndividual) {
        // FAST PATH: Individual property doesn't have wings, units, or apartment grids
        const [
            response,
            floorBuildingPermissionsResult,
            floorDataResult,
            constructionTypeDataResult,
            propertyBasicDetails,
            subFloorDataResult,
            subTypeDataResult,
            floorSubmissionsResult,
            floorCertificatesResult,
        ] = await Promise.all([
            getBuildingPermissionsAction(propertyId),
            selectedFloorIdNum
                ? getBuildingPermissionsAction(propertyId, selectedFloorIdNum)
                : Promise.resolve({ success: true, data: null }),
            getFloorDataAction(),
            getConstructionTypeDataAction(),
            getPropertyBasicDetailsAction(propertyId),
            getSubFloorDataAction(),
            getSubTypeOfUseDataAction(),
            getFloorSubmissionsByOwnerAction(propertyId),
            getFloorCertificatesAction(propertyId, selectedFloorIdNum),
        ]);

        const resolvedPropertyTypeId = propertyBasicDetails?.propertyTypeId;
        const useDataResult = resolvedPropertyTypeId ? await getTypeOfUseDataAction(resolvedPropertyTypeId) : [];

        const floorData = checkResult<FloorResponse>(floorDataResult);
        const constructionTypeData = checkResult<ConstructionTypeResponse>(constructionTypeDataResult);
        const useData = checkResult<TypeOfUseApiItem>(useDataResult);
        const subFloorData = checkResult<SubFloorResponse>(subFloorDataResult);
        const subTypeData = checkResult<SubTypeOfUseResponse>(subTypeDataResult);
        const initialFloorsRaw = normalizeArrayResponse(floorSubmissionsResult);
        const initialFloors: FloorData[] = (initialFloorsRaw || []) as FloorData[];
        const floorCertificatesResponse = (floorCertificatesResult && typeof floorCertificatesResult === 'object' && 'data' in floorCertificatesResult)
            ? floorCertificatesResult
            : { success: true, data: null };

        const rawActiveScope = rawSearchParams?.activeScope;
        const initialActiveScope = (rawActiveScope === 'Floor' || selectedFloorIdNum) ? 'Floor' as const : 'Property' as const;
        const rawCertTypeId = rawSearchParams?.certificateTypeId || rawSearchParams?.certTypeId;
        const initialSelectedTypeId = rawCertTypeId ? Number(Array.isArray(rawCertTypeId) ? rawCertTypeId[0] : rawCertTypeId) : undefined;

        return (
            <BuildingForm
                key={propertyId}
                initialBuildingPermission={response.data || null}
                initialFloorBuildingPermission={floorBuildingPermissionsResult?.success ? floorBuildingPermissionsResult.data : null}
                initialFloorCertificates={floorCertificatesResponse.data || null}
                initialActiveScope={initialActiveScope}
                initialActiveFloorId={selectedFloorIdNum ?? null}
                initialSelectedTypeId={initialSelectedTypeId && !isNaN(initialSelectedTypeId) ? initialSelectedTypeId : null}
                propertyId={propertyId}
                categoryId={2}
                categoryName="Individual"
                isSociety={false}
                societyDetailId={null}
                wingDetailId={null}
                floorData={floorData}
                constructionTypeData={constructionTypeData}
                useData={useData}
                subFloorData={subFloorData}
                subTypeData={subTypeData}
                initialFloors={initialFloors}
                initialWings={[]}
                initialUnits={[]}
                initialCertificateTypes={[]}
                initialCertificateGrid={null}
                propertyConstructionYear={propertyBasicDetails?.constructionYear || null}
            />
        );
    }

    // APARTMENT PATH
    const targetSocId = searchSocietyId ? Number(searchSocietyId) : null;
    const targetWingId = searchWingDetailId ? Number(searchWingDetailId) : null;
    const targetPropId = targetSocId ? null : (propertyId ? Number(propertyId) : null);

    const [
        response,
        floorBuildingPermissionsResult,
        floorDataResult,
        constructionTypeDataResult,
        propertyBasicDetails,
        wingsResult,
        unitsResult,
        certificateTypesResult,
        certificateGridResult,
        subFloorDataResult,
        subTypeDataResult,
        floorSubmissionsResult,
        floorCertificatesResult,
    ] = await Promise.all([
        (searchWingDetailId && (isWingWise === 'true' || _levelParam === 'Wing' || !searchSocietyId))
            ? getSocietyWingTypesWithStatusAction(searchSocietyId ? Number(searchSocietyId) : null, Number(searchWingDetailId))
            : (searchSocietyId)
                ? getSocietyWingTypesWithStatusAction(Number(searchSocietyId), searchWingDetailId ? Number(searchWingDetailId) : null)
                : getBuildingPermissionsAction(propertyId),
        selectedFloorIdNum
            ? getBuildingPermissionsAction(propertyId, selectedFloorIdNum)
            : Promise.resolve({ success: true, data: null }),
        getFloorDataAction(),
        getConstructionTypeDataAction(),
        getPropertyBasicDetailsAction(propertyId),
        getWingsByPropertyAction(propertyId, searchSocietyId),
        getUnitsByPropertyAction(propertyId, targetWingId, 1, 100),
        getCertificateTypeMasterAction(),
        getApartmentQcCertificateGridAction(
            targetPropId,
            targetWingId,
            targetSocId
        ),
        getSubFloorDataAction(),
        getSubTypeOfUseDataAction(),
        getFloorSubmissionsByOwnerAction(propertyId),
        getFloorCertificatesAction(propertyId, selectedFloorIdNum),
    ]);

    const resolvedPropertyTypeId = propertyBasicDetails?.propertyTypeId;
    const useDataResult = resolvedPropertyTypeId ? await getTypeOfUseDataAction(resolvedPropertyTypeId) : [];

    const floorData = checkResult<FloorResponse>(floorDataResult);
    const constructionTypeData = checkResult<ConstructionTypeResponse>(constructionTypeDataResult);
    const useData = checkResult<TypeOfUseApiItem>(useDataResult);
    const subFloorData = checkResult<SubFloorResponse>(subFloorDataResult);
    const subTypeData = checkResult<SubTypeOfUseResponse>(subTypeDataResult);
    const initialFloorsRaw = normalizeArrayResponse(floorSubmissionsResult);
    const initialFloors: FloorData[] = (initialFloorsRaw || []) as FloorData[];
    const floorCertificatesResponse = (floorCertificatesResult && typeof floorCertificatesResult === 'object' && 'data' in floorCertificatesResult)
        ? floorCertificatesResult
        : { success: true, data: null };

    // Process Wings SSR Data
    const rawWings = (wingsResult?.success && Array.isArray(wingsResult.data)) ? wingsResult.data as Record<string, unknown>[] : [];
    const initialWings = rawWings.map((w, idx) => {
        const rawName = String(
            w.wingName || w.WingName || w.societyWingName || w.SocietyWingName || w.name || w.Name || w.wingDescription || w.WingDescription || w.wingNo || w.WingNo || w.wing || w.Wing || w.blockName || w.BlockName || ''
        ).trim();
        if (!rawName) return null;
        return {
            wingDetailId: Number(w.wingDetailId || w.WingDetailId || w.societyWingId || w.SocietyWingId || w.id || w.Id || idx + 1),
            wingName: rawName,
        };
    }).filter((w): w is NonNullable<typeof w> => w !== null);

    // Process Units SSR Data
    const rawUnits = (unitsResult?.success && Array.isArray(unitsResult.data)) ? unitsResult.data as Record<string, unknown>[] : [];
    const initialUnits = rawUnits.map((u, idx) => {
        const rawPropId = Number(u.propertyId || u.PropertyId || 0);
        const rawDetailsId = Number(u.propertyDetailsId || u.PropertyDetailsId || u.id || u.Id || 0);
        const resolvedId = rawDetailsId > 0 ? rawDetailsId : (rawPropId > 0 ? rawPropId : idx + 1);
        const resolvedPropId = rawPropId > 0 ? rawPropId : resolvedId;
        return {
            propertyDetailsId: resolvedId,
            propertyId: resolvedPropId,
            unitNo: String(u.unitNo || u.UnitNo || u.partitionNo || u.PartitionNo || u.flatNo || u.FlatNo || `Unit ${idx + 1}`),
            wingDetailId: Number(u.wingDetailId || u.WingDetailId || 0),
            wingName: String(u.wingName || u.WingName || 'Wing'),
            floorName: String(u.floorName || u.FloorName || u.floor || '1st Floor'),
            useName: String(u.useName || u.UseName || u.use || 'Residential'),
            constructionYear: String(u.constructionYear || u.ConstructionYear || u.conYr || '').trim() || undefined,
            isSelected: false,
        };
    }).sort((a, b) => (a.unitNo || '').localeCompare(b.unitNo || '', undefined, { numeric: true, sensitivity: 'base' }));

    // Process Certificate Types Master SSR Data
    const rawTypes = (certificateTypesResult?.success && Array.isArray(certificateTypesResult.data)) ? certificateTypesResult.data as Record<string, unknown>[] : [];
    const initialCertificateTypes = rawTypes.map((item) => {
        const typeCode = String(item.certificateTypeCode || item.code || 'DOC');
        const typeName = String(item.certificateTypeName || item.name || typeCode);
        const typeId = Number(item.id || item.certificateTypeId || 0);
        return {
            certificateTypeId: typeId,
            certificateTypeCode: typeCode,
            certificateTypeName: typeName,
            badgeCode: typeCode.substring(0, 2).toUpperCase(),
        };
    });

    const initialCertificateGridRaw = certificateGridResult?.success ? certificateGridResult.data : null;
    let initialCertificateGrid = initialCertificateGridRaw ? normalizeCertificateGridData(initialCertificateGridRaw) : null;

    // Only if certificate grid didn't provide unit certificates, fetch at most 5 units to avoid SSR waterfalls
    if (initialUnits.length > 0 && (!initialCertificateGrid || (initialCertificateGrid.unitCertificates || []).length === 0)) {
        const unitPropIds = Array.from(
            new Set(
                initialUnits
                    .map((u) => u.propertyId)
                    .filter((id): id is number => typeof id === 'number' && id > 0)
            )
        ).slice(0, 5);
        if (unitPropIds.length > 0) {
            try {
                const unitCertsRes = await getUnitCertificatesByPropertyIdsAction(unitPropIds);
                if (unitCertsRes.success && Array.isArray(unitCertsRes.data) && unitCertsRes.data.length > 0) {
                    const mappedUnitCerts = unitCertsRes.data.map(mapRawCertificateItem);
                    if (!initialCertificateGrid) {
                        initialCertificateGrid = {
                            societyCertificates: [],
                            wingCertificates: [],
                            unitCertificates: mappedUnitCerts,
                            floorCertificates: [],
                        };
                    } else {
                        initialCertificateGrid = {
                            ...initialCertificateGrid,
                            unitCertificates: mappedUnitCerts,
                        };
                    }
                }
            } catch {
                // Ignore SSR pre-fetch errors gracefully
            }
        }
    }

    const pb = (propertyBasicDetails || {}) as Record<string, unknown>;
    const bCat = (sCat || String(pb.categoryName || pb.propertyCategoryName || '')).toLowerCase();
    const categoryId = Number(pb.categoryId ?? pb.CategoryId);

    const hasParentPropertyId = Boolean(rawSearchParams?.parentPropertyId);

    const wingSocietyItem = rawWings.find(w => Number(w.societyDetailId || w.SocietyDetailId || w.societyId || w.SocietyId) > 0);
    const resolvedWingSocietyDetailId = wingSocietyItem
        ? Number(wingSocietyItem.societyDetailId || wingSocietyItem.SocietyDetailId || wingSocietyItem.societyId || wingSocietyItem.SocietyId)
        : null;

    // Check if society or apartment hierarchy exists
    const hasSocietyId = Boolean(
        (searchSocietyId && String(searchSocietyId) !== '0') ||
        (pb.societyDetailId && Number(pb.societyDetailId) > 0) ||
        (pb.societyId && Number(pb.societyId) > 0) ||
        (resolvedWingSocietyDetailId && resolvedWingSocietyDetailId > 0) ||
        hasParentPropertyId
    );

    // Rule: CategoryId === 1 (Apartment) OR societyDetailId / parentPropertyId present -> Apartment (3-level switcher)
    // CategoryId === 2 (Individual) -> Individual (2-level switcher)
    const isApartment = (categoryId === 1 || bCat.includes('apartment') || hasSocietyId) && categoryId !== 2;
    const isSociety = isApartment;

    const resolvedSocietyDetailId = isSociety
        ? (searchSocietyId
            ? Number(searchSocietyId)
            : (pb.societyDetailId ? Number(pb.societyDetailId) : (pb.societyId ? Number(pb.societyId) : resolvedWingSocietyDetailId)))
        : null;

    const resolvedWingDetailId = isSociety
        ? (searchWingDetailId
            ? Number(searchWingDetailId)
            : (initialWings[0]?.wingDetailId ?? (pb.wingDetailId ? Number(pb.wingDetailId) : (pb.wingId ? Number(pb.wingId) : null))))
        : null;

    const rawActiveScope = rawSearchParams?.activeScope;
    const initialActiveScope = (rawActiveScope === 'Floor' || selectedFloorIdNum) ? 'Floor' as const : 'Property' as const;
    const rawCertTypeId = rawSearchParams?.certificateTypeId || rawSearchParams?.certTypeId;
    const initialSelectedTypeId = rawCertTypeId ? Number(Array.isArray(rawCertTypeId) ? rawCertTypeId[0] : rawCertTypeId) : undefined;

    return (
        <BuildingForm
            key={propertyId}
            initialBuildingPermission={response.data || null}
            initialFloorBuildingPermission={floorBuildingPermissionsResult?.success ? floorBuildingPermissionsResult.data : null}
            initialFloorCertificates={floorCertificatesResponse.data || null}
            initialActiveScope={initialActiveScope}
            initialActiveFloorId={selectedFloorIdNum ?? null}
            initialSelectedTypeId={initialSelectedTypeId && !isNaN(initialSelectedTypeId) ? initialSelectedTypeId : null}
            propertyId={propertyId}
            categoryId={categoryId || (isApartment ? 1 : 2)}
            categoryName={String(pb.categoryName || pb.propertyCategoryName || (isApartment ? 'Apartment' : 'Individual'))}
            isSociety={isSociety}
            societyDetailId={resolvedSocietyDetailId}
            wingDetailId={resolvedWingDetailId}
            floorData={floorData}
            constructionTypeData={constructionTypeData}
            useData={useData}
            subFloorData={subFloorData}
            subTypeData={subTypeData}
            initialFloors={initialFloors}
            initialWings={initialWings}
            initialUnits={initialUnits}
            initialCertificateTypes={initialCertificateTypes}
            initialCertificateGrid={initialCertificateGrid}
            propertyConstructionYear={propertyBasicDetails?.constructionYear || null}
        />
    );
}

// 3. Main Page Component
export default async function BuildingPage({ params, searchParams }: BuildingPageProps) {
    const { locale, propertyId } = await params;
    const sp = await searchParams;
    setRequestLocale(locale);

    // Extract selected floor ID from URL params if coming from Floor tab or floor URL
    const rawFloorId = sp.selectedFloorId || sp.activeFloorId || sp.selectedPropertyDetailsId || sp.floorId;
    const activeFloorId = rawFloorId ? Number(Array.isArray(rawFloorId) ? rawFloorId[0] : rawFloorId) : undefined;
    const selectedFloorIdNum = activeFloorId && !isNaN(activeFloorId) ? activeFloorId : undefined;

    const rawCategory = sp.propertyCategory || sp.category;
    const searchCategory = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;

    const rawSocietyId = sp.societyDetailId || sp.societyId;
    const searchSocietyId = Array.isArray(rawSocietyId) ? rawSocietyId[0] : rawSocietyId;

    const rawWingDetailId = sp.wingDetailId;
    const searchWingDetailId = Array.isArray(rawWingDetailId) ? rawWingDetailId[0] : rawWingDetailId;

    const rawReturnTab = sp.returnTab;
    const returnTab = Array.isArray(rawReturnTab) ? rawReturnTab[0] : rawReturnTab;

    const rawIsSocietyWise = sp.isSocietyWise;
    const isSocietyWise = Array.isArray(rawIsSocietyWise) ? rawIsSocietyWise[0] : rawIsSocietyWise;

    const rawIsWingWise = sp.isWingWise;
    const isWingWise = Array.isArray(rawIsWingWise) ? rawIsWingWise[0] : rawIsWingWise;

    const rawLevel = sp.level;
    const levelParam = Array.isArray(rawLevel) ? rawLevel[0] : rawLevel;

    return (
        <BuildingFormDataLoader
            propertyId={propertyId}
            selectedFloorIdNum={selectedFloorIdNum}
            searchCategory={searchCategory}
            searchSocietyId={searchSocietyId}
            searchWingDetailId={searchWingDetailId}
            returnTab={returnTab}
            isSocietyWise={isSocietyWise}
            isWingWise={isWingWise}
            levelParam={levelParam}
            rawSearchParams={sp}
            locale={locale}
        />
    );
}