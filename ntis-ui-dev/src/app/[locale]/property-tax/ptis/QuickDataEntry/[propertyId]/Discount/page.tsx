
import { setRequestLocale } from 'next-intl/server';
import DiscountFormview from "@/components/modules/property-tax/ptis/QuickDataEntry/discount/DiscountFormview";
import {
    getDiscountDetailsAction, getSocialAttributeMasterAction, getDiscountWingsAction,
    getDiscountUnitsAction, getPropertySocialDetailsByFiltersAction
} from './discount-actions';
import { getPropertySocialInfoAction } from './social-actions';
import { getPropertyBasicDetailsAction } from '../FloorSubmission/actions';
import { getDocumentViewUrl } from "@/lib/utils/document-utils";
import { getSocietyDetailsByProperty } from "@/lib/api/societyDetails.services";
import type { WingOption, UnitSelectionItem } from "@/types/building-permission.types";
import type { PropertySocialDetailsDto } from "@/types/property-social-details.types";

export const dynamic = 'force-dynamic';
interface PageProps {
    params: Promise<{ locale: string; propertyId: string }>;
    searchParams: Promise<{
        view?: string;
        propertyCategory?: string;
        category?: string;
        societyDetailId?: string;
        societyId?: string;
        wingDetailId?: string | string[];
        level?: string;
        socialAttributeId?: string;
        isWingWise?: string;
        unitPropertyId?: string;
        propertyId?: string;
        parentPropertyId?: string;
        returnTab?: string;
        from?: string;
        [key: string]: string | string[] | undefined;
    }>;
}

