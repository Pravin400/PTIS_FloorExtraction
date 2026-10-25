import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import type { PropertySocialDetailsDto, SocialAttributeHierarchyDto, DeletePropertySocialDetailsByHierarchyParams } from "@/types/property-social-details.types";
import { deletePropertySocialDetailsByHierarchyAction } from "@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Discount/discount-actions";
import type { UnitRow } from "./unit-selection.types";
import type { UnitSelectionItem } from "@/types/building-permission.types";

interface UseUnitBulkDeleteParams {
    levelState: NonNullable<ReturnType<typeof useDiscountLevelState>>;
    activeSelectedId?: number | null;
    activeAttributeName?: string;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    appliedUnits: (UnitRow | UnitSelectionItem)[];
    activeEditingUnitId: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    propertyId?: string | number;
    onBulkDelete?: (selectedUnitPropertyIds: number[]) => Promise<boolean | void> | void;
    onDeleteSelectionChange?: (selectedIds: Set<number>) => void;
    setLocalEditingUnitId: (id: number | null) => void;
    updateUrl: (params: URLSearchParams) => void;
    translate: (key: string, fallback: string, values?: Record<string, string | number | Date>) => string;
}

export function useUnitBulkDelete(params: UseUnitBulkDeleteParams) {
    const {
        levelState, activeSelectedId, activeAttributeName, savedPropertyDetails = [],
        appliedUnits, activeEditingUnitId, societyDetailId, wingDetailId, propertyId,
        onBulkDelete, onDeleteSelectionChange, setLocalEditingUnitId, updateUrl, translate
    } = params;

    const locale = useLocale();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { confirm } = useConfirm();

    const [selectedDeleteUnitIds, setSelectedDeleteUnitIds] = useState<Set<number>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

    const currentSelectionKey = `${activeSelectedId ?? ""}-${levelState.selectedWingDetailId ?? ""}`;
    const [prevSelectionKey, setPrevSelectionKey] = useState<string>(() => currentSelectionKey);

    if (currentSelectionKey !== prevSelectionKey) {
        setPrevSelectionKey(currentSelectionKey);
        setSelectedDeleteUnitIds(new Set());
    }

    useEffect(() => {
        onDeleteSelectionChange?.(selectedDeleteUnitIds);
    }, [selectedDeleteUnitIds, onDeleteSelectionChange]);

    const isAllAppliedUnitsSelectedForDelete = useMemo(() => {
        if (appliedUnits.length === 0) return false;
        return appliedUnits.every((u) => selectedDeleteUnitIds.has((u.propertyId ?? u.propertyDetailsId) as number));
    }, [appliedUnits, selectedDeleteUnitIds]);

    const handleToggleAllAppliedUnitsForDelete = useCallback(() => {
        setSelectedDeleteUnitIds((prev) => {
            const next = new Set(prev);
            if (isAllAppliedUnitsSelectedForDelete) {
                appliedUnits.forEach((u) => next.delete((u.propertyId ?? u.propertyDetailsId) as number));
            } else {
                appliedUnits.forEach((u) => next.add((u.propertyId ?? u.propertyDetailsId) as number));
            }
            return next;
        });
    }, [isAllAppliedUnitsSelectedForDelete, appliedUnits]);

    const handleToggleDeleteUnit = useCallback((unitPropId: number) => {
        setSelectedDeleteUnitIds((prev) => {
            const next = new Set(prev);
            if (next.has(unitPropId)) next.delete(unitPropId);
            else next.add(unitPropId);
            return next;
        });
    }, []);

    const resolvedAttributeName = useMemo(() => {
        if (activeAttributeName) return activeAttributeName;
        const item = (savedPropertyDetails || []).find((d) => {
            const attrId = 'socialAttributeId' in d && d.socialAttributeId != null ? Number(d.socialAttributeId) : Number(d.id);
            return attrId === activeSelectedId;
        });
        return item ? ('socialAttributeName' in item ? item.socialAttributeName : item.socialAttributeCode) || "" : "";
    }, [activeAttributeName, savedPropertyDetails, activeSelectedId]);

    const selectedDeleteUnitNames = useMemo(() => {
        return levelState.filteredUnits
            .filter((u) => selectedDeleteUnitIds.has((u.propertyId ?? u.propertyDetailsId) as number))
            .map((u) => u.unitNo)
            .filter(Boolean);
    }, [selectedDeleteUnitIds, levelState.filteredUnits]);

    const handleExecuteBulkDelete = useCallback(async () => {
        if (selectedDeleteUnitIds.size === 0 || !activeSelectedId) return;
        const selectedIdsArray = Array.from(selectedDeleteUnitIds);
        setIsBulkDeleting(true);

        try {
            if (onBulkDelete) {
                await onBulkDelete(selectedIdsArray);
            } else {
                const socId = societyDetailId ?? (searchParams.get("societyDetailId") ? Number(searchParams.get("societyDetailId")) : undefined);
                const wingId = wingDetailId ?? (levelState.selectedWingDetailId ? Number(levelState.selectedWingDetailId) : (searchParams.get("wingDetailId") ? Number(searchParams.get("wingDetailId")) : undefined));
                const rawPropId = propertyId ? String(propertyId) : (pathname.split("/QuickDataEntry/")[1]?.split("/")[0] || searchParams.get("propertyId") || "");

                const hierarchyParams: DeletePropertySocialDetailsByHierarchyParams = {
                    entityType: 'P',
                    socialAttributeId: Number(activeSelectedId),
                    societyDetailsId: socId,
                    wingDetailId: wingId,
                    propertyIds: selectedIdsArray,
                };

                const res = await deletePropertySocialDetailsByHierarchyAction(hierarchyParams, rawPropId, locale);
                if (!res.success) {
                    toast.error(res.error || translate("building.bulkDeleteError", "Failed to delete applied data for selected units."));
                    return;
                }
            }

            toast.success(translate("building.bulkDeleteSuccess", "Applied data deleted successfully for selected units."));
            setSelectedDeleteUnitIds(new Set());
            if (activeEditingUnitId && selectedDeleteUnitIds.has(activeEditingUnitId)) {
                setLocalEditingUnitId(null);
                const p = new URLSearchParams(searchParams.toString());
                p.delete("unitPropertyId");
                updateUrl(p);
            }
            router.refresh();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : translate("building.bulkDeleteError", "Failed to delete applied data for selected units."));
        } finally {
            setIsBulkDeleting(false);
        }
    }, [selectedDeleteUnitIds, activeSelectedId, onBulkDelete, societyDetailId, searchParams, wingDetailId, levelState.selectedWingDetailId, propertyId, pathname, locale, translate, activeEditingUnitId, setLocalEditingUnitId, updateUrl, router]);

    const handleConfirmBulkDelete = useCallback(() => {
        if (selectedDeleteUnitIds.size === 0 || !activeSelectedId) return;
        const attrName = resolvedAttributeName?.trim();
        const descKey = attrName ? "building.confirmBulkDeleteDesc" : "building.confirmBulkDeleteDescWithoutAttr";
        const defaultDesc = attrName
            ? `Are you sure you want to delete applied "${attrName}" data for ${selectedDeleteUnitIds.size} selected unit(s)? This action cannot be undone.`
            : `Are you sure you want to delete applied data for ${selectedDeleteUnitIds.size} selected unit(s)? This action cannot be undone.`;
        const descText = translate(descKey, defaultDesc, { count: selectedDeleteUnitIds.size, attributeName: attrName || "" });

        confirm({
            title: translate("building.confirmBulkDeleteTitle", "Delete Applied Unit Data"),
            description: (
                <div className="w-full flex flex-col items-center gap-2.5">
                    <p className="text-sm text-gray-600 leading-relaxed text-center max-w-[460px]">{descText}</p>
                    {selectedDeleteUnitNames.length > 0 && (
                        <div className="w-full max-w-[460px] bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 text-left">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-0.5">
                                <span>{translate("building.selectedUnits", "Selected Units")}</span>
                                <span className="text-[11px] font-semibold text-slate-600">({selectedDeleteUnitNames.length})</span>
                            </div>
                            <div className="max-h-[64px] overflow-y-auto scrollbar-thin px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 break-words leading-relaxed text-left">
                                {selectedDeleteUnitNames.join(", ")}
                            </div>
                        </div>
                    )}
                </div>
            ),
            confirmText: translate("building.deleteConfirmOk", "Yes, Delete"),
            cancelText: translate("building.deleteConfirmCancel", "Cancel"),
            variant: "delete",
            onConfirm: async () => { await handleExecuteBulkDelete(); },
        });
    }, [selectedDeleteUnitIds, activeSelectedId, resolvedAttributeName, selectedDeleteUnitNames, confirm, translate, handleExecuteBulkDelete]);

    return {
        selectedDeleteUnitIds,
        isBulkDeleting,
        isAllAppliedUnitsSelectedForDelete,
        handleToggleAllAppliedUnitsForDelete,
        handleToggleDeleteUnit,
        handleClearDeleteSelection: () => setSelectedDeleteUnitIds(new Set()),
        handleConfirmBulkDelete,
    };
}
