import { CertificateData } from "@/types/building-permission.types";

export function isCertificateApplied(cert: CertificateData): boolean {
    if (cert.hasExistingData) return true;
    if (typeof cert.propertyCertificateId === "number" && cert.propertyCertificateId > 0) return true;
    if (
        cert.documentGuid &&
        cert.documentGuid !== "null" &&
        cert.documentGuid !== "undefined" &&
        cert.documentGuid !== "temp-guid"
    ) {
        return true;
    }
    if (cert.sourceLevel && cert.sourceLevel !== "None" && cert.sourceLevel !== "Partial") {
        return true;
    }
    if (cert.customStatusBadge) {
        const { variant, label } = cert.customStatusBadge;
        const normalized = label.toLowerCase();
        if (
            (variant === "success" || variant === "purple" || variant === "info") &&
            !normalized.includes("selected") &&
            !normalized.includes("not configured")
        ) {
            return true;
        }
    }
    return false;
}

export function hasCertificateData(cert: CertificateData): boolean {
    if (cert.hasExistingData !== undefined) return Boolean(cert.hasExistingData);
    const hasSavedId = Boolean(typeof cert.propertyCertificateId === "number" && cert.propertyCertificateId > 0);
    const hasDoc = Boolean(
        cert.documentGuid &&
        cert.documentGuid !== "null" &&
        cert.documentGuid !== "undefined" &&
        cert.documentGuid !== "temp-guid" &&
        (hasSavedId || Boolean(cert.fileName))
    );
    return hasSavedId || hasDoc;
}

export function isCertificateActive(cert: CertificateData): boolean {
    return Boolean(
        cert.enabled ||
        isCertificateApplied(cert) ||
        hasCertificateData(cert) ||
        (cert.sourceLevel && cert.sourceLevel !== "None") ||
        (cert.customStatusBadge && ["success", "purple", "info"].includes(cert.customStatusBadge.variant))
    );
}