export default async function DiscountFormPage({ params, searchParams }: PageProps) {
    const { locale, propertyId } = await params;
    const resolvedSearchParams = await searchParams;
    const activeTab = resolvedSearchParams.view || "discount";

    setRequestLocale(locale);

    // Preload master social attributes in parallel with property basic details to eliminate sequential waterfall
    const masterAttributesPromise = getSocialAttributeMasterAction();
    const propertyBasicDetails = await getPropertyBasicDetailsAction(propertyId);
    const pb = (propertyBasicDetails || {}) as Record<string, unknown>;

    const sp = resolvedSearchParams;
    const targetPropId = sp.parentPropertyId ? Number(sp.parentPropertyId) : Number(propertyId);
    const sCat = String(sp.propertyCategory || sp.category || '').toLowerCase();
    const bCat = String(pb.categoryName || pb.propertyCategoryName || '').toLowerCase();
    const rawReturnTab = String(sp.returnTab || '').toLowerCase();
    const rawFrom = String(sp.from || '').toLowerCase();
    const isExplicitIndividual =
        rawReturnTab === 'individual' ||
        rawFrom === 'individual' ||
        sCat.includes('individual') ||
        bCat.includes('individual');
    const isExplicitApartment =
        sCat.includes('apartment') ||
        sCat.includes('society') ||
        sCat.includes('flat') ||
        sCat.includes('complex') ||
        bCat.includes('apartment') ||
        bCat.includes('society') ||
        bCat.includes('flat') ||
        bCat.includes('complex');
    const isWingWise = sp.isWingWise === 'true';

    let searchSocietyId = sp.societyDetailId || sp.societyId || pb.societyDetailId || pb.societyId;
    if (!searchSocietyId && targetPropId > 0 && !isExplicitIndividual) {
        try {
            const socRes = await getSocietyDetailsByProperty(targetPropId);
            const socItems = Array.isArray(socRes?.items) ? socRes.items : [];
            if (socItems.length > 0 && socItems[0]?.id) {
                searchSocietyId = String(socItems[0].id);
            }
        } catch {
            // ignore
        }
    }

    if (!searchSocietyId && Number(propertyId) !== targetPropId && Number(propertyId) > 0 && !isExplicitIndividual) {
        try {
            const socRes = await getSocietyDetailsByProperty(Number(propertyId));
            const socItems = Array.isArray(socRes?.items) ? socRes.items : [];
            if (socItems.length > 0 && socItems[0]?.id) {
                searchSocietyId = String(socItems[0].id);
            }
        } catch {
            // ignore
        }
    }

    const hasSocietyId = Boolean(
        (searchSocietyId && String(searchSocietyId) !== '0') ||
        (pb.societyDetailId && Number(pb.societyDetailId) > 0) ||
        (pb.societyId && Number(pb.societyId) > 0)
    );

    const isSociety = !isExplicitIndividual && (isExplicitApartment || hasSocietyId);

    let discountResponse: Awaited<ReturnType<typeof getDiscountDetailsAction>> | { data: null } = { data: null };
    let socialResponse: Awaited<ReturnType<typeof getPropertySocialInfoAction>> | { data: { items: null } } = { data: { items: null } };
    let socialAttributeMaster: Awaited<ReturnType<typeof getSocialAttributeMasterAction>> = { success: true, data: [] };
    let mappedWings: WingOption[] = [];
    let mappedUnits: UnitSelectionItem[] = [];
    let savedDetails: PropertySocialDetailsDto[] = [];
    let allAppliedDetails: PropertySocialDetailsDto[] = [];
    let finalWingDetailId: number | null = null;
    let targetUnitPropId: number | undefined;
    const level = sp.level || (isWingWise ? 'Wing' : 'Apartment');

    if (isSociety) {
        // For society, call master API and also fetch wings and units
        const rawWingDetailId = sp.wingDetailId;
        const searchWingDetailId = Array.isArray(rawWingDetailId) ? rawWingDetailId[0] : rawWingDetailId;
        const parsedWingDetailId = searchWingDetailId ? Number(searchWingDetailId) : null;

        const wingsResponse = await getDiscountWingsAction(propertyId, searchSocietyId ? Number(searchSocietyId) : undefined);
        mappedWings = wingsResponse?.success && Array.isArray(wingsResponse?.data) ? wingsResponse.data : [];

        if (!searchSocietyId && mappedWings.length > 0) {
            const firstW = mappedWings[0] as unknown as Record<string, unknown>;
            const wingSocId = firstW.societyDetailId || firstW.SocietyDetailId || firstW.societyId || firstW.SocietyId;
            if (wingSocId) {
                searchSocietyId = String(wingSocId);
            }
        }

        finalWingDetailId = parsedWingDetailId;
        if (!finalWingDetailId && mappedWings.length > 0) {
            finalWingDetailId = mappedWings[0].wingDetailId;
        }

        targetUnitPropId = sp.unitPropertyId
            ? Number(sp.unitPropertyId)
            : (level === 'Unit' && sp.propertyId && sp.propertyId !== String(searchSocietyId) ? Number(sp.propertyId) : undefined);

        const socIdNum = searchSocietyId ? Number(searchSocietyId) : undefined;

        // Fetch master attributes, units, and hierarchical levels in parallel
        const [masterRes, unitsResponse, apartmentDetailsRes, wingDetailsRes, unitDetailsRes] = await Promise.all([
            masterAttributesPromise,
            finalWingDetailId && finalWingDetailId > 0
                ? getDiscountUnitsAction(propertyId, finalWingDetailId, 1, 1000)
                : Promise.resolve({ success: true, data: { items: [], totalCount: 0 } }),
            socIdNum
                ? getPropertySocialDetailsByFiltersAction(undefined, socIdNum)
                : Promise.resolve({ success: true, data: [] as PropertySocialDetailsDto[] }),
            (socIdNum && finalWingDetailId && (level === 'Wing' || level === 'Unit'))
                ? getPropertySocialDetailsByFiltersAction(undefined, socIdNum, finalWingDetailId)
                : Promise.resolve({ success: true, data: [] as PropertySocialDetailsDto[] }),
            (socIdNum && targetUnitPropId && level === 'Unit')
                ? getPropertySocialDetailsByFiltersAction(undefined, socIdNum, finalWingDetailId || undefined, targetUnitPropId)
                : Promise.resolve({ success: true, data: [] as PropertySocialDetailsDto[] })
        ]);

        socialAttributeMaster = masterRes;
        mappedUnits = unitsResponse?.success && unitsResponse?.data?.items && Array.isArray(unitsResponse.data.items) ? unitsResponse.data.items : [];

        // Hierarchical top-down merge: Apartment -> Wing -> Unit
        const mergedDetailsMap = new Map<number, PropertySocialDetailsDto>();

        // 1. Apartment level attributes (baseline)
        const apartmentItems = (apartmentDetailsRes?.success && Array.isArray(apartmentDetailsRes.data)) ? apartmentDetailsRes.data : [];
        const wingItems = (wingDetailsRes?.success && Array.isArray(wingDetailsRes.data)) ? wingDetailsRes.data : [];
        const unitItems = (unitDetailsRes?.success && Array.isArray(unitDetailsRes.data)) ? unitDetailsRes.data : [];

        apartmentItems.forEach(item => {
            mergedDetailsMap.set(item.socialAttributeId, {
                ...item,
                entityType: item.entityType || 'S',
                inheritanceLevel: level === 'Apartment' ? 'Self' : 'Apartment',
                inheritedFrom: level === 'Apartment' ? null : 'Apartment',
            });
        });

        // 2. Wing level overrides (applied when level === 'Wing' or level === 'Unit')
        if (level === 'Wing' || level === 'Unit') {
            wingItems.forEach(item => {
                const isWingEntity = item.entityType === 'W' || (item.wingDetailId && !item.propertyId);
                if (isWingEntity) {
                    mergedDetailsMap.set(item.socialAttributeId, {
                        ...item,
                        entityType: 'W',
                        inheritanceLevel: level === 'Wing' ? 'Self' : 'Wing',
                        inheritedFrom: level === 'Wing' ? null : 'Wing',
                    });
                }
            });
        }

        // 3. Unit level overrides (applied when level === 'Unit')
        if (level === 'Unit') {
            unitItems.forEach(item => {
                const isUnitEntity = item.entityType === 'P' || (item.propertyId && item.propertyId > 0);
                if (isUnitEntity) {
                    mergedDetailsMap.set(item.socialAttributeId, {
                        ...item,
                        entityType: 'P',
                        inheritanceLevel: 'Self',
                        inheritedFrom: null,
                    });
                }
            });
        }

        savedDetails = Array.from(mergedDetailsMap.values());

        const allAppliedMap = new Map<string, PropertySocialDetailsDto>();
        [...apartmentItems, ...wingItems, ...unitItems].forEach(item => {
            const key = item.id ? `id-${item.id}` : `${item.socialAttributeId}-${item.entityType}-${item.wingDetailId ?? '0'}-${item.propertyId ?? '0'}`;
            allAppliedMap.set(key, item);
        });
        allAppliedDetails = Array.from(allAppliedMap.values());

        // dataType and the document/photo flags only exist on the master list.
        const masterById = new Map((masterRes.data || []).map(a => [a.id, a]));
        const activeMasterById = new Map((masterRes.data || []).filter(a => a.isActive !== false).map(a => [a.id, a]));

        // Filter saved details so discount tab strictly gets active discount attributes and social tab strictly gets active social attributes
        const discountSavedDetails = savedDetails.filter(item => {
            const master = activeMasterById.get(item.socialAttributeId);
            return master?.isDiscountApplicable === true;
        });

        const socialSavedDetails = savedDetails.filter(item => {
            const master = activeMasterById.get(item.socialAttributeId);
            return master && master.isDiscountApplicable === false;
        });

        const mapToItem = (item: PropertySocialDetailsDto, isDiscount: boolean) => {
            const master = masterById.get(item.socialAttributeId);
            const docGuid = item.documentGuid || item.photoGuid || null;
            const docBindingId = item.documentBindingId || item.photoBindingId || null;
            return {
                id: item.socialAttributeId,
                socialAttributeCode: item.socialAttributeCode || master?.socialAttributeCode || '',
                socialAttributeName: item.socialAttributeName || master?.socialAttributeName || (item.socialAttributeCode ? item.socialAttributeCode : `Attribute #${item.socialAttributeId}`),
                dataType: master?.dataType || 'BIT',
                unit: master?.unit,
                displayOrder: master?.displayOrder,
                isPhotoRequired: master?.isPhotoRequired,
                isDocumentRequired: master?.isDocumentRequired,
                isActive: master?.isActive,
                isDiscountApplicable: master?.isDiscountApplicable ?? isDiscount,
                isCommonAreaAttribute: Boolean(master?.isCommonAreaAttribute ?? item.isCommonAreaAttribute),
                propertySocialDetailId: item.id,
                bitValue: item.bitValue,
                intValue: item.intValue,
                decimalValue: item.decimalValue,
                textValue: item.textValue,
                dateValue: item.dateValue,
                documentBindingId: docBindingId,
                documentGuid: docGuid,
                documentUrl: item.documentUrl || getDocumentViewUrl(docGuid) || undefined,
                fileName: item.fileName,
                photoGuid: docGuid,
                photoBindingId: docBindingId,
                remark: item.remark,
                entityType: item.entityType,
                inheritedFrom: item.inheritedFrom,
                inheritanceLevel: item.inheritanceLevel,
                parentAttributeId: master?.parentAttributeId ?? null,
                isRequiredWhenParentTrue: master?.isRequiredWhenParentTrue ?? false,
            };
        };

        discountResponse = {
            success: true,
            data: {
                propertyId: Number(propertyId),
                discountAttributes: discountSavedDetails.map(item => mapToItem(item, true))
            }
        };

        socialResponse = {
            success: true,
            data: {
                success: true,
                message: "Success",
                items: {
                    propertyId: Number(propertyId),
                    societyDetailId: socIdNum,
                    wingDetailId: finalWingDetailId,
                    socialAttributes: socialSavedDetails.map(item => ({
                        ...mapToItem(item, false),
                        parentAttributeId: masterById.get(item.socialAttributeId)?.parentAttributeId ?? null,
                        isRequiredWhenParentTrue: masterById.get(item.socialAttributeId)?.isRequiredWhenParentTrue ?? false,
                        photoTypeId: null,
                        children: []
                    }))
                }
            }
        };
    } else {
        // For individuals, fetch dynamic social & discount details and master attributes in parallel
        const [individualDetailsRes, masterRes] = await Promise.all([
            getPropertySocialDetailsByFiltersAction(undefined, undefined, undefined, Number(propertyId)),
            masterAttributesPromise
        ]);

        socialAttributeMaster = masterRes;
        const individualItems = (individualDetailsRes?.success && Array.isArray(individualDetailsRes.data)) ? individualDetailsRes.data : [];

        const dedupedDetailsMap = new Map<number, PropertySocialDetailsDto>();
        individualItems.forEach(item => {
            const existing = dedupedDetailsMap.get(item.socialAttributeId);
            if (!existing || (item.id && (!existing.id || item.id > existing.id))) {
                dedupedDetailsMap.set(item.socialAttributeId, item);
            }
        });

        savedDetails = Array.from(dedupedDetailsMap.values()).map(item => ({
            ...item,
            entityType: 'P',
            inheritanceLevel: 'Self',
            inheritedFrom: null,
        }));
        allAppliedDetails = savedDetails;

        const masterById = new Map((masterRes.data || []).map(a => [a.id, a]));
        const activeMasterById = new Map((masterRes.data || []).filter(a => a.isActive !== false).map(a => [a.id, a]));

        const discountSavedDetails = savedDetails.filter(item => {
            const master = activeMasterById.get(item.socialAttributeId);
            return master?.isDiscountApplicable === true;
        });

        const socialSavedDetails = savedDetails.filter(item => {
            const master = activeMasterById.get(item.socialAttributeId);
            return master && master.isDiscountApplicable === false;
        });

        const mapToItem = (item: PropertySocialDetailsDto, isDiscount: boolean) => {
            const master = masterById.get(item.socialAttributeId);
            const docGuid = item.documentGuid || item.photoGuid || null;
            const docBindingId = item.documentBindingId || item.photoBindingId || null;
            return {
                id: item.socialAttributeId,
                socialAttributeCode: item.socialAttributeCode || master?.socialAttributeCode || '',
                socialAttributeName: item.socialAttributeName || master?.socialAttributeName || (item.socialAttributeCode ? item.socialAttributeCode : `Attribute #${item.socialAttributeId}`),
                dataType: master?.dataType || 'BIT',
                unit: master?.unit,
                displayOrder: master?.displayOrder,
                isPhotoRequired: master?.isPhotoRequired,
                isDocumentRequired: master?.isDocumentRequired,
                isActive: master?.isActive,
                isDiscountApplicable: master?.isDiscountApplicable ?? isDiscount,
                isCommonAreaAttribute: Boolean(master?.isCommonAreaAttribute ?? item.isCommonAreaAttribute),
                propertySocialDetailId: item.id,
                bitValue: item.bitValue,
                intValue: item.intValue,
                decimalValue: item.decimalValue,
                textValue: item.textValue,
                dateValue: item.dateValue,
                documentBindingId: docBindingId,
                documentGuid: docGuid,
                documentUrl: item.documentUrl || getDocumentViewUrl(docGuid) || undefined,
                fileName: item.fileName,
                photoGuid: docGuid,
                photoBindingId: docBindingId,
                remark: item.remark,
                entityType: item.entityType || 'P',
                inheritedFrom: null,
                inheritanceLevel: 'Self',
            };
        };

        discountResponse = {
            success: true,
            data: {
                propertyId: Number(propertyId),
                discountAttributes: discountSavedDetails.map(item => mapToItem(item, true))
            }
        };

        socialResponse = {
            success: true,
            data: {
                success: true,
                message: "Success",
                items: {
                    propertyId: Number(propertyId),
                    societyDetailId: undefined,
                    wingDetailId: undefined,
                    socialAttributes: socialSavedDetails.map(item => ({
                        ...mapToItem(item, false),
                        parentAttributeId: masterById.get(item.socialAttributeId)?.parentAttributeId ?? null,
                        isRequiredWhenParentTrue: masterById.get(item.socialAttributeId)?.isRequiredWhenParentTrue ?? false,
                        photoTypeId: null,
                        children: []
                    }))
                }
            }
        };
    }

    const initialDiscountData = discountResponse.data ?? null;
    const initialSocialData = socialResponse.data?.items ?? null;

    // Separate master attributes based on isDiscountApplicable and only include active master attributes
    const masterAttributes = (socialAttributeMaster.data || []).filter(a => a.isActive !== false);
    const discountMasterAttributes = masterAttributes.filter(a => a.isDiscountApplicable === true);
    const socialMasterAttributes = masterAttributes.filter(a => a.isDiscountApplicable === false);

    return (
        <DiscountFormview
            key={`${propertyId}-${activeTab}-${level}-${finalWingDetailId ?? 'na'}-${targetUnitPropId ?? 'all'}`}
            initialDiscountData={initialDiscountData}
            initialSocialData={initialSocialData}
            propertyId={propertyId}
            isSociety={isSociety}
            societyDetailId={searchSocietyId ? Number(searchSocietyId) : undefined}
            wingDetailId={finalWingDetailId ?? undefined}
            discountMasterAttributes={discountMasterAttributes}
            socialMasterAttributes={socialMasterAttributes}
            wings={mappedWings}
            units={mappedUnits}
            savedPropertyDetails={allAppliedDetails.length > 0 ? allAppliedDetails : savedDetails}
        />
    );
}