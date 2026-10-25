import { validateDocumentNumber, validateDocumentDate } from "./validation-rules";

export interface BuildingCertificateValidationInput {
    number?: string | null;
    date?: string | null;
    certificateTypeName?: string | null;
    certificateTypeCode?: string | null;
}

export const checkBuildingRequiredFields = (
    certificate: BuildingCertificateValidationInput,
    t: (key: string, values?: Record<string, string | number>) => string
): string | null => {
    const numberError = validateDocumentNumber(
        certificate.number,
        certificate.certificateTypeName || undefined,
        certificate.certificateTypeCode || undefined
    );
    if (numberError) {
        const fullKey = (numberError.key.startsWith("building.") || numberError.key.startsWith("common."))
            ? numberError.key
            : `common.${numberError.key}`;
        return t(fullKey, numberError.params);
    }

    const dateError = validateDocumentDate(certificate.date);
    if (dateError) {
        const fullKey = (dateError.key.startsWith("building.") || dateError.key.startsWith("common."))
            ? dateError.key
            : `common.${dateError.key}`;
        return t(fullKey, dateError.params);
    }

    return null;
};
