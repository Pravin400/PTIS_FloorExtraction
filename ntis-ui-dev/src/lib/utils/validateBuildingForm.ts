import { BuildingPermissionState, FloorCertificateDto } from "@/types/building-permission.types";
import { validateDocumentNumber, validateDocumentDate, parseDateString } from "@/lib/validation/building/validation-rules";
import { mapTypeNameToKey } from "@/lib/utils/building-helpers";

interface IncompleteCertificate {
    id: number;
    name: string;
}

interface ValidationResult {
    isValid: boolean;
    /** Per-certificate short error string for sidebar badges (first missing field). */
    errors: Record<number, string>;
    /** Certificates that have at least one missing required field. */
    incompleteCertificates: IncompleteCertificate[];
    fieldErrors?: Record<number, { number?: string; date?: string; document?: string }>;
}




interface ValidateBuildingFormOptions {
    /** When true, skips the document-required check. Used when saving
     *  is triggered internally before a file upload (pre-upload save). */
    skipDocumentValidation?: boolean;
    skipNumberDateValidation?: boolean;
    onlyCertificateTypeId?: number;
    activeCertificateTypeId?: number;
    floors?: FloorCertificateDto[];
    activeScope?: 'Property' | 'Floor';
    activeFloorId?: number | null;
}

export const validateBuildingForm = (
    state: BuildingPermissionState,
    t: (key: string, params?: Record<string, string | number>) => string,
    options: ValidateBuildingFormOptions = {}
): ValidationResult => {
    const errors: Record<number, string> = {};
    const fieldErrors: Record<number, { number?: string; date?: string; document?: string }> = {};
    const incompleteCertificates: IncompleteCertificate[] = [];
    let isValid = true;

    Object.values(state).forEach((item) => {
        if (options.onlyCertificateTypeId !== undefined && item.certificateTypeId !== options.onlyCertificateTypeId) {
            return;
        }
        if (!item.enabled) return;

        const fieldErrorsForCert: { number?: string; date?: string; document?: string } = {};

        if (!options.skipNumberDateValidation) {
            // 1. Certificate Number Validation
            const numberError = validateDocumentNumber(item.number, item.certificateTypeName || undefined, item.certificateTypeCode || undefined);
            if (numberError) {
                fieldErrorsForCert.number = t(numberError.key, numberError.params);
            }

            // 2. Certificate Date Validation
            const dateError = validateDocumentDate(item.date);
            if (dateError) {
                fieldErrorsForCert.date = t(dateError.key, dateError.params);
            } else if (item.date && item.date.trim() !== "") {
                const key = mapTypeNameToKey(item.certificateTypeName || "");
                const code = (item.certificateTypeCode || "").toUpperCase();

                const isTargetCert = 
                    key === "occupancyCertificate" || code === "OC" ||
                    key === "commencementCertificate" || key === "buildCompletionCertificate" || code === "CC" || code === "BCC" ||
                    key === "electricBill" || code === "EB";

                if (isTargetCert) {
                    let targetConstructionYear: number | null = null;

                    if (options.activeScope === 'Floor' && options.activeFloorId !== undefined && options.activeFloorId !== null) {
                        const activeFloor = options.floors?.find(f => f.propertyDetailsId === options.activeFloorId);
                        if (activeFloor?.constructionYear) {
                            targetConstructionYear = parseInt(activeFloor.constructionYear, 10);
                        }
                    } else {
                        if (options.floors && options.floors.length > 0) {
                            const years = options.floors
                                .map(f => f.constructionYear ? parseInt(f.constructionYear, 10) : null)
                                .filter((y): y is number => y !== null && !isNaN(y));
                            if (years.length > 0) {
                                targetConstructionYear = Math.min(...years);
                            }
                        }
                    }

                    if (targetConstructionYear !== null && !isNaN(targetConstructionYear)) {
                        const certDate = parseDateString(item.date);
                        if (certDate) {
                            const certYear = certDate.getFullYear();
                            if (certYear < targetConstructionYear) {
                                fieldErrorsForCert.date = t("validation.dateBeforeConstructionYear", { year: targetConstructionYear });
                            }
                        }
                    }
                }
            }
        }

        // 3. Document Validation (skipped during pre-upload saves)
        if (!options.skipDocumentValidation && (!item.documentGuid || item.documentGuid.trim() === "")) {
            fieldErrorsForCert.document = t("validation.documentRequired");
        }

        if (Object.keys(fieldErrorsForCert).length > 0) {
            fieldErrors[item.certificateTypeId] = fieldErrorsForCert;
            errors[item.certificateTypeId] = fieldErrorsForCert.number || fieldErrorsForCert.date || fieldErrorsForCert.document || "";
            incompleteCertificates.push({
                id: item.certificateTypeId,
                name: item.certificateTypeName || `Certificate #${item.certificateTypeId}`,
            });
            isValid = false;
        }
    });

    // Cross-field validation: Occupancy date > Commencement date (floorwise & propertywide logic)
    // Only perform date comparison if BOTH Commencement Certificate and Occupancy Certificate are enabled in the active scope
    const ccItem = Object.values(state).find((item) => {
        if (!item.enabled) return false;
        const key = mapTypeNameToKey(item.certificateTypeName || "");
        const code = (item.certificateTypeCode || "").toUpperCase();
        return key === "commencementCertificate" || key === "buildCompletionCertificate" || code === "CC";
    });
    const ocItem = Object.values(state).find((item) => {
        if (!item.enabled) return false;
        const key = mapTypeNameToKey(item.certificateTypeName || "");
        const code = (item.certificateTypeCode || "").toUpperCase();
        return key === "occupancyCertificate" || code === "OC";
    });

    if (ccItem && ocItem && ccItem.date && ccItem.date.trim() && ocItem.date && ocItem.date.trim()) {
        const ccDate = parseDateString(ccItem.date);
        const ocDate = parseDateString(ocItem.date);
        if (ccDate && ocDate && ocDate.getTime() < ccDate.getTime()) {
            isValid = false;

            // Target the error to the currently active/edited certificate so selection remains on that certificate
            let targetCert = ocItem;
            const currentEditingTypeId = options.onlyCertificateTypeId ?? options.activeCertificateTypeId;
            if (currentEditingTypeId !== undefined) {
                if (currentEditingTypeId === ccItem.certificateTypeId) {
                    targetCert = ccItem;
                } else if (currentEditingTypeId === ocItem.certificateTypeId) {
                    targetCert = ocItem;
                }
            }

            const isCC = targetCert.certificateTypeId === ccItem.certificateTypeId;
            const errorKey = isCC ? "validation.commencementDateBeforeOccupancy" : "validation.occupancyDateAfterCommencement";

            if (!fieldErrors[targetCert.certificateTypeId]) {
                fieldErrors[targetCert.certificateTypeId] = {};
            }
            fieldErrors[targetCert.certificateTypeId].date = t(errorKey);
            errors[targetCert.certificateTypeId] = t(errorKey);

            if (!incompleteCertificates.some((c) => c.id === targetCert.certificateTypeId)) {
                incompleteCertificates.push({
                    id: targetCert.certificateTypeId,
                    name: targetCert.certificateTypeName || (isCC ? "Commencement Certificate (CC)" : "Occupancy Certificate (OC)"),
                });
            }
        }
    }

    return { isValid, errors, incompleteCertificates, fieldErrors };
};

