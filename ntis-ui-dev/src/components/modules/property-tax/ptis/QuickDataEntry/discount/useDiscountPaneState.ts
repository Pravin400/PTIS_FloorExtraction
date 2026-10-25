import { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { getLocalizedName } from "@/lib/utils/social-details";

interface UseDiscountPaneStateParams {
    activeSelectedId: number | null;
    selectedDiscount: DiscountAttributeState | null | undefined;
    discountData: DiscountState;
    levelState?: ReturnType<typeof useDiscountLevelState>;
    setSelectedId: (id: number) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
    };
    isWingLoading?: boolean;
}

export const useDiscountPaneState = ({
    activeSelectedId,
    selectedDiscount,
    discountData,
    levelState,
    setSelectedId,
    t,
    isWingLoading = false,
}: UseDiscountPaneStateParams) => {
    const router = useRouter();
    const pathname = usePathname();
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
        params.set("wingDetailId", String(wingDetailId));
        params.delete("unitPropertyId");
        updateUrl(params);
    }, [levelState, searchParams, updateUrl]);

    const handleEditUnit = useCallback((_row: unknown) => {
        if (activeSelectedId !== null) {
            setSelectedId(activeSelectedId);
        }
    }, [activeSelectedId, setSelectedId]);

    const handleUnitUrlUpdate = useCallback((params: URLSearchParams) => {
        updateUrl(params);
    }, [updateUrl]);

    const activeAttributeDisplayName = selectedDiscount
        ? getLocalizedName(selectedDiscount.socialAttributeCode, selectedDiscount.socialAttributeName, t as unknown as Parameters<typeof getLocalizedName>[2])
        : (activeSelectedId !== null && discountData[activeSelectedId]
            ? getLocalizedName(discountData[activeSelectedId].socialAttributeCode, discountData[activeSelectedId].socialAttributeName, t as unknown as Parameters<typeof getLocalizedName>[2])
            : undefined);

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
        isLoadingWing,
        deleteSelectionCount,
        setDeleteSelectionCount,
        handleSelectWing,
        handleEditUnit,
        handleUnitUrlUpdate,
        activeAttributeDisplayName,
        activeWingName,
        selectedUnitNames,
        searchParams,
    };
};
