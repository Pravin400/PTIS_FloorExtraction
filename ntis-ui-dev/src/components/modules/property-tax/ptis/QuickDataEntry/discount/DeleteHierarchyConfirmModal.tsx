
export interface DeleteHierarchyConfirmOptions {
    attributeName: string;
    level?: 'Apartment' | 'Wing' | 'Unit';
    wingName?: string | null;
    selectedUnitNames?: string[];
    isOverridden?: boolean;
    isInherited?: boolean;
    inheritedFrom?: string | null;
    t: {
        (key: string, values?: Record<string, string | number>): string;
        has?: (key: string) => boolean;
    };
    itemType?: 'discount' | 'social';
}

export function buildDeleteHierarchyConfirmation({
    attributeName,
    level = 'Unit',
    wingName,
    selectedUnitNames = [],
    isOverridden,
    isInherited,
    inheritedFrom,
    t,
    itemType = 'discount'
}: DeleteHierarchyConfirmOptions) {
    const isSocial = itemType === 'social';
    const attrDisplayName = attributeName || (isSocial ? "Social Data" : "Discount");

    const getTranslation = (key: string, fallback: string, values?: Record<string, string | number>) => {
        if (typeof t.has === 'function' && !t.has(key)) return fallback;
        try {
            return t(key, values) || fallback;
        } catch {
            return fallback;
        }
    };

    const isApartmentOrigin = (inheritedFrom || '').toUpperCase() === 'APARTMENT' || (level === 'Apartment');
    const isWingOrigin = !isApartmentOrigin && ((inheritedFrom || '').toUpperCase() === 'WING' || level === 'Wing');

    let title = "";
    let mainMessage = "";
    let levelLabel = "";

    if (isOverridden) {
        title = isSocial
            ? getTranslation("discount.confirmDeleteOverrideTitleSocial", "Delete Social Data Override")
            : getTranslation("discount.confirmDeleteOverrideTitle", "Delete Level Override");
        mainMessage = getTranslation("discount.confirmDeleteOverrideDesc", "You have modified this inherited attribute. Deleting this will remove the custom override for this level and revert back to inherited settings.");
        levelLabel = `${level} Level (Override)`;
    } else if (level === 'Apartment' || (isInherited && isApartmentOrigin)) {
        title = isSocial
            ? getTranslation("discount.confirmDeleteApartmentTitleSocial", "Delete Apartment Level Social Data")
            : getTranslation("discount.confirmDeleteApartmentTitle", "Delete Apartment Level Discount");
        mainMessage = isSocial
            ? getTranslation("discount.confirmDeleteApartmentDescSocial", "This social data is applied at Apartment Level.\n\nDeleting it will remove this data from the entire Apartment level (affecting all wings and units).")
            : getTranslation("discount.confirmDeleteApartmentDesc", "This discount is applied at Apartment Level.\n\nDeleting it will remove this discount from the entire Apartment level (affecting all wings and units).");
        levelLabel = "Apartment Level";
    } else if (level === 'Wing' || (isInherited && isWingOrigin)) {
        const wingSuffix = wingName ? ` (${wingName})` : '';
        title = isSocial
            ? getTranslation("discount.confirmDeleteWingTitleSocial", "Delete Wing Level Social Data")
            : getTranslation("discount.confirmDeleteWingTitle", "Delete Wing Level Discount");
        mainMessage = isSocial
            ? getTranslation("discount.confirmDeleteWingDescSocial", `This social data is applied at Wing Level${wingSuffix}.\n\nDeleting it will remove this data from this Wing and all its units.`, { wing: wingName || '' })
            : getTranslation("discount.confirmDeleteWingDesc", `This discount is applied at Wing Level${wingSuffix}.\n\nDeleting it will remove this discount from this Wing and all its units.`, { wing: wingName || '' });
        levelLabel = `Wing Level${wingSuffix}`;
    } else {
        const count = selectedUnitNames.length;
        title = isSocial
            ? getTranslation("discount.confirmDeleteUnitTitleSocial", "Delete Unit Level Social Data")
            : getTranslation("discount.confirmDeleteUnitTitle", "Delete Unit Level Discount");

        mainMessage = count > 1
            ? getTranslation("discount.confirmDeleteMultiUnitDesc", `Are you sure you want to delete applied "${attrDisplayName}" data for the ${count} selected units? This action cannot be undone.`, { count, attributeName: attrDisplayName })
            : getTranslation("discount.confirmDeleteUnitDesc", `This ${isSocial ? 'social data' : 'discount'} is applied at Unit Level.\n\nDeleting it will remove this data for the selected unit(s).`, { attributeName: attrDisplayName });
        levelLabel = wingName ? `Unit Level (Wing ${wingName})` : "Unit Level";
    }

    const description = (
        <div className="w-full flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600 leading-relaxed text-center max-w-[460px] whitespace-pre-line">
                {mainMessage}
            </p>

            <div className="w-full max-w-[460px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-semibold text-slate-500">
                        {getTranslation("discount.attribute", "Attribute")}:
                    </span>
                    <span className="font-bold text-slate-900">{attrDisplayName}</span>
                </div>
                <div className="flex items-center justify-between text-xs px-1 border-t border-slate-200/60 pt-2">
                    <span className="font-semibold text-slate-500">
                        {getTranslation("discount.level", "Target Level")}:
                    </span>
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                        {levelLabel}
                    </span>
                </div>

                {level === 'Unit' && selectedUnitNames.length > 0 && (
                    <div className="border-t border-slate-200/60 pt-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                            <span>{getTranslation("building.selectedUnits", "Selected Units")}</span>
                            <span className="text-[11px] font-semibold text-slate-700">
                                ({selectedUnitNames.length})
                            </span>
                        </div>
                        <div className="max-h-[72px] overflow-y-auto scrollbar-thin px-2 py-1.5 bg-white border border-slate-200 rounded-lg flex flex-wrap gap-1">
                            {selectedUnitNames.map((name) => (
                                <span
                                    key={name}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return {
        title,
        description,
        confirmText: getTranslation("discount.confirmDeleteDiscountOk", "Yes, Delete"),
        cancelText: getTranslation("discount.confirmDeleteDiscountCancel", "No, Cancel"),
        variant: "delete" as const,
    };
}
