import { useState, useCallback, useEffect, useMemo, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import { WingOption, UnitSelectionItem } from "@/types/building-permission.types";
import { PropertySocialDetailsDto } from "@/types/property-social-details.types";

interface UseDiscountFormviewStateParams {
    propertyId: string;
    isSociety?: boolean;
    propSocietyDetailId?: number;
    propWingDetailId?: number;
    wings: WingOption[];
    units: UnitSelectionItem[];
    savedPropertyDetails: PropertySocialDetailsDto[];
    t: (key: string) => string;
}

export const useDiscountFormviewState = ({
    propertyId,
    isSociety = false,
    propSocietyDetailId,
    propWingDetailId,
    wings,
    units,
    savedPropertyDetails,
    t,
}: UseDiscountFormviewStateParams) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { confirm } = useConfirm();
    const [isTabPending, startTabTransition] = useTransition();
    const [isLevelPending, startLevelTransition] = useTransition();
    const [targetTab, setTargetTab] = useState<string | null>(null);
    const [targetLevel, setTargetLevel] = useState<"Apartment" | "Wing" | "Unit" | null>(null);

    const isPendingTransition = isTabPending || isLevelPending;

    const activeTab = searchParams.get("view") || "discount";

    const handleTabChange = useCallback((value: string | number) => {
        const win = typeof window !== 'undefined' ? (window as unknown as { __discountFormHasChanges?: boolean; __socialFormHasChanges?: boolean }) : {};
        const hasChanges = activeTab === "discount" ? !!win.__discountFormHasChanges : !!win.__socialFormHasChanges;

        if (hasChanges) {
            confirm({
                variant: 'warning',
                title: t('discount.unsavedChangesTitle') || 'Unsaved Changes',
                description: t('discount.unsavedChangesDesc') || 'You have unsaved changes in the Discount & Social Data tab. Do you want to discard them, or continue editing?',
                confirmText: t('discount.continueButton') || 'Continue Editing',
                cancelText: t('discount.discardConfirmButton') || 'Discard Changes',
                onConfirm: () => {},
                onCancel: () => {
                    const localWin = typeof window !== 'undefined' ? (window as unknown as { __discountFormHasChanges?: boolean; __socialFormHasChanges?: boolean }) : null;
                    if (localWin) {
                        localWin.__discountFormHasChanges = false;
                        localWin.__socialFormHasChanges = false;
                    }
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("view", String(value));
                    setTargetTab(String(value));
                    startTabTransition(() => {
                        router.push(`${pathname}?${params.toString()}`);
                    });
                }
            });
        } else {
            const params = new URLSearchParams(searchParams.toString());
            params.set("view", String(value));
            setTargetTab(String(value));
            startTabTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        }
    }, [searchParams, router, pathname, activeTab, confirm, t]);

    const isWingWise = searchParams.get('isWingWise') === 'true';
    const levelParam = searchParams.get('level') as "Apartment" | "Wing" | "Unit" | null;
    const societyDetailId = searchParams.get('societyDetailId') || searchParams.get('societyId');
    const wingDetailId = searchParams.get('wingDetailId') || searchParams.get('wingId');
    const parsedWingId = wingDetailId && !isNaN(Number(wingDetailId)) && Number(wingDetailId) > 0 ? Number(wingDetailId) : null;
    const parsedPropWingId = propWingDetailId && !isNaN(Number(propWingDetailId)) && Number(propWingDetailId) > 0 ? Number(propWingDetailId) : null;
    const initialWingDetailId = parsedWingId ?? parsedPropWingId ?? (wings && wings.length > 0 ? wings[0].wingDetailId : null);
    const unitPropertyIdParam = searchParams.get('unitPropertyId');
    const initialUnitPropertyId = unitPropertyIdParam ? Number(unitPropertyIdParam) : null;

    const effectiveSocietyDetailId = (propSocietyDetailId && Number(propSocietyDetailId) > 0 ? Number(propSocietyDetailId) : null) ?? (societyDetailId && Number(societyDetailId) > 0 ? Number(societyDetailId) : null);
    const hasSocietyDetailId = Boolean(effectiveSocietyDetailId && effectiveSocietyDetailId > 0);

    const hasWingsAvailable = Array.isArray(wings) && wings.length > 0;
    const effectiveWingDetailId = (propWingDetailId && Number(propWingDetailId) > 0 ? Number(propWingDetailId) : null) ?? (initialWingDetailId && initialWingDetailId > 0 ? initialWingDetailId : null);
    const hasWingDetailId = Boolean(hasWingsAvailable && effectiveWingDetailId && effectiveWingDetailId > 0);

    const hasHierarchy = Boolean(hasSocietyDetailId || isSociety);
    const showApartmentTab = (hasSocietyDetailId || isSociety) && !isWingWise;
    const showWingTab = hasWingDetailId;
    const showLevelSelector = isSociety || hasSocietyDetailId;
    const effectiveIsSociety = isSociety || hasSocietyDetailId;

    const rawInitialLevel = levelParam || (isWingWise ? 'Wing' : (showApartmentTab ? 'Apartment' : (showWingTab ? 'Wing' : 'Unit')));
    const effectiveInitialLevel: "Apartment" | "Wing" | "Unit" =
        !hasHierarchy
            ? 'Unit'
            : rawInitialLevel === 'Apartment' && !showApartmentTab
            ? (showWingTab ? 'Wing' : 'Unit')
            : rawInitialLevel === 'Wing' && !showWingTab
            ? (showApartmentTab ? 'Apartment' : 'Unit')
            : rawInitialLevel;

    const levelState = useDiscountLevelState({
        propertyId,
        initialLevel: effectiveInitialLevel,
        initialWingDetailId,
        initialUnitPropertyId,
        isSociety: effectiveIsSociety,
        wings,
        units,
        savedPropertyDetails
    });

    const handleLevelChange = useCallback((level: "Apartment" | "Wing" | "Unit") => {
        levelState.setLevel(level);
        const params = new URLSearchParams(searchParams.toString());
        params.set("level", level);
        if (level !== 'Unit') {
            params.delete("unitPropertyId");
        }
        setTargetLevel(level);
        startLevelTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [levelState, searchParams, router, pathname]);

    const currentLevel = levelState?.level;
    useEffect(() => {
        if (!currentLevel) return;
        if (currentLevel === 'Apartment' && !showApartmentTab) {
            const next = showWingTab ? 'Wing' : 'Unit';
            const timer = setTimeout(() => {
                handleLevelChange(next);
            }, 0);
            return () => clearTimeout(timer);
        } else if (currentLevel === 'Wing' && !showWingTab) {
            const timer = setTimeout(() => {
                handleLevelChange('Unit');
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [currentLevel, showApartmentTab, showWingTab, handleLevelChange]);

    const editingUnitId = useMemo(() => {
        if (!levelState || levelState.level !== 'Unit') return null;
        if (levelState.selectedUnitIds.size === 1) {
            return Array.from(levelState.selectedUnitIds)[0];
        }
        if (initialUnitPropertyId && initialUnitPropertyId > 0) {
            return initialUnitPropertyId;
        }
        return null;
    }, [levelState, initialUnitPropertyId]);

    return {
        activeTab,
        handleTabChange,
        levelState,
        handleLevelChange,
        isPendingTransition,
        isTabPending,
        isLevelPending,
        targetTab,
        targetLevel,
        hasHierarchy,
        showApartmentTab,
        showWingTab,
        showLevelSelector,
        effectiveIsSociety,
        effectiveSocietyDetailId,
        effectiveWingDetailId,
        editingUnitId,
        searchParams,
        pathname,
    };
};
