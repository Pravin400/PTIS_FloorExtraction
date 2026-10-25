'use server';

import { cookies } from 'next/headers';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { assetGisService } from '@/lib/api/asset-gis/asset-gis.service';
import { assetMasterService } from '@/lib/api/asset/asset-master.service';
import { fetchUnifiedAssetMedia } from '@/lib/api/asset-api/unified-asset-media.service';
import type {
    GisFilterGroup,
    GisKpiSummaryResponse,
    GisAssetPopupDetailsDto,
    GisAssetGeometryDetails,
} from '@/types/asset-gis-asset.types';
import type { ApiResponse } from '@/types/common.types';
import { logger, getErrorMessage, revalidateAllLocales } from './action-utils';

export async function getAssetGisFiltersAction(
    zoneId?: number | string | null,
    assetCategoryId?: number | string | null
): Promise<ApiResponse<GisFilterGroup[]>> {
    try {
        const res = await assetGisService.getFilters(zoneId, assetCategoryId);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getAssetGisKpisAction(
    filters: Record<string, unknown> = {}
): Promise<ApiResponse<GisKpiSummaryResponse>> {
    try {
        const res = await assetGisService.getKpis(filters);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getAssetPopupDetailsAction(
    assetId: number | string
): Promise<ApiResponse<GisAssetPopupDetailsDto>> {
    try {
        let numericId = Number(assetId);
        let resolvedAssetNo = typeof assetId === 'string' ? assetId.trim() : '';

        // 1. If not a valid numeric ID, resolve numeric AssetMasterId via AssetNo search
        if (!Number.isFinite(numericId) || numericId <= 0) {
            if (resolvedAssetNo) {
                const searchRes = await assetMasterService.getAllAssetsPaginated({
                    assetNo: resolvedAssetNo,
                    pageSize: 1
                });
                if (searchRes.success && searchRes.data) {
                    const rawData = searchRes.data as unknown as (Record<string, unknown> | Array<Record<string, unknown>>);
                    const items = Array.isArray(rawData) ? rawData : (((rawData as Record<string, unknown>).items as Array<Record<string, unknown>>) || []);
                    if (items.length > 0 && items[0].id) {
                        numericId = Number(items[0].id);
                        resolvedAssetNo = String(items[0].assetNo || resolvedAssetNo);
                    }
                }
            }
        }

        const targetLookupId = Number.isFinite(numericId) && numericId > 0 ? numericId : assetId;
        const res = await assetGisService.getAssetPopupDetails(targetLookupId);

        // Unwrap items / data properly from ASP.NET ApiResponse wrapper
        let popupData: Record<string, unknown> | null = res?.data ? (res.data as unknown as Record<string, unknown>) : null;
        if (popupData && (popupData.items || popupData.data)) {
            popupData = (popupData.items || popupData.data) as Record<string, unknown>;
        }

        if (res.success && popupData && (popupData.assetName || popupData.department || popupData.assetNo || popupData.mpmsid || (Array.isArray(popupData.photos) && popupData.photos.length > 0))) {
            const childShops = (popupData.childShops || popupData.childUnits || popupData.subUnits || []) as Array<Record<string, unknown>>;
            if ((!popupData.capitalValue || Number(popupData.capitalValue) === 0) && childShops.length > 0) {
                const totalChildCV = childShops.reduce((sum: number, s) => {
                    const cv = Number(s.capitalValue ?? s.CapitalValue ?? s.calculatedCapitalValue ?? s.subUnitCapitalValue ?? 0);
                    return sum + (Number.isFinite(cv) && cv > 0 ? cv : 0);
                }, 0);
                if (totalChildCV > 0) popupData.capitalValue = totalChildCV;
            }
            if ((!popupData.annualRevenue || Number(popupData.annualRevenue) === 0) && childShops.length > 0) {
                const totalChildRev = childShops.reduce((sum: number, s) => {
                    const rent = Number(s.monthlyRent ?? s.MonthlyRent ?? s.expectedRentPerMonth ?? s.rentAmount ?? 0);
                    const rev = Number(s.annualRevenue ?? s.AnnualRevenue ?? (rent > 0 ? rent * 12 : 0));
                    return sum + (Number.isFinite(rev) && rev > 0 ? rev : 0);
                }, 0);
                if (totalChildRev > 0) popupData.annualRevenue = totalChildRev;
            }
            return {
                success: true,
                data: popupData as unknown as GisAssetPopupDetailsDto
            };
        }

        // 2. Fallback to AssetMaster details endpoint if GIS popup details has sparse data
        if (Number.isFinite(numericId) && numericId > 0) {
            const masterRes = await assetMasterService.getAssetById(numericId);
            if (masterRes.success && masterRes.data) {
                const d = masterRes.data as unknown as Record<string, unknown>;
                const media = await fetchUnifiedAssetMedia(numericId, String(d.assetNo || resolvedAssetNo));

                // Inherit parent location, address, plot & name if this is a child shop
                let parentData: Record<string, unknown> | null = null;
                if (d.parentAssetId) {
                    try {
                        const parentRes = await assetMasterService.getAssetById(Number(d.parentAssetId));
                        if (parentRes.success && parentRes.data) {
                            parentData = parentRes.data as unknown as Record<string, unknown>;
                            if (!d.parentAssetName) d.parentAssetName = parentData.assetName || parentData.assetRegionalName;
                            if (!d.parentAssetNo) d.parentAssetNo = parentData.assetNo;
                            if (!d.address && parentData.address) d.address = parentData.address;
                            if (!d.latitude && parentData.latitude) d.latitude = parentData.latitude;
                            if (!d.longitude && parentData.longitude) d.longitude = parentData.longitude;
                            if (!d.plotNo && parentData.plotNo) d.plotNo = parentData.plotNo;
                            if (!d.citySurveyNo && (parentData.citySurveyNo || parentData.citySurveyNumber || parentData.ctsNo)) {
                                d.citySurveyNo = parentData.citySurveyNo || parentData.citySurveyNumber || parentData.ctsNo;
                            }
                            if (!d.plotArea && !d.totalAreaSqFeet && (parentData.plotArea || parentData.totalAreaSqFeet)) {
                                d.totalAreaSqFeet = parentData.totalAreaSqFeet || parentData.plotArea;
                            }
                        }
                    } catch (e) {
                        logger.warn('[getAssetPopupDetailsAction] parent fetch failed', { operation: 'getAssetPopupDetailsAction' }, e);
                    }
                }

                const resolvedLat = d.latitude || parentData?.latitude || null;
                const resolvedLng = d.longitude || parentData?.longitude || null;

                const parentAssetObj = d.parentAsset as Record<string, unknown> | undefined;
                const leaseDetailsObj = d.leaseDetails as Record<string, unknown> | undefined;

                const mappedDto = {
                    assetId: numericId,
                    assetNo: d.assetNo || resolvedAssetNo || String(assetId),
                    assetName: d.assetName || d.assetRegionalName || '',
                    assetRegionalName: d.assetRegionalName || '',
                    assetType: d.assetTypeName || d.typeName || '',
                    assetTypeName: d.assetTypeName || d.typeName || '',
                    categoryName: d.categoryName || d.assetCategoryName || '',
                    department: d.departmentName || '',
                    departmentName: d.departmentName || '',
                    inCharge: d.inChargeName || '',
                    inChargeName: d.inChargeName || '',
                    inChargeMobile: d.inChargeMobile || d.mobileNo || '',
                    mobileNo: d.inChargeMobile || d.mobileNo || '',
                    encroachment: d.encroachmentStatus || 'No',
                    encroachmentStatus: d.encroachmentStatus || 'No',
                    plotNo: d.plotNo || parentData?.plotNo || '',
                    citySurveyNo: d.citySurveyNo || d.citySurveyNumber || d.ctsNo || d.csn || d.CitySurveyNo || parentData?.citySurveyNo || parentData?.ctsNo || '',
                    plotAreaSqFt: d.plotArea || d.totalAreaSqFeet || parentData?.plotArea || parentData?.totalAreaSqFeet || 0,
                    totalAreaSqFeet: d.totalAreaSqFeet || d.plotArea || parentData?.totalAreaSqFeet || parentData?.plotArea || 0,
                    formattedPlotArea: (d.totalAreaSqFeet || parentData?.totalAreaSqFeet) ? `${Number(d.totalAreaSqFeet || parentData?.totalAreaSqFeet).toLocaleString()} sq.ft` : '',
                    carpetAreaSqFt: d.carpetAreaSqFeet || d.carpetArea || 0,
                    carpetAreaSqFeet: d.carpetAreaSqFeet || d.carpetArea || 0,
                    formattedCarpetArea: d.carpetAreaSqFeet ? `${Number(d.carpetAreaSqFeet).toLocaleString()} sq.ft` : '',
                    builtUpAreaSqFt: d.builtUpAreaSqFeet || d.builtUpArea || 0,
                    builtUpAreaSqFeet: d.builtUpAreaSqFeet || d.builtUpArea || 0,
                    formattedBuiltUpArea: d.builtUpAreaSqFeet ? `${Number(d.builtUpAreaSqFeet).toLocaleString()} sq.ft` : '',
                    totalAreaSqMeter: d.totalAreaSqMeter || d.landAreaSqMeter || 0,
                    constYear: d.constructionYear ? String(d.constructionYear) : (parentData?.constructionYear ? String(parentData.constructionYear) : ''),
                    constructionYear: d.constructionYear ? String(d.constructionYear) : (parentData?.constructionYear ? String(parentData.constructionYear) : ''),
                    totalFloors: d.totalFloors ?? (parentData?.totalFloors ?? 1),
                    roomsOrUnits: d.noOfRooms || (parentData?.noOfRooms || 0),
                    noOfRooms: d.noOfRooms || (parentData?.noOfRooms || 0),
                    address: d.address || d.location || parentData?.address || parentData?.location || '',
                    latitude: resolvedLat,
                    longitude: resolvedLng,
                    parentLatitude: parentData?.latitude || null,
                    parentLongitude: parentData?.longitude || null,
                    parentAddress: parentData?.address || parentData?.location || null,
                    parentPlotNo: parentData?.plotNo || null,
                    parentCitySurveyNo: parentData?.citySurveyNo || parentData?.ctsNo || null,
                    capitalValue: Number(d.currentMarketValue ?? d.CurrentMarketValue ?? d.capitalValue ?? d.CapitalValue ?? d.totalCapitalValue ?? d.TotalCapitalValue ?? d.calculatedCapitalValue ?? d.CalculatedCapitalValue ?? d.purchaseValue ?? d.PurchaseValue ?? d.assetValue ?? d.AssetValue ?? 0),
                    annualRevenue: Number(d.annualRevenue ?? d.AnnualRevenue ?? (d.expectedRentPerMonth || d.ExpectedRentPerMonth ? Number(d.expectedRentPerMonth || d.ExpectedRentPerMonth) * 12 : (d.monthlyRent || d.MonthlyRent ? Number(d.monthlyRent || d.MonthlyRent) * 12 : (leaseDetailsObj?.rentAmount ? Number(leaseDetailsObj.rentAmount) * 12 : 0)))),
                    parentAssetId: d.parentAssetId || null,
                    parentAssetName: d.parentAssetName || parentData?.assetName || parentAssetObj?.assetName || null,
                    parentAssetNo: d.parentAssetNo || parentData?.assetNo || parentAssetObj?.assetNo || null,
                    tenantName: d.tenantName || leaseDetailsObj?.tenantName || null,
                    monthlyRent: d.monthlyRent || d.MonthlyRent || d.expectedRentPerMonth || d.ExpectedRentPerMonth || leaseDetailsObj?.rentAmount || null,
                    formattedMonthlyRent: (d.monthlyRent || d.MonthlyRent || d.expectedRentPerMonth || d.ExpectedRentPerMonth || leaseDetailsObj?.rentAmount) ? `₹ ${Number(d.monthlyRent || d.MonthlyRent || d.expectedRentPerMonth || d.ExpectedRentPerMonth || leaseDetailsObj?.rentAmount).toLocaleString('en-IN')}` : null,
                    googleMapLink: d.googleMapLink || (resolvedLat && resolvedLng ? `https://www.google.com/maps?q=${resolvedLat},${resolvedLng}` : ''),
                    link360: d.link360 || parentData?.link360 || '',
                    photos: media.photos.map((p) => ({
                        photoId: p.id,
                        photoUrl: p.url,
                        fileUrl: p.url,
                        label: p.label || p.bindingPurpose || 'Asset Photo',
                        photoType: p.type === 'plan' ? 'plan' : 'photo',
                    })),
                    documents: media.documents.map((doc) => ({
                        documentId: doc.id,
                        id: doc.id,
                        documentName: doc.name,
                        fileName: doc.name,
                        fileUrl: doc.url,
                        customUrl: doc.url,
                        documentTypeName: doc.documentTypeName,
                        documentDefinitionName: doc.documentDefinitionName,
                        contentType: doc.contentType,
                    })),
                    childUnits: (d.childUnits || d.subUnits || d.units || []) as Array<Record<string, unknown>>,
                    childShops: (d.childShops || d.childUnits || d.subUnits || []) as Array<Record<string, unknown>>,
                };
                return { success: true, data: mappedDto as unknown as GisAssetPopupDetailsDto };
            }
        }

        return res as ApiResponse<GisAssetPopupDetailsDto>;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function searchPropertiesAction(
    query: string,
    _type: string = 'all'
): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    try {
        const clean = query ? query.trim() : '';
        if (!clean || clean.length < 2) return { success: true, data: [] };

        let items: Array<Record<string, unknown>> = [];

        try {
            const assetRes = await assetMasterService.getAllAssetsPaginated({
                searchTerm: clean,
                pageSize: 25
            });
            if (assetRes && assetRes.success && assetRes.data) {
                const rawData = assetRes.data as unknown as (Record<string, unknown> | Array<Record<string, unknown>>);
                const raw = Array.isArray(rawData) ? rawData : (((rawData as Record<string, unknown>).items as Array<Record<string, unknown>>) || []);
                if (raw.length > 0) {
                    items = raw.map((a) => {
                        const rec = a as Record<string, unknown>;
                        return {
                            AssetNo: rec.assetNo || rec.upicId || rec.code || String(rec.id),
                            assetNo: rec.assetNo || rec.upicId || rec.code || String(rec.id),
                            OwnerID: rec.assetNo || rec.upicId || String(rec.id),
                            ownerID: rec.assetNo || rec.upicId || String(rec.id),
                            AssetName: rec.assetName || rec.assetRegionalName || rec.name || '',
                            assetName: rec.assetName || rec.assetRegionalName || rec.name || '',
                            OwnerName: rec.assetName || rec.assetRegionalName || rec.name || '',
                            Address: rec.address || rec.location || '',
                            address: rec.address || rec.location || '',
                            Mobile: rec.inChargeMobile || rec.mobileNo || '',
                            mobile: rec.inChargeMobile || rec.mobileNo || '',
                            Latitude: rec.latitude || rec.centroidY,
                            latitude: rec.latitude || rec.centroidY,
                            Longitude: rec.longitude || rec.centroidX,
                            longitude: rec.longitude || rec.centroidX,
                            assetId: rec.id,
                            id: rec.id,
                            plotNo: rec.plotNo || '',
                            citySurveyNo: rec.citySurveyNo || rec.ctsNo || '',
                        };
                    });
                }
            }
        } catch (err) {
            logger.warn('[searchPropertiesAction] AssetMaster search lookup error', { operation: 'searchPropertiesAction' }, err);
        }

        return { success: true, data: items };
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error), data: [] };
    }
}

export async function getPropertyDetailAction(
    ownerId: string | number,
    _filters?: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
    try {
        const fallbackRes = await getAssetPopupDetailsAction(ownerId);
        return fallbackRes as ApiResponse<unknown>;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function identifyAssetAction(lat: number, lng: number): Promise<ApiResponse<GisAssetGeometryDetails>> {
    try {
        const res = await assetGisService.identifyAsset(lat, lng);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getAssetGeometryDetailsAction(targetId: string | number): Promise<ApiResponse<GisAssetGeometryDetails>> {
    try {
        const res = await assetGisService.getAssetGeometry(targetId);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGeometryAction(targetId: string | number): Promise<ApiResponse<GisAssetGeometryDetails>> {
    return getAssetGeometryDetailsAction(targetId);
}

export async function getQcStatusAction(_ownerId: string | number): Promise<ApiResponse<Record<string, unknown> | null>> {
    return { success: true, data: null };
}

export async function getTrackingAction(_ownerId: string | number): Promise<ApiResponse<Record<string, unknown> | null>> {
    return { success: true, data: null };
}

export async function exportAssetExcelAction(filters: Record<string, unknown> = {}): Promise<ApiResponse<string>> {
    try {
        const res = await assetGisService.exportExcel(filters);
        const data = (res.data ?? res.items) as string | undefined;
        return {
            success: res.success,
            data,
            error: res.message || (res.errors ? res.errors[0] : undefined),
            statusCode: res.statusCode,
        };
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function exportAssetGisExcelAction(filters: Record<string, unknown> = {}): Promise<ApiResponse<string>> {
    return exportAssetExcelAction(filters);
}

export async function uploadAssetGeoJsonAction(formData: FormData, mode = 'replace'): Promise<ApiResponse<unknown>> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, error: 'Unauthorized: User session expired', statusCode: 401 };
        }
        const res = await assetGisService.uploadGeoJson(formData, mode);
        if (res.success) {
            revalidateAllLocales('/assets/gismapviewer');
        }
        return res;
    } catch (error: unknown) {
        logger.error('uploadAssetGeoJsonAction failed', { operation: 'uploadAssetGeoJsonAction' }, error);
        return { success: false, error: getErrorMessage(error) };
    }
}
