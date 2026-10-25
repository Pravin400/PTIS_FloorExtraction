import { FlatSocialAttributeState, isAttributeEnabled } from "@/lib/utils/social-details";
import { validateSingleSocialAttribute } from "./validate-single-attribute";

export { getMinMaxValues } from "./social-validation-rules";

/**
 * Validates social details flat attributes state according to backend requirements and data types.
 */
export function validateSocialDetails(
    data: Record<number, FlatSocialAttributeState>,
    t?: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    }
): Record<number, string> {
    const errors: Record<number, string> = {};

    Object.values(data).forEach((attr) => {
        const err = validateSingleSocialAttribute(attr, data, t);
        if (err) {
            errors[attr.socialAttributeId] = err;
        }
    });

    return errors;
}

/**
 * Performs a completeness/validation check on a target social attribute and its enabled descendants.
 * This is used to determine if details are completed before allowing photo uploads.
 */
export function checkSocialRequiredFields(
    attributeId: number,
    socialData: Record<number, FlatSocialAttributeState>,
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    }
): string | null {
    const targetAttr = socialData[attributeId];
    if (!targetAttr) return null;

    // Check target attribute
    const targetErr = validateSingleSocialAttribute(targetAttr, socialData, t, true);
    if (targetErr) return targetErr;

    // Check enabled descendants
    const getEnabledDescendants = (id: number): FlatSocialAttributeState[] => {
        const list: FlatSocialAttributeState[] = [];
        const children = Object.values(socialData).filter(x => x.parentAttributeId === id);
        children.forEach(child => {
            const isEnabled = isAttributeEnabled(child, socialData);
            if (isEnabled) {
                list.push(child);
                list.push(...getEnabledDescendants(child.socialAttributeId));
            }
        });
        return list;
    };

    const descendants = getEnabledDescendants(attributeId);
    for (const attr of descendants) {
        const err = validateSingleSocialAttribute(attr, socialData, t, true);
        if (err) return err;
    }

    return null;
}
