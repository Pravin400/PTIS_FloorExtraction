import { describe, it, expect } from "vitest";
import { validateSocialDetails } from "@/lib/validations/social-details.validation";
import { FlatSocialAttributeState, isAttributeEnabled } from "@/lib/utils/social-details";

describe("social-details.special-toggles", () => {
    const createBaseAttr = (overrides: Partial<FlatSocialAttributeState> = {}): FlatSocialAttributeState => ({
        id: null,
        socialAttributeId: 1,
        socialAttributeCode: "ROAD_WIDTH",
        socialAttributeName: "Road Width",
        dataType: "DECIMAL",
        parentAttributeId: null,
        isRequiredWhenParentTrue: true,
        bitValue: null,
        intValue: null,
        decimalValue: null,
        textValue: null,
        dateValue: null,
        documentBindingId: null,
        remark: null,
        isUploading: false,
        ...overrides
    });

    it("should consider special toggles enabled when bitValue is true", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "ROAD_WIDTH",
            bitValue: true
        });
        const currentData = { 1: attr };
        expect(isAttributeEnabled(attr, currentData)).toBe(true);
    });

    it("should consider special toggles disabled when bitValue is false", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "ROAD_WIDTH",
            bitValue: false
        });
        const currentData = { 1: attr };
        expect(isAttributeEnabled(attr, currentData)).toBe(false);
    });

    it("should validate and return error if special toggle is active and value is missing", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "ROAD_WIDTH",
            bitValue: true,
            decimalValue: null
        });
        const currentData = { 1: attr };
        const errors = validateSocialDetails(currentData);
        expect(errors[1]).toBe("Road Width is required.");
    });

    it("should skip validation if special toggle is inactive (toggled OFF)", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "ROAD_WIDTH",
            bitValue: false,
            decimalValue: null
        });
        const currentData = { 1: attr };
        const errors = validateSocialDetails(currentData);
        expect(errors[1]).toBeUndefined();
    });

    it("should validate and return error for tree count if active and missing", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "NO_OF_TREES",
            socialAttributeName: "Number of Trees",
            dataType: "INT",
            bitValue: true,
            intValue: null
        });
        const currentData = { 1: attr };
        const errors = validateSocialDetails(currentData);
        expect(errors[1]).toBe("Number of Trees is required.");
    });

    it("should validate and return error for water connection year if active and out of range", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "WATER_CONN_YEAR",
            socialAttributeName: "Water Connection Year",
            dataType: "INT",
            bitValue: true,
            intValue: 1850 // Min is 1900
        });
        const currentData = { 1: attr };
        const errors = validateSocialDetails(currentData);
        expect(errors[1]).toBe("Year must be between 1900 and 2026.");
    });

    it("should consider water connection status as a special toggle and validate when active", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "WATER_CONN_STATUS",
            socialAttributeName: "Water Connection Status",
            dataType: "TEXT",
            bitValue: true,
            textValue: null
        });
        const currentData = { 1: attr };
        const errors = validateSocialDetails(currentData);
        expect(errors[1]).toBe("Water Connection Status is required.");
    });

    it("should skip validation for water connection status when inactive", () => {
        const attr = createBaseAttr({
            socialAttributeCode: "WATER_CONN_STATUS",
            socialAttributeName: "Water Connection Status",
            dataType: "TEXT",
            bitValue: false,
            textValue: null
        });
        const currentData = { 1: attr };
        const errors = validateSocialDetails(currentData);
        expect(errors[1]).toBeUndefined();
    });
});
