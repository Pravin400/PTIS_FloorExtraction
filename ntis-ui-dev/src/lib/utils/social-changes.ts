import { FlatSocialAttributeState } from "./social-details";

/**
 * Checks if the current social state has changes compared to the initial state.
 */
export function hasSocialChangesComparedToInitial(
    current: Record<number, FlatSocialAttributeState>,
    initial: Record<number, FlatSocialAttributeState>
): boolean {
    const currentKeys = Object.keys(current);
    const initialKeys = Object.keys(initial);
    if (currentKeys.length !== initialKeys.length) return true;

    for (const keyStr of currentKeys) {
        const key = Number(keyStr);
        const currItem = current[key];
        const initItem = initial[key];
        if (!initItem) return true;

        if (Boolean(currItem.isOverridden) !== Boolean(initItem.isOverridden)) return true;
        if ((currItem.bitValue ?? false) !== (initItem.bitValue ?? false)) return true;

        const currInt = currItem.intValue === "" || currItem.intValue === undefined ? null : currItem.intValue;
        const initInt = initItem.intValue === "" || initItem.intValue === undefined ? null : initItem.intValue;
        if (String(currInt ?? "") !== String(initInt ?? "")) return true;

        const currDec = currItem.decimalValue === "" || currItem.decimalValue === undefined ? null : currItem.decimalValue;
        const initDec = initItem.decimalValue === "" || initItem.decimalValue === undefined ? null : initItem.decimalValue;
        if (String(currDec ?? "") !== String(initDec ?? "")) return true;

        if ((currItem.textValue ?? "") !== (initItem.textValue ?? "")) return true;
        if ((currItem.dateValue ?? "") !== (initItem.dateValue ?? "")) return true;
        if ((currItem.remark ?? "") !== (initItem.remark ?? "")) return true;
        if (currItem.pendingFile !== undefined) return true;
        if ((currItem.documentGuid ?? "") !== (initItem.documentGuid ?? "")) return true;
        if ((currItem.photoGuid ?? "") !== (initItem.photoGuid ?? "")) return true;
        if ((currItem.photoBindingId ?? null) !== (initItem.photoBindingId ?? null)) return true;
        if ((currItem.documentBindingId ?? null) !== (initItem.documentBindingId ?? null)) return true;
    }

    return false;
}
