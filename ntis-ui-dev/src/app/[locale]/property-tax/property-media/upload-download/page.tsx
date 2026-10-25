import React from "react";
import { UploadDownloadContainer } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/UploadDownloadContainer";
import {
    fetchPropertyMediaCategoryOptionsAction,
    fetchSubCategoryOptionsAction,
    fetchPropertyMediaImportMatchPreviewAction,
    fetchPropertyMediaBrowseMatchPreviewAction,
    fetchZoneOptionsAction,
    fetchWardOptionsAction,
} from "../action";
import {
    mapZonesToOptions,
    mapWardsToOptions,
    sanitizePositiveInteger
} from "@/lib/utils/PropertyMedia/propertyMediaHelper";

export const dynamic = "force-dynamic";
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;


interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        category?: string;
        subCategory?: string;
        sourceTab?: string;
        previewId?: string;
        page?: string;
        pageSize?: string;
        zone?: string;
        ward?: string;
    }>;
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
    const resolvedSearchParams = await searchParams;
    const categoryParam = resolvedSearchParams?.category;
    const parsedCategoryId = categoryParam ? Number(categoryParam) : undefined;
    const categoryId =
        parsedCategoryId && Number.isSafeInteger(parsedCategoryId) && parsedCategoryId > 0
            ? parsedCategoryId
            : undefined;
    const previewId = resolvedSearchParams?.previewId || undefined;
    const page = sanitizePositiveInteger(resolvedSearchParams?.page, 1, MAX_PAGE);
    const pageSize = sanitizePositiveInteger(resolvedSearchParams?.pageSize, 10, MAX_PAGE_SIZE);
    const zoneParam = resolvedSearchParams?.zone;
    const rawSubCategory = resolvedSearchParams?.subCategory;
    const photoTypeId = rawSubCategory ? Number(rawSubCategory) : undefined;
    const isValidPhotoType = Boolean(photoTypeId && !isNaN(photoTypeId) && photoTypeId > 0);

    const [categoryOptions, subCategoryOptions, importPreviewResult, devicePreviewData, rawZoneOptions, rawWardOptions] = await Promise.all([
        fetchPropertyMediaCategoryOptionsAction(),
        fetchSubCategoryOptionsAction(categoryId),
        isValidPhotoType
            ? fetchPropertyMediaImportMatchPreviewAction(photoTypeId, page, pageSize)
            : Promise.resolve(null),
        previewId ? fetchPropertyMediaBrowseMatchPreviewAction(previewId, page, pageSize) : Promise.resolve(null),
        fetchZoneOptionsAction(),
        zoneParam ? fetchWardOptionsAction(zoneParam) : Promise.resolve(null),
    ]);

    if (importPreviewResult && !importPreviewResult.success) {
        throw new Error(importPreviewResult.error || "Failed to fetch import match preview.");
    }
    const previewData = importPreviewResult?.success ? importPreviewResult.data ?? null : null;

    return (
        <UploadDownloadContainer
            categoryOptions={categoryOptions}
            subCategoryOptions={subCategoryOptions}
            previewData={previewData}
            devicePreviewData={devicePreviewData}
            zoneOptions={mapZonesToOptions(rawZoneOptions ?? [])}
            wardOptions={mapWardsToOptions(rawWardOptions ?? [])}
        />
    );
}
