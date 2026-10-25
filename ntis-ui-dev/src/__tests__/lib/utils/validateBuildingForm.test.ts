import { describe, it, expect } from "vitest";
import { validateBuildingForm } from "@/lib/utils/validateBuildingForm";
import { BuildingPermissionState } from "@/types/building-permission.types";

describe("validateBuildingForm - CC and OC date rules (floorwise & propertywide)", () => {
    const mockT = (key: string) => key;

    it("passes when OC date is strictly after CC date when both are enabled", () => {
        const state: BuildingPermissionState = {
            2: {
                certificateTypeId: 2,
                certificateTypeName: "Commencement Certificate (CC)",
                enabled: true,
                number: "CC-12345",
                date: "2023-01-01",
                documentGuid: "guid-cc",
                displayOrder: 1,
            },
            3: {
                certificateTypeId: 3,
                certificateTypeName: "Occupancy Certificate (OC)",
                enabled: true,
                number: "OC-12345",
                date: "2023-06-01",
                documentGuid: "guid-oc",
                displayOrder: 2,
            },
        };

        const result = validateBuildingForm(state, mockT);
        expect(result.isValid).toBe(true);
    });

    it("targets error to CC with commencementDateBeforeOccupancy message when user is editing CC and CC date is after OC date", () => {
        const state: BuildingPermissionState = {
            2: {
                certificateTypeId: 2,
                certificateTypeName: "Commencement Certificate (CC)",
                enabled: true,
                number: "5345345345345345345",
                date: "2026-07-04",
                documentGuid: "guid-cc",
                displayOrder: 1,
            },
            3: {
                certificateTypeId: 3,
                certificateTypeName: "Occupancy Certificate (OC)",
                enabled: true,
                number: "4235345345234523",
                date: "2026-07-03",
                documentGuid: "guid-oc",
                displayOrder: 2,
            },
        };

        // When active certificate is CC (type 2)
        const result = validateBuildingForm(state, mockT, { activeCertificateTypeId: 2 });
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors?.[2]?.date).toBe("validation.commencementDateBeforeOccupancy");
        expect(result.fieldErrors?.[3]?.date).toBeUndefined();
        expect(result.incompleteCertificates).toEqual([
            { id: 2, name: "Commencement Certificate (CC)" }
        ]);
    });

    it("targets error to OC with occupancyDateAfterCommencement message when user is editing OC and OC date is before CC date", () => {
        const state: BuildingPermissionState = {
            2: {
                certificateTypeId: 2,
                certificateTypeName: "Commencement Certificate (CC)",
                enabled: true,
                number: "5345345345345345345",
                date: "2026-07-04",
                documentGuid: "guid-cc",
                displayOrder: 1,
            },
            3: {
                certificateTypeId: 3,
                certificateTypeName: "Occupancy Certificate (OC)",
                enabled: true,
                number: "4235345345234523",
                date: "2026-07-03",
                documentGuid: "guid-oc",
                displayOrder: 2,
            },
        };

        // When active certificate is OC (type 3)
        const result = validateBuildingForm(state, mockT, { activeCertificateTypeId: 3 });
        expect(result.isValid).toBe(false);
        expect(result.fieldErrors?.[3]?.date).toBe("validation.occupancyDateAfterCommencement");
        expect(result.fieldErrors?.[2]?.date).toBeUndefined();
        expect(result.incompleteCertificates).toEqual([
            { id: 3, name: "Occupancy Certificate (OC)" }
        ]);
    });

    it("passes when CC is enabled on a floor but OC is disabled (not attached for this floor)", () => {
        const floorState: BuildingPermissionState = {
            2: {
                certificateTypeId: 2,
                certificateTypeName: "Commencement Certificate (CC)",
                enabled: true,
                number: "48848485656565",
                date: "2026-07-17",
                documentGuid: "guid-cc-fl",
                displayOrder: 1,
            },
            3: {
                certificateTypeId: 3,
                certificateTypeName: "Occupancy Certificate (OC)",
                enabled: false,
                number: "",
                date: "",
                documentGuid: "",
                displayOrder: 2,
            },
        };

        const result = validateBuildingForm(floorState, mockT);
        expect(result.isValid).toBe(true);
        expect(result.fieldErrors?.[2]?.date).toBeUndefined();
    });

    it("fails validation when OC date is before floor construction year in floor scope", () => {
        const state: BuildingPermissionState = {
            3: {
                certificateTypeId: 3,
                certificateTypeName: "Occupancy Certificate (OC)",
                enabled: true,
                number: "OC-12345",
                date: "2021-06-01",
                documentGuid: "guid-oc",
                displayOrder: 2,
            },
        };

        const floors = [
            {
                propertyDetailsId: 10,
                propertyId: 1,
                constructionYear: "2023",
                isSelected: true,
                certificateApplicable: true,
            },
        ];

        const result = validateBuildingForm(state, mockT, {
            activeScope: "Floor",
            activeFloorId: 10,
            floors,
        });

        expect(result.isValid).toBe(false);
        expect(result.fieldErrors?.[3]?.date).toBe("validation.dateBeforeConstructionYear");
    });

    it("fails validation when CC date is before minimum floor construction year in property scope", () => {
        const state: BuildingPermissionState = {
            2: {
                certificateTypeId: 2,
                certificateTypeName: "Commencement Certificate (CC)",
                enabled: true,
                number: "CC-12345",
                date: "2020-01-01",
                documentGuid: "guid-cc",
                displayOrder: 1,
            },
        };

        const floors = [
            {
                propertyDetailsId: 10,
                propertyId: 1,
                constructionYear: "2022",
                isSelected: false,
                certificateApplicable: true,
            },
            {
                propertyDetailsId: 11,
                propertyId: 1,
                constructionYear: "2024",
                isSelected: false,
                certificateApplicable: true,
            },
        ];

        const result = validateBuildingForm(state, mockT, {
            activeScope: "Property",
            floors,
        });

        expect(result.isValid).toBe(false);
        expect(result.fieldErrors?.[2]?.date).toBe("validation.dateBeforeConstructionYear");
    });

    it("passes validation when Electric Bill date is greater than or equal to construction year", () => {
        const state: BuildingPermissionState = {
            4: {
                certificateTypeId: 4,
                certificateTypeName: "Electric Bill",
                enabled: true,
                number: "985472136",
                date: "2023-12-31",
                documentGuid: "guid-eb",
                displayOrder: 3,
            },
        };

        const floors = [
            {
                propertyDetailsId: 10,
                propertyId: 1,
                constructionYear: "2023",
                isSelected: true,
                certificateApplicable: true,
            },
        ];

        const result = validateBuildingForm(state, mockT, {
            activeScope: "Floor",
            activeFloorId: 10,
            floors,
        });

        expect(result.isValid).toBe(true);
    });
});
