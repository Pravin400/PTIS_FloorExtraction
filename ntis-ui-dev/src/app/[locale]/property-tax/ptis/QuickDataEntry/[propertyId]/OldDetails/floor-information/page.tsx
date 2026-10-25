import FloorInformationForm from '@/components/modules/property-tax/ptis/QuickDataEntry/old-details/FloorInformation/FloorInformationForm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
    getFloorsAction,
    getSubFloorsAction,
    getConstructionTypesAction,
    getTypeOfUsesAction,
    getSubTypeOfUsesAction,
    getOldFloorDetailsAction
} from './action';

interface PageProps {
    params: Promise<{
        propertyId: string;
        locale: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 100;

// Whitelist of allowed sort fields
const ALLOWED_SORT_FIELDS = [
    'oldFloorId',
    'oldSubFloorId',
    'oldConstructionYear',
    'oldAssessmentYear',
    'oldConstructionTypeId',
    'oldTypeOfUseId',
    'oldSubTypeOfUseId',
    'oldCarpetAreaSqFeet',
    'oldBuiltupAreaSqFeet',
] as const;

/**
 * Sanitizes and validates query parameters
 */
function sanitizeParams(raw: { [key: string]: string | string[] | undefined }) {
    const rawPage = parseInt((Array.isArray(raw.page) ? raw.page[0] : raw.page) ?? "", 10);
    const pageNumber = Number.isFinite(rawPage)
        ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
        : MIN_PAGE;

    const rawPageSize = parseInt((Array.isArray(raw.pageSize) ? raw.pageSize[0] : raw.pageSize) ?? "", 10);
    const pageSize = Number.isFinite(rawPageSize)
        ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const searchTerm = (Array.isArray(raw.search) ? raw.search[0] : raw.search)?.trim() || undefined;

    const typeOfUseIdParam = Array.isArray(raw.typeOfUseId) ? raw.typeOfUseId[0] : raw.typeOfUseId;
    const rawTypeOfUseId = typeOfUseIdParam ? Number(typeOfUseIdParam) : 0;
    const typeOfUseId = Number.isFinite(rawTypeOfUseId) ? rawTypeOfUseId : 0;

    const rawSortBy = raw.SortBy || raw.sortBy;
    const sortByParam = Array.isArray(rawSortBy) ? rawSortBy[0] : rawSortBy;
    const sortByValue = typeof sortByParam === 'string' ? sortByParam.trim() : undefined;
    // Whitelist sort field - only allow known safe fields
    const sortBy = sortByValue && ALLOWED_SORT_FIELDS.includes(sortByValue as typeof ALLOWED_SORT_FIELDS[number])
        ? sortByValue
        : undefined;

    const rawSortOrder = raw.SortOrder || raw.sortOrder;
    const sortOrderParam = Array.isArray(rawSortOrder) ? rawSortOrder[0] : rawSortOrder;
    const sortOrderValue = typeof sortOrderParam === 'string' ? sortOrderParam.trim().toLowerCase() : undefined;
    // Normalize sort order to asc or desc only
    const sortOrder = sortOrderValue === 'asc' || sortOrderValue === 'desc' ? sortOrderValue : undefined;

    const loadFloorParam = Array.isArray(raw.loadFloor) ? raw.loadFloor[0] : raw.loadFloor;
    const loadFloor = loadFloorParam === 'true';

    const loadSubFloorParam = Array.isArray(raw.loadSubFloor) ? raw.loadSubFloor[0] : raw.loadSubFloor;
    const loadSubFloor = loadSubFloorParam === 'true';

    const loadConstructionParam = Array.isArray(raw.loadConstruction) ? raw.loadConstruction[0] : raw.loadConstruction;
    const loadConstruction = loadConstructionParam === 'true';

    const loadUsageParam = Array.isArray(raw.loadUsage) ? raw.loadUsage[0] : raw.loadUsage;
    const loadUsage = loadUsageParam === 'true';

    const loadSubTypeParam = Array.isArray(raw.loadSubType) ? raw.loadSubType[0] : raw.loadSubType;
    const loadSubType = loadSubTypeParam === 'true';

    return { pageNumber, pageSize, searchTerm, typeOfUseId, sortBy, sortOrder, loadFloor, loadSubFloor, loadConstruction, loadUsage, loadSubType };
}

export default async function FloorInformationPage({ params, searchParams }: PageProps) {
    const { locale, propertyId } = await params;
    const searchParamsResolved = await searchParams;
    setRequestLocale(locale);

    const { 
        pageNumber, 
        pageSize, 
        searchTerm, 
        typeOfUseId, 
        sortBy, 
        sortOrder, 
        loadFloor, 
        loadSubFloor, 
        loadConstruction, 
        loadUsage
    } = sanitizeParams(searchParamsResolved);

    let floors, subFloors, constructionTypes, useTypes, subUseTypeList, floorPaginationData;

    try {
        // Fetch only requested dropdown master lists (lazy loaded on focus/click using search parameter query updates)
        const [
            floorsRes,
            subFloorsRes,
            constructionTypesRes,
            typeOfUseRes,
            subUseTypesRes,
            oldFloorDetailsRes
        ] = await Promise.all([
            loadFloor ? getFloorsAction(1, -1) : Promise.resolve({ success: true, data: [] }),
            loadSubFloor ? getSubFloorsAction(1, -1) : Promise.resolve({ success: true, data: [] }),
            loadConstruction ? getConstructionTypesAction(1, -1) : Promise.resolve({ success: true, data: [] }),
            loadUsage ? getTypeOfUsesAction(1, -1) : Promise.resolve({ success: true, data: [] }),
            (typeOfUseId > 0) ? getSubTypeOfUsesAction(typeOfUseId, 1, -1) : Promise.resolve({ success: true, data: [] }),
            getOldFloorDetailsAction(Number(propertyId), pageNumber, pageSize, searchTerm, sortBy, sortOrder)
        ]);

        floors = floorsRes?.success ? (floorsRes?.data ?? []) : [];
        subFloors = subFloorsRes?.success ? (subFloorsRes?.data ?? []) : [];
        constructionTypes = constructionTypesRes?.success ? (constructionTypesRes?.data ?? []) : [];
        useTypes = typeOfUseRes?.success ? (typeOfUseRes?.data ?? []) : [];
        subUseTypeList = subUseTypesRes?.success ? (subUseTypesRes?.data ?? []) : [];

        floorPaginationData = oldFloorDetailsRes?.success && oldFloorDetailsRes?.data
            ? oldFloorDetailsRes?.data
            : {
                items: [],
                totalCount: 0,
                pageNumber: 1,
                pageSize: 5,
                totalPages: 0,
                hasPrevious: false,
                hasNext: false,
            };
    } catch (error: unknown) {
        const t = await getTranslations({ locale, namespace: 'quickDataEntry' });
        const msg = error instanceof Error ? error?.message.toLowerCase() : "";

        if (msg.includes('unauthorized') || msg.includes('token expired') || msg.includes('token is expired')) {
            throw new Error(t('oldDetails.error.unauthorized'));
        }
        if (msg.includes('forbidden')) {
            throw new Error(t('oldDetails.error.forbidden'));
        }
        if (msg.includes('not found')) {
            throw new Error(t('oldDetails.error.notFound'));
        }
        if (msg.includes('fetch failed') || msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('econnrefused')) {
            throw new Error(t('oldDetails.error.failedToConnect'));
        }

        throw error;
    }

    return (
        <FloorInformationForm
            floorOptions={floors}
            subFloorOptions={subFloors}
            constructionTypeOptions={constructionTypes}
            useOptions={useTypes}
            initialSubUseTypeOptions={subUseTypeList}
            existingFloorDetails={floorPaginationData?.items}
            totalCount={floorPaginationData?.totalCount}
            pageNumber={floorPaginationData?.pageNumber}
            pageSize={floorPaginationData?.pageSize}
            totalPages={floorPaginationData?.totalPages}
            searchTerm={searchTerm}
        />
    );
}
