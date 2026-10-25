import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyEditFormValidation } from "@/hooks/apartmentQc/usePropertyEditFormValidation";
import type { PropertyBasicInfoFormData, FloorDataRow } from "@/types/propertyEdit.types";

describe("usePropertyEditFormValidation", () => {
  const mockBasicInfoCopy = {
    title: "Basic Information",
    fields: {
      ownerName: { label: "Owner Name", placeholder: "" },
      occupierName: { label: "Occupier Name", placeholder: "" },
      renterName: { label: "Renter Name", placeholder: "" },
      mobileNo: { label: "Mobile", placeholder: "" },
      emailId: { label: "Email", placeholder: "" },
      flatOrShopNo: { label: "Flat No", placeholder: "" },
      wingName: { label: "Wing", placeholder: "" },
      oldPropertyNo: { label: "Old Property No", placeholder: "" },
      propertyType: { label: "Property Type", placeholder: "" },
      propertyDescription: { label: "Property Description", placeholder: "" },
      bhk: { label: "BHK", placeholder: "" },
      flatOrShopName: { label: "Flat Name", placeholder: "" },
      remark: { label: "Remark" },
      oldRV: { label: "Old RV" },
      newRV: { label: "New RV" },
      oldTax: { label: "Old Tax" },
      newTax: { label: "New Tax" },
      oldArea: { label: "Old Area" },
      newArea: { label: "New Area" },
      oldUseType: { label: "Old Use Type" },
      oldConstructionType: { label: "Old Construction Type" },
      oldCSN: { label: "Old CSN" },
      oldConstructionYear: { label: "Old Construction Year" },
    },
    validation: {
      ownerNameRequired: "Owner name is required",
      occupierNameRequired: "Occupier name is required",
      invalidNameFormat: "Invalid name format",
      invalidMobile: "Invalid mobile number",
      invalidEmail: "Invalid email address",
      flatOrShopNoRequired: "Flat/Shop number is required",
      invalidWingFormat: "Invalid wing format",
      invalidPropertyNoFormat: "Invalid property number format",
    },
  };

  const mockFloorQCCopy = {
    title: "Floor QC",
    columns: {
      floor: "Floor",
      conYear: "Construction Year",
      asstYear: "Assessment Year",
      conType: "Construction Type",
      use: "Use",
      subTypeOfUse: "Sub Type",
      noOfRooms: "Rooms",
      area: "Area",
      rentMY: "Rent MY",
      rateMY: "Rate MY",
      rentalValue: "Rental Value",
      depreciation: "Depreciation",
      alv: "ALV",
      mr: "MR",
      rv: "RV",
      sdrr: "SDRR",
      baseValue: "Base Value",
      floorFactor: "Floor Factor",
      ageFactor: "Age Factor",
      ntbFactor: "NTB Factor",
      useFactor: "Use Factor",
      capitalValue: "Capital Value",
    },
    tabs: {
      rateable: "Rateable",
      capital: "Capital",
    },
    validation: {
      invalidYear: "Invalid year",
      yearOutOfRange: "Year out of range",
    },
    tooltips: {
      viewRoomDetails: "View room details",
      noDetailId: "No detail ID",
    },
  };

  const initialFormData: PropertyBasicInfoFormData = {
    ownerName: "",
    occupierName: "",
    renterName: "",
    propertyDescription: "",
    propertyTypeId: "",
    bhk: "",
    mobileNo: "",
    emailId: "",
    wingName: "",
    flatOrShopNo: "",
    flatOrShopName: "",
    oldPropertyNo: "",
    remark: "",
    oldRV: "",
    newRV: "",
    oldTax: "",
    newTax: "",
    oldArea: "",
    newArea: "",
    oldUseType: "",
    oldConstructionType: "",
    oldCSN: "",
    oldConstructionYear: "",
  };

  const initialFloorData: FloorDataRow[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty errors", () => {
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData: initialFormData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    expect(result.current.errors).toEqual({});
  });

  it("should validate required owner name", () => {
    const formData = { ...initialFormData, ownerName: "" };
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.ownerName).toBe("Owner name is required");
  });

  it("should validate required occupier name", () => {
    const formData = { ...initialFormData, ownerName: "John Doe", occupierName: "" };
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.occupierName).toBe("Occupier name is required");
  });

  it("should validate mobile number format", () => {
    const formData = { ...initialFormData, ownerName: "John Doe", occupierName: "Jane Doe", mobileNo: "123" };
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.mobileNo).toBe("Invalid mobile number");
  });

  it("should validate email format", () => {
    const formData = {
      ...initialFormData,
      ownerName: "John Doe",
      occupierName: "Jane Doe",
      emailId: "invalid-email",
    };
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.emailId).toBe("Invalid email address");
  });

  it("should validate required flat/shop number", () => {
    const formData = {
      ...initialFormData,
      ownerName: "John Doe",
      occupierName: "Jane Doe",
      flatOrShopNo: "",
    };
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.flatOrShopNo).toBe("Flat/Shop number is required");
  });

  it("should pass validation with valid data", () => {
    const formData: PropertyBasicInfoFormData = {
      ownerName: "John Doe",
      occupierName: "Jane Doe",
      renterName: "",
      propertyDescription: "",
      propertyTypeId: "1",
      bhk: "",
      mobileNo: "9876543210",
      emailId: "test@example.com",
      wingName: "",
      flatOrShopNo: "101",
      flatOrShopName: "",
      oldPropertyNo: "",
      remark: "",
      oldRV: "",
      newRV: "",
      oldTax: "",
      newTax: "",
      oldArea: "",
      newArea: "",
      oldUseType: "",
      oldConstructionType: "",
      oldCSN: "",
      oldConstructionYear: "",
    };
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(true);
    });

    expect(Object.keys(result.current.errors).length).toBe(0);
  });

  it("should handle field blur", () => {
    const formData = { ...initialFormData, ownerName: "" };
    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData,
        floorData: initialFloorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    act(() => {
      result.current.handleBlur("ownerName");
    });

    expect(result.current.touched.ownerName).toBe(true);
  });

  it("should clear error when valid value is provided", () => {
    let formData = { ...initialFormData, ownerName: "" };
    const { result, rerender } = renderHook(
      ({ formData }) =>
        usePropertyEditFormValidation({
          formData,
          floorData: initialFloorData,
          basicInfoCopy: mockBasicInfoCopy,
          floorQCCopy: mockFloorQCCopy,
        }),
      { initialProps: { formData } }
    );

    // First validation should fail
    act(() => {
      result.current.validateForm();
    });
    expect(result.current.errors.ownerName).toBeTruthy();

    // Update with valid owner name
    formData = { ...initialFormData, ownerName: "John Doe", occupierName: "Jane", flatOrShopNo: "101" };
    rerender({ formData });

    // Validate again should pass for owner name
    act(() => {
      result.current.validateForm();
    });
    expect(result.current.errors.ownerName).toBeUndefined();
  });

  it("should handle floor QC year validation", () => {
    const floorData: FloorDataRow[] = [
      {
        id: "row-1",
        pdnId: 1,
        floorId: "1",
        conYear: "abc", // Invalid year
        asstYear: "2023",
        constructionTypeId: "1",
        typeOfUseId: "1",
        subTypeOfUseId: "1",
        noOfRooms: "3",
        area: "1000",
        rentMY: "",
        rateMY: "",
        rentalValue: "",
        depreciation: "",
        alv: "",
        mr: "",
        rv: "",
        sdrr: "",
        baseValue: "",
        floorFactor: "",
        ageFactor: "",
        ntbFactor: "",
        useFactor: "",
        capitalValue: "",
      },
    ];

    const { result } = renderHook(() =>
      usePropertyEditFormValidation({
        formData: initialFormData,
        floorData,
        basicInfoCopy: mockBasicInfoCopy,
        floorQCCopy: mockFloorQCCopy,
      })
    );

    const yearError = result.current.validateYear("abc");
    expect(yearError).toBe("Invalid year");
  });
});
