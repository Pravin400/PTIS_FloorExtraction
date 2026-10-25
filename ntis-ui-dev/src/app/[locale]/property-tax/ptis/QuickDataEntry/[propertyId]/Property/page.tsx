import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import {
    PropertyBasicDetailsApiItem,
    PropertyCategoryApiItem,
    PropertyTypeApiItem,
    MoujaItem,
    TaxZoneItem
} from "@/types/property-basic-details.types";

import PropertyFormView from '@/components/modules/property-tax/ptis/QuickDataEntry/property/PropertyForm';
import { getMoujaMasterAction, getPropertyBasicDetailsAction, getPropertyCategoriesAction, getPropertyTypesAction, getTaxZonesAction } from './action';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        propertyId: string;
        locale: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PropertyFormPage({ params, searchParams }: PageProps): Promise<React.JSX.Element> {
    const { locale, propertyId } = await params;
    setRequestLocale(locale);

    const pid = Number(propertyId);

    if (isNaN(pid) || pid <= 0) {
        notFound();
    }

    const resolvedSearchParams = await searchParams;
    const wardNo = typeof resolvedSearchParams?.wardNo === 'string' ? resolvedSearchParams.wardNo : '';
    const wardId = Number(resolvedSearchParams?.wardId) || 0;
    const propertyNo = typeof resolvedSearchParams?.propertyNo === 'string' ? resolvedSearchParams.propertyNo : '';
    const partitionNo = typeof resolvedSearchParams?.partitionNo === 'string' ? resolvedSearchParams.partitionNo : '';
    const fromTab = typeof resolvedSearchParams?.from === 'string' ? resolvedSearchParams.from : '';
    const returnTab = typeof resolvedSearchParams?.returnTab === 'string' ? resolvedSearchParams.returnTab : '';

    let MoujaMasterList: MoujaItem[] = [];
    let propertyDescriptionList: PropertyTypeApiItem[] = [];
    let propertyCategoryList: PropertyCategoryApiItem[] = [];
    let propertyBasicDetails: PropertyBasicDetailsApiItem | null = null;
    let taxZonesList: TaxZoneItem[] = [];

    try {
        const [
            moujaMasterRes,
            propertyTypesRes,
            propertyCategoriesRes,
            propertyBasicDetailsRes,
            taxZonesRes
        ] = await Promise.all([
            getMoujaMasterAction(1, -1).catch(() => ({ success: true, data: [] as MoujaItem[] })),
            getPropertyTypesAction(1, -1).catch(() => ({ success: true, data: [] as PropertyTypeApiItem[] })),
            getPropertyCategoriesAction(1, -1).catch(() => ({ success: true, data: [] as PropertyCategoryApiItem[] })),
            getPropertyBasicDetailsAction(pid).catch(() => ({ success: false, data: null })),
            getTaxZonesAction(1, -1).catch(() => ({ success: true, data: [] as TaxZoneItem[] }))
        ]);

        if (moujaMasterRes?.success && Array.isArray(moujaMasterRes.data)) {
            MoujaMasterList = moujaMasterRes.data;
        }

        if (propertyTypesRes?.success && Array.isArray(propertyTypesRes.data)) {
            propertyDescriptionList = propertyTypesRes.data;
        }

        if (propertyCategoriesRes?.success && Array.isArray(propertyCategoriesRes.data)) {
            propertyCategoryList = propertyCategoriesRes.data;
        }

        if (propertyBasicDetailsRes?.success && propertyBasicDetailsRes.data) {
            propertyBasicDetails = propertyBasicDetailsRes.data;
        }

        if (taxZonesRes?.success && Array.isArray(taxZonesRes.data)) {
            taxZonesList = taxZonesRes.data;
        }
    } catch {
        // Non-blocking fallback
    }

    // Fallback if propertyBasicDetails is still null
    if (!propertyBasicDetails) {
        try {
            const { fetchIndividualQcTopSection } = await import('@/lib/api/ptis/individual');
            const individualRes = await fetchIndividualQcTopSection(pid);
            if (individualRes.success && individualRes.data) {
                const item = individualRes.data;
                const carpetSqFt = item.carpetAreasqFt != null ? Number(item.carpetAreasqFt) : (item.carpetAreaFt != null ? Number(item.carpetAreaFt) : 0);
                const carpetSqMtr = item.carpetAreasqMtr != null ? Number(item.carpetAreasqMtr) : (item.carpetAreaMtr != null ? Number(item.carpetAreaMtr) : 0);
                const builtUpSqFt = item.builtUpAreasqFt != null ? Number(item.builtUpAreasqFt) : (item.builtUpAreaFt != null ? Number(item.builtUpAreaFt) : 0);
                const builtUpSqMtr = item.builtUpAreasqMtr != null ? Number(item.builtUpAreasqMtr) : (item.builtUpAreaMtr != null ? Number(item.builtUpAreaMtr) : 0);
                const plotFt = item.plotAreaFt != null ? Number(item.plotAreaFt) : null;
                const plotMtr = item.plotAreaMtr != null ? Number(item.plotAreaMtr) : null;

                propertyBasicDetails = {
                    propertyId: Number(item.propertyId) || pid,
                    wardId: Number((item as unknown as { wardId?: number }).wardId) || wardId,
                    wardNo: String((item as unknown as { wardNo?: string }).wardNo || wardNo),
                    zoneId: Number((item as unknown as { zoneId?: number }).zoneId) || 0,
                    division: String(item.division || ''),
                    propertyNo: String(item.propertyNo || propertyNo),
                    partitionNo: String((item as unknown as { partitionNo?: string }).partitionNo || partitionNo),
                    flatOrShopNo: String(item.flatOrShopNo || ''),
                    plotNo: String(item.plotNo || ''),
                    surveyNo: String(item.surveyNo || ''),
                    taxZoneId: Number((item as unknown as { taxZoneId?: number }).taxZoneId) || 0,
                    taxZoneNo: String(item.taxZoneNo || item.taxZone || ''),
                    categoryId: Number((item as unknown as { categoryId?: number }).categoryId) || (fromTab === 'individual' || returnTab === 'individual' ? 2 : 1),
                    categoryName: String(item.categoryName || item.category || item.propertyCategory || ((fromTab === 'individual' || returnTab === 'individual') ? 'Individual' : 'Apartment')),
                    propertyTypeId: Number((item as unknown as { propertyTypeId?: number }).propertyTypeId) || 0,
                    propertyDescription: String(item.propertyDescription || ''),
                    upicId: item.upicId ? String(item.upicId) : null,
                    subZoneNo: String(item.subZoneNo || item.subZone || ''),
                    moujaId: (item as unknown as { moujaId?: number }).moujaId != null ? Number((item as unknown as { moujaId?: number }).moujaId) : null,
                    moujaName: item.moujaName ? String(item.moujaName) : null,
                    wingNo: (item as unknown as { wingNo?: string }).wingNo ? String((item as unknown as { wingNo?: string }).wingNo) : null,
                    noOfResidentialToilets: null,
                    noOfCommercialToilets: null,
                    totalCarpetAreaSqMeter: isNaN(carpetSqMtr) ? 0 : carpetSqMtr,
                    totalBuiltupAreaSqMeter: isNaN(builtUpSqMtr) ? 0 : builtUpSqMtr,
                    totalCarpetAreaSqFeet: isNaN(carpetSqFt) ? 0 : carpetSqFt,
                    totalBuiltupAreaSqFeet: isNaN(builtUpSqFt) ? 0 : builtUpSqFt,
                    plotArea: (plotFt != null && !isNaN(plotFt)) ? plotFt : (plotMtr != null && !isNaN(plotMtr) ? plotMtr : null),
                    plotAreaSqFeet: (plotFt != null && !isNaN(plotFt)) ? plotFt : null,
                    plotAreaSqMeter: (plotMtr != null && !isNaN(plotMtr)) ? plotMtr : null,
                    plotAreaFtLength: 0,
                    plotAreaFtWidth: 0,
                    plotAreaMtrLength: 0,
                    plotAreaMtrWidth: 0,
                    wingId: null,
                    wingName: null,
                    rateSectionDescription: item.rateSectionName ? String(item.rateSectionName) : null,
                    oldCarpetAreaSqFeet: item.oldCarpetAreaSqFeet != null ? Number(item.oldCarpetAreaSqFeet) : null,
                    oldCarpetAreaSqMeter: item.oldCarpetAreaSqMeter != null ? Number(item.oldCarpetAreaSqMeter) : null,
                    oldBuiltupAreaSqFeet: item.oldBuiltupAreaSqFeet != null ? Number(item.oldBuiltupAreaSqFeet) : null,
                    oldBuiltupAreaSqMeter: item.oldBuiltupAreaSqMeter != null ? Number(item.oldBuiltupAreaSqMeter) : null,
                };
            }
        } catch {
            // ignore
        }
    }

    const isIndiv = fromTab === 'individual' || returnTab === 'individual';
    const matchedCategory = propertyCategoryList.find((c) =>
        isIndiv
            ? c.propertyCategoryName?.toLowerCase().includes('individual')
            : c.propertyCategoryName?.toLowerCase().includes('apartment')
    ) ?? propertyCategoryList[0];

    const fallbackCategoryId = matchedCategory?.id ?? 0;
    const fallbackCategoryName = matchedCategory?.propertyCategoryName ?? (isIndiv ? 'Individual' : 'Apartment');

    // Last resort fallback from search parameters if propertyId is valid
    if (!propertyBasicDetails && pid > 0) {
        propertyBasicDetails = {
            propertyId: pid,
            wardId: wardId,
            wardNo: wardNo,
            zoneId: 0,
            division: '',
            propertyNo: propertyNo,
            partitionNo: partitionNo,
            flatOrShopNo: '',
            plotNo: '',
            surveyNo: '',
            taxZoneId: 0,
            taxZoneNo: '',
            categoryId: fallbackCategoryId,
            categoryName: fallbackCategoryName,
            propertyTypeId: 0,
            propertyDescription: '',
            upicId: null,
            subZoneNo: '',
            moujaId: null,
            moujaName: null,
            wingNo: null,
            noOfResidentialToilets: null,
            noOfCommercialToilets: null,
            totalCarpetAreaSqMeter: 0,
            totalBuiltupAreaSqMeter: 0,
            totalCarpetAreaSqFeet: 0,
            totalBuiltupAreaSqFeet: 0,
            plotArea: null,
            plotAreaSqFeet: null,
            plotAreaSqMeter: null,
            plotAreaFtLength: 0,
            plotAreaFtWidth: 0,
            plotAreaMtrLength: 0,
            plotAreaMtrWidth: 0,
            wingId: null,
            wingName: null,
            rateSectionDescription: null,
            oldCarpetAreaSqFeet: null,
            oldCarpetAreaSqMeter: null,
            oldBuiltupAreaSqFeet: null,
            oldBuiltupAreaSqMeter: null,
        };
    }

    return (
        <PropertyFormView
            MoujaMaster={MoujaMasterList}
            propertyCategories={propertyCategoryList}
            propertyDescriptions={propertyDescriptionList}
            propertyData={propertyBasicDetails}
            taxZones={taxZonesList}
            locale={locale}
        />
    );
}