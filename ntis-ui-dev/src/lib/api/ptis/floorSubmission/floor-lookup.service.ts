import {
    ConstructionTypeResponse,
    FloorResponse,
    SubFloorResponse,
    SubTypeOfUseResponse
} from "@/types/floor-details.types";

import {
    fetchItems,
    getOptionsFromData,
    getPropertySafely
} from "./floor-service-utils"

import { TypeOfUseApiItem } from "@/types/property-basic-details.types";
import { RoomTypeResponse } from "@/types/room-details.types";

const floorLookupCache = new Map<string, { data: unknown; expiresAt: number }>();
const LOOKUP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedLookup<T>(key: string): T | null {
    const item = floorLookupCache.get(key);
    if (item && item.expiresAt > Date.now()) {
        return item.data as T;
    }
    return null;
}

function setCachedLookup<T>(key: string, data: T): void {
    floorLookupCache.set(key, { data, expiresAt: Date.now() + LOOKUP_TTL_MS });
}

export function clearFloorLookupCache(): void {
    floorLookupCache.clear();
}

/**
 * Fetches floor type data from API
 * @returns Promise<FloorResponse[]>
 */
export async function getFloorData(): Promise<FloorResponse[]> {
    const cached = getCachedLookup<FloorResponse[]>("Floor");
    if (cached) return cached;
    const items = await fetchItems<FloorResponse>("/Floor?pageNumber=1&pageSize=-1", "Failed to fetch floors");
    setCachedLookup("Floor", items);
    return items;
}

/**
 * Generates dropdown options from floor data
 * @returns Promise<string[]>
 */
export async function getFloorOptions(): Promise<string[]> {
    return getOptionsFromData(
        getFloorData,
        (a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0),
        f => {
            const id = f.floorCode || f.floorId || getPropertySafely(f, ['id', 'ID']);
            const desc = f.description || '';
            return id && desc ? `${id} - ${desc}` : (desc || String(id));
        }
    );
}

/**
 * Fetches construction type data from API
 * @returns Promise<ConstructionTypeResponse[]>
 */
export async function getConstructionTypeData(): Promise<ConstructionTypeResponse[]> {
    const cached = getCachedLookup<ConstructionTypeResponse[]>("ConstructionType");
    if (cached) return cached;
    const items = await fetchItems<ConstructionTypeResponse>("/ConstructionType?pageNumber=1&pageSize=-1", "Failed to fetch construction types");
    setCachedLookup("ConstructionType", items);
    return items;
}

/**
 * Generates dropdown options from construction type data
 * @returns Promise<string[]>
 */
export async function getConstructionTypeOptions(): Promise<string[]> {
    return getOptionsFromData(
        getConstructionTypeData,
        (a, b) => (a.searchSequence ?? 0) - (b.searchSequence ?? 0),
        item => {
            const id = item.constructionCode || item.constructionTypeId || getPropertySafely(item, ['id', 'ID']);
            const desc = item.description || '';
            return id && desc ? `${id} - ${desc}` : (desc || String(id));
        }
    );
}

/**
 * Fetches type of use data from API
 */
export async function getTypeOfUseData(propertyTypeId?: string | number): Promise<TypeOfUseApiItem[]> {
    const cacheKey = propertyTypeId && propertyTypeId !== 'undefined' && propertyTypeId !== 'null' && Number(propertyTypeId) > 0
        ? `TypeOfUse_${propertyTypeId}`
        : 'TypeOfUse_all';
    const cached = getCachedLookup<TypeOfUseApiItem[]>(cacheKey);
    if (cached) return cached;

    let result: TypeOfUseApiItem[];
    if (propertyTypeId && propertyTypeId !== 'undefined' && propertyTypeId !== 'null' && Number(propertyTypeId) > 0) {
        const rawItems = await fetchItems<TypeOfUseApiItem & { id?: string | number; ID?: string | number }>(
            `/TypeOfUseByPropertyType/${propertyTypeId}`,
            "Failed to fetch types of use by property type"
        );
        result = rawItems.map(item => ({
            ...item,
            typeOfUseId: item.typeOfUseId || Number(item.id || item.ID || 0),
            typeOfUseCategoryId: item.typeOfUseCategoryId !== undefined ? item.typeOfUseCategoryId : null
        }));
    } else {
        const rawItems = await fetchItems<TypeOfUseApiItem>("/TypeOfUse?pageNumber=1&pageSize=-1", "Failed to fetch types of use");
        result = rawItems.map(item => ({
            ...item,
            typeOfUseCategoryId: item.typeOfUseCategoryId !== undefined ? item.typeOfUseCategoryId : null
        }));
    }
    setCachedLookup(cacheKey, result);
    return result;
}

/**
 * Fetches Open Plot Category data from API (/TypeOfUse?TypeOfUseCategoryId=4)
 */
