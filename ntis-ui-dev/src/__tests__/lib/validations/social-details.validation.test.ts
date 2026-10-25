import { describe, it, expect } from "vitest";
import { validateSocialDetails, getMinMaxValues } from "@/lib/validations/social-details.validation";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";

describe("social-details.validation", () => {
    describe("getMinMaxValues", () => {
        it("returns correct bounds for rating stars", () => {
            const bounds = getMinMaxValues("GREEN_PROPERTY_STAR");
            expect(bounds.min).toBe(1);
            expect(bounds.max).toBe(5);
        });

        it("returns correct bounds for water connection year", () => {
            const bounds = getMinMaxValues("WATER_CONN_YEAR");
            expect(bounds.min).toBe(1900);
            expect(bounds.max).toBe(new Date().getFullYear());
        });

        it("returns correct bounds for borewell / wells count", () => {
            const boundsBore = getMinMaxValues("HAS_BOREWELL");
            expect(boundsBore.min).toBe(1);
            expect(boundsBore.max).toBe(50);
        });

        it("returns correct bounds for lifts", () => {
            const bounds = getMinMaxValues("LIFT_COUNT");
            expect(bounds.min).toBe(1);
            expect(bounds.max).toBe(100);
        });

        it("returns correct bounds for solar panels count", () => {
            const bounds = getMinMaxValues("SOLAR_PANELS");
            expect(bounds.min).toBe(1);
            expect(bounds.max).toBe(5000);
        });

        it("returns correct bounds for trees count", () => {
            const bounds = getMinMaxValues("TREE_COUNT");
            expect(bounds.min).toBe(1);
            expect(bounds.max).toBe(100000);
        });
    });

    describe("validateSocialDetails", () => {
        const createBaseAttr = (overrides: Partial<FlatSocialAttributeState> = {}): FlatSocialAttributeState => ({
            id: null,
            socialAttributeId: 1,
            socialAttributeCode: "ATTR_CODE",
            socialAttributeName: "Test Attribute",
            dataType: "INT",
            parentAttributeId: null,
            isRequiredWhenParentTrue: false,
            bitValue: true,
            intValue: null,
            decimalValue: null,
            textValue: null,
            dateValue: null,
            documentBindingId: null,
            remark: null,
            isUploading: false,
            ...overrides
        });

        it("should return no errors when no attributes are validated", () => {
            const errors = validateSocialDetails({});
            expect(Object.keys(errors).length).toBe(0);
        });

        it("should skip validation if the attribute is disabled (parent is false)", () => {
            const childAttr = createBaseAttr({
                socialAttributeId: 2,
                parentAttributeId: 1,
                isRequiredWhenParentTrue: true,
                dataType: "INT",
                intValue: null
            });
            const parentAttr = createBaseAttr({
                socialAttributeId: 1,
                dataType: "BIT",
                bitValue: false
            });

            const data = {
                1: parentAttr,
                2: childAttr
            };

            const errors = validateSocialDetails(data);
            expect(errors[2]).toBeUndefined();
        });

        it("should return error if a required attribute is empty and parent is enabled", () => {
            const childAttr = createBaseAttr({
                socialAttributeId: 2,
                parentAttributeId: 1,
                isRequiredWhenParentTrue: true,
                dataType: "INT",
                intValue: null
            });
            const parentAttr = createBaseAttr({
                socialAttributeId: 1,
                dataType: "BIT",
                bitValue: true
            });

            const data = {
                1: parentAttr,
                2: childAttr
            };

            const errors = validateSocialDetails(data);
            expect(errors[2]).toBe("Test Attribute is required.");
        });

        it("should reject non-integers on INT attributes", () => {
            const attr = createBaseAttr({
                socialAttributeId: 1,
                dataType: "INT",
                intValue: 1.5 // decimal parsed value
            });

            const errors = validateSocialDetails({ 1: attr });
            expect(errors[1]).toBe("Value must be a valid integer.");
        });

        it("should accept valid integers on INT attributes", () => {
            const attr = createBaseAttr({
                socialAttributeId: 1,
                dataType: "INT",
                intValue: 5
            });

            const errors = validateSocialDetails({ 1: attr });
            expect(errors[1]).toBeUndefined();
        });

        it("should reject 0 on INT attributes", () => {
            const attr = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "TREE_COUNT",
                dataType: "INT",
                intValue: 0
            });

            const errors = validateSocialDetails({ 1: attr });
            expect(errors[1]).toBe("Count must be at least 1.");
        });

        it("should enforce negative number checks on numeric types", () => {
            const attrInt = createBaseAttr({
                socialAttributeId: 1,
                dataType: "INT",
                intValue: -5
            });
            const attrDec = createBaseAttr({
                socialAttributeId: 2,
                dataType: "DECIMAL",
                decimalValue: -2.5
            });

            const errors = validateSocialDetails({ 1: attrInt, 2: attrDec });
            expect(errors[1]).toBe("Value cannot be negative.");
            expect(errors[2]).toBe("Value cannot be negative.");
        });

        it("should enforce range bounds checks for specialized attributes", () => {
            const attrRating = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "GREEN_PROPERTY_STAR_RATING",
                dataType: "INT",
                intValue: 6
            });

            const errors = validateSocialDetails({ 1: attrRating });
            expect(errors[1]).toBe("Rating must be between 1 and 5.");
        });

        it("should reject decimal ratings as they must be integers", () => {
            const attrRating = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "GREEN_PROPERTY_STAR_RATING",
                dataType: "INT",
                intValue: 4.2
            });

            const errors = validateSocialDetails({
                1: attrRating
            });

            expect(errors[1]).toBe("Value must be a valid integer.");
        });

        it("should enforce text field string length boundaries", () => {
            const attrStatus = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "WATER_CONN_STATUS",
                dataType: "TEXT",
                textValue: "ab" // length 2 (less than 3)
            });

            const errors = validateSocialDetails({ 1: attrStatus });
            expect(errors[1]).toBe("Water Connection Status must be at least 3 characters long.");
        });

        it("should support localized error messages when t is provided", () => {
            const attrRating = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "GREEN_PROPERTY_STAR_RATING",
                dataType: "INT",
                intValue: 6
            });

            // Mock t translator
            const tMock = Object.assign(
                (key: string, _values?: Record<string, string | number | Date>) => {
                    if (key === "discount.socialValidation.ratingRange") {
                        return "रेटिंग 1 और 5 के बीच होनी चाहिए।";
                    }
                    return key;
                },
                {
                    has: (key: string) => key === "discount.socialValidation.ratingRange"
                }
            );

            const errors = validateSocialDetails({ 1: attrRating }, tMock);
            expect(errors[1]).toBe("रेटिंग 1 और 5 के बीच होनी चाहिए।");
        });

        it("should support localized required messages with field name translation", () => {
            const attrRequired = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "ROAD_WIDTH",
                isRequiredWhenParentTrue: true,
                dataType: "DECIMAL",
                decimalValue: null
            });

            // Mock t translator
            const tMock = Object.assign(
                (key: string, values?: Record<string, string | number | Date>) => {
                    if (key === "discount.socialAttributes.ROAD_WIDTH") {
                        return "रस्त्याची रुंदी";
                    }
                    if (key === "discount.socialValidation.required") {
                        return `${values?.fieldName ?? ""} आवश्यक आहे.`;
                    }
                    return key;
                },
                {
                    has: (key: string) => [
                        "discount.socialAttributes.ROAD_WIDTH",
                        "discount.socialValidation.required"
                    ].includes(key)
                }
            );

            const errors = validateSocialDetails({ 1: attrRequired }, tMock);
            expect(errors[1]).toBe("Test Attribute आवश्यक आहे.");
        });

        it("should support fallback to sanitized name when code lookup fails", () => {
            const attrRequired = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "random_invalid_code",
                socialAttributeName: "Water Meter Available",
                isRequiredWhenParentTrue: true,
                dataType: "TEXT",
                textValue: null
            });

            // Mock t translator
            const tMock = Object.assign(
                (key: string, values?: Record<string, string | number | Date>) => {
                    if (key === "discount.socialAttributes.WATER_METER_AVAILABLE") {
                        return "पाण्याचा मीटर उपलब्ध";
                    }
                    if (key === "discount.socialValidation.required") {
                        return `${values?.fieldName ?? ""} आवश्यक आहे.`;
                    }
                    return key;
                },
                {
                    has: (key: string) => [
                        "discount.socialAttributes.WATER_METER_AVAILABLE",
                        "discount.socialValidation.required"
                    ].includes(key)
                }
            );

            const errors = validateSocialDetails({ 1: attrRequired }, tMock);
            expect(errors[1]).toBe("Water Meter Available आवश्यक आहे.");
        });

        it("should not require root BIT attributes on load even if isRequiredWhenParentTrue is true", () => {
            const attr = createBaseAttr({
                socialAttributeId: 1,
                socialAttributeCode: "HAS_SOLAR",
                socialAttributeName: "Solar Installed",
                dataType: "BIT",
                parentAttributeId: null,
                isRequiredWhenParentTrue: true,
                bitValue: null
            });
            const errors = validateSocialDetails({ 1: attr });
            expect(errors[1]).toBeUndefined();
        });

        it("should reject integers exceeding digits limit (dynamic based on code)", () => {
            const attrIntNormal = createBaseAttr({
                socialAttributeId: 1,
                dataType: "INT",
                intValue: 1234
            });
            const attrIntYear = createBaseAttr({
                socialAttributeId: 2,
                socialAttributeCode: "WATER_CONN_YEAR",
                dataType: "INT",
                intValue: 2026
            });
            const attrIntYearInvalid = createBaseAttr({
                socialAttributeId: 3,
                socialAttributeCode: "WATER_CONN_YEAR",
                dataType: "INT",
                intValue: 20267
            });
            const attrIntTree = createBaseAttr({
                socialAttributeId: 4,
                socialAttributeCode: "NUMBER_OF_TREES",
                dataType: "INT",
                intValue: 98765
            });
            const attrIntTreeInvalid = createBaseAttr({
                socialAttributeId: 5,
                socialAttributeCode: "NUMBER_OF_TREES",
                dataType: "INT",
                intValue: 1234567
            });
            const attrIntSolar = createBaseAttr({
                socialAttributeId: 6,
                socialAttributeCode: "NUMBER_OF_SOLAR",
                dataType: "INT",
                intValue: 1234
            });
            const attrIntSolarInvalid = createBaseAttr({
                socialAttributeId: 7,
                socialAttributeCode: "NUMBER_OF_SOLAR",
                dataType: "INT",
                intValue: 12345
            });

            const errors = validateSocialDetails({
                1: attrIntNormal,
                2: attrIntYear,
                3: attrIntYearInvalid,
                4: attrIntTree,
                5: attrIntTreeInvalid,
                6: attrIntSolar,
                7: attrIntSolarInvalid
            });

            expect(errors[1]).toBe("Value cannot exceed 3 digits.");
            expect(errors[2]).toBeUndefined();
            expect(errors[3]).toBe("Year cannot exceed 4 digits.");
            expect(errors[4]).toBeUndefined();
            expect(errors[5]).toBe("Value cannot exceed 6 digits.");
            expect(errors[6]).toBeUndefined();
            expect(errors[7]).toBe("Value cannot exceed 4 digits.");
        });

        it("should reject decimals with more than 2 decimal places", () => {
            const attrDecValid = createBaseAttr({
                socialAttributeId: 1,
                dataType: "DECIMAL",
                decimalValue: 12.34
            });
            const attrDecInvalid = createBaseAttr({
                socialAttributeId: 2,
                dataType: "DECIMAL",
                decimalValue: 12.345
            });

            const errors = validateSocialDetails({
                1: attrDecValid,
                2: attrDecInvalid
            });

            expect(errors[1]).toBeUndefined();
            expect(errors[2]).toBe("Maximum 2 decimal places allowed.");
        });

        it("should enforce photo required check when isPhotoRequired is true", () => {
            const attrPhotoMissing = createBaseAttr({
                socialAttributeId: 1,
                isPhotoRequired: true,
                documentGuid: null,
                documentBindingId: null
            });
            const attrPhotoPresentGuid = createBaseAttr({
                socialAttributeId: 2,
                isPhotoRequired: true,
                documentGuid: "some-guid",
                documentBindingId: null
            });
            const attrPhotoPresentBinding = createBaseAttr({
                socialAttributeId: 3,
                isPhotoRequired: true,
                documentGuid: null,
                documentBindingId: 123,
                fileName: "photo.jpg"
            });
            const attrPhotoBindingOnlyNoFile = createBaseAttr({
                socialAttributeId: 4,
                isPhotoRequired: true,
                documentGuid: null,
                documentBindingId: 123,
                fileName: null
            });

            const errors = validateSocialDetails({
                1: attrPhotoMissing,
                2: attrPhotoPresentGuid,
                3: attrPhotoPresentBinding,
                4: attrPhotoBindingOnlyNoFile
            });

            expect(errors[1]).toBe("Photo is required.");
            expect(errors[2]).toBeUndefined();
            expect(errors[3]).toBeUndefined();
            expect(errors[4]).toBe("Photo is required.");
        });
    });
});
