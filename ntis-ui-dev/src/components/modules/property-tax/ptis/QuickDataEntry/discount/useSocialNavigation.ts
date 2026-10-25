import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";

interface UseSocialNavigationParams {
    levelState?: ReturnType<typeof useDiscountLevelState>;
    isWingLoading?: boolean;
    pathname: string;
    socialData: Record<number, FlatSocialAttributeState>;
    initialFlatData?: Record<number, FlatSocialAttributeState>;
    handleToggleEnabled: (id: number, checked: boolean) => void;
    handleSave: () => Promise<{ isValid: boolean; errors?: Record<string, string> } | void>;
    setSelectedId: (id: number | null) => void;
    showActiveFirst: boolean;
    setShowActiveFirst: (val: boolean) => void;
    setSearchTerm: (val: string) => void;
    isSociety?: boolean;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const useSocialNavigation = ({
    levelState,
    isWingLoading = false,
    pathname,
    socialData,
    initialFlatData,
    isSociety = true,
    handleToggleEnabled,
    handleSave,
    setSelectedId,
    showActiveFirst,
    setShowActiveFirst,
    setSearchTerm,
    t,
}: UseSocialNavigationParams) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isWingPending, startWingTransition] = useTransition();
    const [deleteSelectionCount, setDeleteSelectionCount] = useState(0);

    const updateUrl = useCallback((params: URLSearchParams) => {
        const nextUrl = `${pathname}?${params.toString()}`;
        startWingTransition(() => {
            router.push(nextUrl, { scroll: false });
        });
    }, [pathname, router]);

    const isLoadingWing = isWingLoading || isWingPending;

    const handleSelectWing = useCallback((wingDetailId: number) => {
        if (!levelState) return;
        levelState.setSelectedWingDetailId(wingDetailId);
        levelState.setWingFilter('all');
        levelState.setFloorFilter('all');
        levelState.setUseFilter('all');

        const params = new URLSearchParams(searchParams.toString());
        params.set("wingDetailId", wingDetailId.toString());
        params.delete("unitPropertyId");
        updateUrl(params);
    }, [levelState, searchParams, updateUrl]);

    const handleSelectAttribute = useCallback((id: number) => {
        setSelectedId(id);
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            params.set("socialAttributeId", id.toString());
            window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
        }
    }, [pathname, setSelectedId]);

    const handleToggleEnabledWrapped = useCallback((id: number, checked: boolean) => {
        const updateState = () => {
            setSelectedId(id);
            if (typeof window !== "undefined") {
                const params = new URLSearchParams(window.location.search);
                params.set("socialAttributeId", id.toString());
                window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
            }
        };

        const savedItem = initialFlatData ? initialFlatData[id] : null;
        const isSavedActive = savedItem ? savedItem.bitValue === true : false;
        const isStored = Boolean(
            isSavedActive && (
                (typeof savedItem?.id === "number" && savedItem.id > 0) ||
                (typeof savedItem?.documentBindingId === "number" && savedItem.documentBindingId > 0) ||
                savedItem?.isInherited
            )
        );

        if (!checked && isStored) {
            const msgKey = isSociety ? "discount.cannotToggleOffAppliedSocial" : "discount.cannotToggleOffAppliedSocialIndividual";
            const fallback = "Applied social detail cannot be turned off directly. Please use 'Delete Social & Data' to delete.";
            const msg = (typeof t.has === "function" && t.has(msgKey))
                ? t(msgKey)
                : (typeof t.has === "function" && t.has("discount.cannotToggleOffAppliedSocial") ? t("discount.cannotToggleOffAppliedSocial") : fallback);
            toast.info(msg);
            return;
        }

        handleToggleEnabled(id, checked);
        updateState();
    }, [handleToggleEnabled, pathname, t, setSelectedId, initialFlatData, isSociety]);

    const handleErrorTagClick = useCallback((id: number) => {
        if (showActiveFirst) {
            setShowActiveFirst(false);
        }
        setSearchTerm("");
        handleSelectAttribute(id);

        requestAnimationFrame(() => {
            const card = document.querySelector(`[data-certificate-id="${id}"]`);
            if (card && typeof card.scrollIntoView === "function") {
                card.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    }, [showActiveFirst, setShowActiveFirst, setSearchTerm, handleSelectAttribute]);

    const handleSaveClick = useCallback(async () => {
        const result = await handleSave();
        if (result && !result.isValid && result.errors) {
            const firstInvalidIdStr = Object.keys(result.errors)[0];
            if (firstInvalidIdStr) {
                const firstInvalidId = Number(firstInvalidIdStr);
                const findRootParentId = (attrId: number): number => {
                    const attr = socialData[attrId];
                    if (attr && attr.parentAttributeId) {
                        return findRootParentId(attr.parentAttributeId);
                    }
                    return attrId;
                };
                const rootParentId = findRootParentId(firstInvalidId);
                handleSelectAttribute(rootParentId);
                requestAnimationFrame(() => {
                    const card = document.querySelector(`[data-certificate-id="${rootParentId}"]`);
                    if (card && typeof card.scrollIntoView === "function") {
                        card.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                });
            }
        }
    }, [handleSave, socialData, handleSelectAttribute]);

    const activeWingName = levelState?.selectedWingDetailId
        ? (levelState.wings.find((w) => w.wingDetailId === levelState.selectedWingDetailId)?.wingName || null)
        : null;

    const selectedUnitNames = useMemo(() => {
        if (!levelState || levelState.level !== 'Unit') return [];
        const names = levelState.filteredUnits
            .filter((u) => levelState.selectedUnitIds.has((u.propertyId ?? u.propertyDetailsId) as number))
            .map((u) => u.unitNo)
            .filter(Boolean);
        if (names.length === 0 && searchParams.get("unitPropertyId")) {
            const uId = Number(searchParams.get("unitPropertyId"));
            const found = levelState.filteredUnits.find((u) => (u.propertyId ?? u.propertyDetailsId) === uId);
            if (found?.unitNo) return [found.unitNo];
        }
        return names;
    }, [levelState, searchParams]);

    return {
        searchParams,
        isLoadingWing,
        deleteSelectionCount,
        setDeleteSelectionCount,
        handleSelectWing,
        handleSelectAttribute,
        handleToggleEnabledWrapped,
        handleErrorTagClick,
        handleSaveClick,
        activeWingName,
        selectedUnitNames,
        updateUrl,
    };
};