export async function getOpenPlotCategoryData(): Promise<TypeOfUseApiItem[]> {
    const cached = getCachedLookup<TypeOfUseApiItem[]>("OpenPlotCategory");
    if (cached) return cached;
    const rawItems = await fetchItems<TypeOfUseApiItem & { id?: string | number; ID?: string | number }>(
        "/TypeOfUse?TypeOfUseCategoryId=4&pageNumber=1&pageSize=-1",
        "Failed to fetch open plot categories"
    );
    const result = rawItems.map(item => ({
        ...item,
        typeOfUseId: item.typeOfUseId || Number(item.id || item.ID || 0),
        typeOfUseCategoryId: item.typeOfUseCategoryId !== undefined && item.typeOfUseCategoryId !== null ? item.typeOfUseCategoryId : 4
    }));
    setCachedLookup("OpenPlotCategory", result);
    return result;
}

/**
 * Generates dropdown options for type of use
 */
export async function getTypeOfUseOptions(): Promise<string[]> {
    return getOptionsFromData(
        getTypeOfUseData,
        (a, b) => (a.searchSequence ?? 0) - (b.searchSequence ?? 0),
        item => {
            const id = item.typeOfUseCode || item.typeOfUseId || getPropertySafely(item, ['id', 'ID']);
            const desc = item.description || '';
            return id && desc ? `${id} - ${desc}` : (desc || String(id));
        }
    );
}

/**
 * Fetches sub-type of use data, optionally filtered by typeOfUseId
 */
export async function getSubTypeOfUseData(typeOfUseId?: string): Promise<SubTypeOfUseResponse[]> {
    const cacheKey = typeOfUseId && typeOfUseId !== 'undefined' && typeOfUseId !== 'null'
        ? `SubTypeOfUse_${typeOfUseId}`
        : 'SubTypeOfUse_all';
    const cached = getCachedLookup<SubTypeOfUseResponse[]>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ pageNumber: "1", pageSize: "-1" });
    if (typeOfUseId && typeOfUseId !== 'undefined' && typeOfUseId !== 'null') {
        const isLikelyDescription = /[\u0900-\u097F\s]/.test(typeOfUseId);
        if (!isLikelyDescription) params.append("typeOfUseId", typeOfUseId);
    }
    const result = await fetchItems<SubTypeOfUseResponse>(`/SubTypeOfUse?${params.toString()}`, "Failed to fetch sub-types of use");
    setCachedLookup(cacheKey, result);
    return result;
}

/**
 * Generates dropdown options for sub-type of use
 */
export async function getSubTypeOfUseOptions(typeOfUseID?: string): Promise<string[]> {
    return getOptionsFromData(
        () => getSubTypeOfUseData(typeOfUseID),
        (a, b) => (a.searchSequence ?? 0) - (b.searchSequence ?? 0),
        item => item.searchKey ? `${item.searchKey} - ${item.description}` : item.description
    );
}

/**
 * Fetches sub-floor data
 */
export async function getSubFloorData(): Promise<SubFloorResponse[]> {
    const cached = getCachedLookup<SubFloorResponse[]>("SubFloor");
    if (cached) return cached;
    const result = await fetchItems<SubFloorResponse>("/SubFloor?pageNumber=1&pageSize=-1", "Failed to fetch sub-floors");
    setCachedLookup("SubFloor", result);
    return result;
}

/**
 * Generates dropdown options for sub-floor
 */
export async function getSubFloorOptions(): Promise<string[]> {
    return getOptionsFromData(
        getSubFloorData,
        () => 0,
        item => {
            const id = item.subFloorCode || item.subFloorId || getPropertySafely(item, ['id', 'ID']);
            const desc = item.description || '';
            return id && desc ? `${id} - ${desc}` : (desc || String(id));
        }
    );
}

/**
 * Fetches room type data from API
 * @returns Promise<RoomTypeResponse[]>
 */
export async function getRoomTypeData(): Promise<RoomTypeResponse[]> {
    const cached = getCachedLookup<RoomTypeResponse[]>("RoomTypeMaster");
    if (cached) return cached;
    const result = await fetchItems<RoomTypeResponse>("/RoomTypeMaster?pageNumber=1&pageSize=-1", "Failed to fetch room types");
    setCachedLookup("RoomTypeMaster", result);
    return result;
}

/**
 * Generates dropdown options for room type
 * @returns Promise<string[]>
 */
export async function getRoomTypeOptions(): Promise<string[]> {
    return getOptionsFromData(
        getRoomTypeData,
        () => 0,
        item => {
            const name = item.roomTypeName || item.description || item.roomTypeDescription || '';
            const code = item.roomTypeCode || String(item.roomTypeId || getPropertySafely(item, ['id', 'ID']));
            return name || code;
        }
    );
}
