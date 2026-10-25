import { useState, useMemo, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { getDocumentBlobUrl } from "@/lib/utils/document-client-utils";
import type { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import type { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import type { UnitRow, CoverageStatus } from "./unit-selection.types";

interface UseUnitSelectionActionsParams {
    levelState: NonNullable<ReturnType<typeof useDiscountLevelState>>;
    isUnitApplied: (unitPropId: number) => boolean;
    onEditUnit?: (row: UnitRow) => void;
    onUrlUpdate?: (params: URLSearchParams) => void;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useUnitSelectionActions({
    levelState, isUnitApplied, onEditUnit, onUrlUpdate, t,
}: UseUnitSelectionActionsParams) {
    const locale = useLocale();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const [viewerModalData, setViewerModalData] = useState<{ isOpen: boolean; fileUrl: string; fileName: string } | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | CoverageStatus>("all");

    const [localEditingUnitId, setLocalEditingUnitId] = useState<number | null>(() => {
        const p = searchParams.get("unitPropertyId");
        return p && !isNaN(Number(p)) ? Number(p) : null;
    });

    const activeEditingUnitId = useMemo(() => {
        const urlId = searchParams.get("unitPropertyId") ? Number(searchParams.get("unitPropertyId")) : null;
        if (localEditingUnitId != null && isUnitApplied(localEditingUnitId)) return localEditingUnitId;
        if (urlId != null && isUnitApplied(urlId)) return urlId;
        if (levelState.selectedUnitIds.size === 1) {
            const singleId = Array.from(levelState.selectedUnitIds)[0];
            if (isUnitApplied(singleId)) return singleId;
        }
        return localEditingUnitId ?? urlId ?? null;
    }, [localEditingUnitId, searchParams, levelState.selectedUnitIds, isUnitApplied]);

    const isRowEditing = useCallback((row: UnitRow): boolean => {
        if (activeEditingUnitId === null) return false;
        const pId = row.propertyId != null ? Number(row.propertyId) : undefined;
        const pdId = row.propertyDetailsId != null ? Number(row.propertyDetailsId) : undefined;
        const primaryId = (pId ?? pdId) as number;
        return primaryId === activeEditingUnitId || (pId != null && pId === activeEditingUnitId) || (pdId != null && pdId === activeEditingUnitId) ||
            (levelState.selectedUnitIds.size === 1 && (levelState.selectedUnitIds.has(primaryId) || (pId != null && levelState.selectedUnitIds.has(pId))) && isUnitApplied(primaryId));
    }, [activeEditingUnitId, levelState.selectedUnitIds, isUnitApplied]);

    const updateUrl = useCallback((params: URLSearchParams) => {
        if (onUrlUpdate) onUrlUpdate(params);
        else router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [onUrlUpdate, router, pathname]);

    const handleClearSelection = useCallback(() => {
        setLocalEditingUnitId(null);
        levelState.setSelectedUnitIds(new Set());
        if (searchParams.get("unitPropertyId")) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("unitPropertyId");
            updateUrl(params);
        }
    }, [levelState, searchParams, updateUrl]);

    const handleCancelEdit = useCallback(() => {
        setLocalEditingUnitId(null);
        levelState.setSelectedUnitIds(new Set());
        const params = new URLSearchParams(searchParams.toString());
        params.delete("unitPropertyId");
        updateUrl(params);
    }, [levelState, searchParams, updateUrl]);

    const handleViewUnitDocument = useCallback(async (_row: UnitRow, uploadedItem?: PropertySocialDetailsDto | SocialAttributeHierarchyDto) => {
        if (!uploadedItem?.documentGuid) {
            toast.info(t("building.noDocumentAttached") || "No document file attached for this unit.");
            return;
        }
        try {
            const { url } = await getDocumentBlobUrl(uploadedItem.documentGuid, locale);
            const attrName = 'socialAttributeName' in uploadedItem ? uploadedItem.socialAttributeName : undefined;
            setViewerModalData({ isOpen: true, fileUrl: url, fileName: attrName || `Unit_${_row.unitNo}_Document` });
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to view document");
        }
    }, [locale, t]);

    const handleEditUnit = useCallback((row: UnitRow) => {
        const unitPropId = (row.propertyId ?? row.propertyDetailsId) as number;
        setLocalEditingUnitId(unitPropId);
        levelState.setSelectedUnitIds(new Set([unitPropId]));
        const params = new URLSearchParams(searchParams.toString());
        params.set("unitPropertyId", String(unitPropId));
        updateUrl(params);
        onEditUnit?.(row);
    }, [levelState, onEditUnit, searchParams, updateUrl]);

    return {
        viewerModalData,
        setViewerModalData,
        statusFilter,
        setStatusFilter,
        localEditingUnitId,
        setLocalEditingUnitId,
        activeEditingUnitId,
        isRowEditing,
        updateUrl,
        handleClearSelection,
        handleCancelEdit,
        handleViewUnitDocument,
        handleEditUnit,
        searchParams,
    };
}
