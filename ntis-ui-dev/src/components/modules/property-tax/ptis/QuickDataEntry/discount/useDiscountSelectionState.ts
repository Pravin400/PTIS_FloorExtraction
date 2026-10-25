import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { SocialAttribute } from "@/types/social-attribute.types";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { getFilteredDiscounts } from "@/lib/utils/discount-helpers";
import { ReadonlyURLSearchParams } from "next/navigation";

interface UseDiscountSelectionStateParams {
    discountData: DiscountState;
    discountMasterAttributes: SocialAttribute[];
    initialDiscountAttributes?: { id: number; isCommonAreaAttribute?: boolean }[];
    searchParams: ReadonlyURLSearchParams;
    pathname: string;
    handleToggleEnabled: (id: number, checked: boolean) => void;
    handleSave: () => Promise<{ isValid: boolean; incompleteDiscounts?: { id: number; name: string }[] } | void>;
    isSociety: boolean;
    levelState?: ReturnType<typeof useDiscountLevelState>;
    editingUnitId: number | null;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const useDiscountSelectionState = ({
    discountData,
    discountMasterAttributes,
    initialDiscountAttributes = [],
    searchParams,
    pathname,
    handleToggleEnabled,
    handleSave,
    isSociety,
    levelState,
    editingUnitId,
    t,
}: UseDiscountSelectionStateParams) => {
    const paramAttributeId = useMemo(() => {
        const param = searchParams.get("socialAttributeId");
        return param && !isNaN(Number(param)) ? Number(param) : null;
    }, [searchParams]);

    const [userSelectedId, setUserSelectedId] = useState<number | null>(null);
    const [prevParamAttributeId, setPrevParamAttributeId] = useState<number | null>(paramAttributeId);

    if (paramAttributeId !== prevParamAttributeId) {
        setPrevParamAttributeId(paramAttributeId);
        setUserSelectedId(null);
    }

    const selectedId = userSelectedId ?? paramAttributeId;
    const [searchTerm, setSearchTerm] = useState("");
    const [showActiveFirst, setShowActiveFirst] = useState(false);

    const isUnitLevel = Boolean(isSociety && levelState?.level === 'Unit');

    const activeSelectedId = useMemo(() => {
        if (selectedId !== null) {
            const findRoot = (id: number): number => {
                const item = discountData[id] || discountMasterAttributes.find((a) => a.id === id);
                if (item?.parentAttributeId) {
                    return findRoot(item.parentAttributeId);
                }
                return id;
            };
            const rootId = findRoot(selectedId);
            const exists = discountData[rootId];
            if (exists && (!isUnitLevel || !exists.isCommonAreaAttribute)) return rootId;
        }
        const rootDiscounts = (discountMasterAttributes.length > 0
            ? discountMasterAttributes
            : initialDiscountAttributes).filter((d) => !('parentAttributeId' in d && d.parentAttributeId));
        const available = isUnitLevel
            ? rootDiscounts.filter((d) => !d.isCommonAreaAttribute)
            : rootDiscounts;
        return available.length > 0 ? available[0].id : null;
    }, [discountData, selectedId, initialDiscountAttributes, discountMasterAttributes, isUnitLevel]);

    const handleSelectDiscount = useCallback((id: number) => {
        setUserSelectedId(id);
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            params.set("socialAttributeId", id.toString());
            window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
        }
    }, [pathname]);

    const handleToggleEnabledWrapped = useCallback((id: number, checked: boolean) => {
        handleToggleEnabled(id, checked);
        setUserSelectedId(id);
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            params.set("socialAttributeId", id.toString());
            window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
        }
    }, [handleToggleEnabled, pathname]);

    const filteredDiscounts: DiscountAttributeState[] = useMemo(() => {
        const list = getFilteredDiscounts(discountData, searchTerm, showActiveFirst, t);
        return isUnitLevel ? list.filter((item) => !item.isCommonAreaAttribute) : list;
    }, [discountData, searchTerm, showActiveFirst, t, isUnitLevel]);

    const selectedDiscount = activeSelectedId !== null ? discountData[activeSelectedId] : null;

    const handleErrorTagClick = useCallback((id: number) => {
        if (showActiveFirst) {
            setShowActiveFirst(false);
        }
        setSearchTerm("");
        handleSelectDiscount(id);

        requestAnimationFrame(() => {
            const card = document.querySelector(`[data-certificate-id="${id}"]`);
            if (card && typeof card.scrollIntoView === "function") {
                card.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    }, [showActiveFirst, handleSelectDiscount]);

    const handleSaveClick = useCallback(async () => {
        if (isSociety && levelState) {
            if (levelState.level === 'Wing' && !levelState.selectedWingDetailId) {
                toast.error(t('building.errors.selectWingRequired') || 'Please select a wing.');
                return;
            }
            if (levelState.level === 'Unit' && levelState.selectedUnitIds.size === 0 && !editingUnitId) {
                toast.error(t('building.selectUnits') || 'Please select at least one unit.');
                return;
            }
        }

        const result = await handleSave();
        if (result && !result.isValid && result.incompleteDiscounts) {
            const activeIncomplete = result.incompleteDiscounts.filter((d) => {
                const item = discountData[d.id];
                return item ? (item.dataType.toUpperCase() === "BIT" ? item.bitValue === true : item.enabled) : false;
            });
            if (activeIncomplete.length > 0) {
                const firstInvalidId = activeIncomplete[0].id;
                handleSelectDiscount(firstInvalidId);
                requestAnimationFrame(() => {
                    const card = document.querySelector(`[data-certificate-id="${firstInvalidId}"]`);
                    if (card && typeof card.scrollIntoView === "function") {
                        card.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                });
            }
        }
    }, [handleSave, discountData, handleSelectDiscount, isSociety, levelState, editingUnitId, t]);

    return {
        searchTerm,
        setSearchTerm,
        showActiveFirst,
        setShowActiveFirst,
        activeSelectedId,
        handleSelectDiscount,
        handleToggleEnabledWrapped,
        filteredDiscounts,
        selectedDiscount,
        handleErrorTagClick,
        handleSaveClick,
    };
};
