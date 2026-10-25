import { useMemo } from "react";
import { CertificateData } from "@/types/building-permission.types";

interface UseBuildingFormFiltersProps {
    buildingPermission: Record<number, CertificateData>;
    selectedTypeId: number | null;
    showActiveFirst: boolean;
    searchTerm: string;
    activeScope: string;
    propertyCertificatesState: Record<number, CertificateData>;
}

export function useBuildingFormFilters({
    buildingPermission,
    selectedTypeId,
    showActiveFirst,
    searchTerm,
    activeScope,
    propertyCertificatesState,
}: UseBuildingFormFiltersProps) {
    const firstAvailableTypeId = useMemo(() => {
        const sorted = Object.values(buildingPermission).sort(
            (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );
        return sorted.length > 0 ? sorted[0].certificateTypeId : null;
    }, [buildingPermission]);

    const activeSelectedTypeId = selectedTypeId !== null ? selectedTypeId : firstAvailableTypeId;
    const selectedCert = activeSelectedTypeId !== null ? buildingPermission[activeSelectedTypeId] : null;

    const allCertificatesList = useMemo(() => {
        return Object.values(buildingPermission).sort(
            (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );
    }, [buildingPermission]);

    const filteredCertificates = useMemo(() => {
        let result = [...allCertificatesList];
        if (showActiveFirst) {
            result.sort((a, b) => {
                const aActive = a.enabled ? 1 : 0;
                const bActive = b.enabled ? 1 : 0;
                if (bActive !== aActive) return bActive - aActive;
                return (a.displayOrder || 0) - (b.displayOrder || 0);
            });
        }
        if (searchTerm.trim() !== "") {
            const lower = searchTerm.toLowerCase();
            result = result.filter(
                (c) =>
                    c.certificateTypeName?.toLowerCase().includes(lower) ||
                    c.number?.toLowerCase().includes(lower)
            );
        }
        return result;
    }, [allCertificatesList, showActiveFirst, searchTerm]);

    const propertyWideCert = useMemo(() => {
        if (activeScope === "Floor" && activeSelectedTypeId !== null) {
            return propertyCertificatesState[activeSelectedTypeId] || null;
        }
        return null;
    }, [activeScope, activeSelectedTypeId, propertyCertificatesState]);

    return {
        activeSelectedTypeId,
        selectedCert,
        filteredCertificates,
        propertyWideCert,
    };
}
