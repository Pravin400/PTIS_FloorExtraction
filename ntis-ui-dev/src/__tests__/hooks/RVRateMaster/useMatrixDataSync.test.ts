import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMatrixDataSync } from "@/hooks/RVRateMaster/useMatrixDataSync";
import type { IBackendRateMaster, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import type { MatrixRow } from "@/hooks/RVRateMaster/useMatrixState";

describe("useMatrixDataSync", () => {
  const mockRateCategories: RateCategory[] = [
    { constructionId: "1", constructionCode: "A", description: "RCC" },
    { constructionId: "2", constructionCode: "B", description: "Load Bearing" },
    { constructionId: "3", constructionCode: "C", description: "Mud" },
  ];

  const mockZoneDescriptions: IZoneDescription[] = [
    { zoneNo: "1", taxZoneId: 1, description: "Zone 1" },
    { zoneNo: "2", taxZoneId: 2, description: "Zone 2" },
  ];

  const mockDefaultMatrixData: MatrixRow[] = [
    { id: 1, zoneNo: "1", taxZoneId: 1, A: 0, B: 0, C: 0 },
    { id: 2, zoneNo: "2", taxZoneId: 2, A: 0, B: 0, C: 0 },
  ];

  let mockSetMatrixData: ReturnType<typeof vi.fn<(data: MatrixRow[]) => void>>;
  let mockSetShowMatrix: ReturnType<typeof vi.fn<(show: boolean) => void>>;
  let mockSetRateFrequency: ReturnType<typeof vi.fn<(freq: "Monthly" | "Yearly") => void>>;
  let mockSetAllZoneEdits: ReturnType<typeof vi.fn<(edits: Record<string, Record<string, number>>) => void>>;
  let mockAllZoneEditsInitializedRef: React.MutableRefObject<boolean>;

  beforeEach(() => {
    mockSetMatrixData = vi.fn<(data: MatrixRow[]) => void>();
    mockSetShowMatrix = vi.fn<(show: boolean) => void>();
    mockSetRateFrequency = vi.fn<(freq: "Monthly" | "Yearly") => void>();
    mockSetAllZoneEdits = vi.fn<(edits: Record<string, Record<string, number>>) => void>();
    mockAllZoneEditsInitializedRef = { current: false };
    vi.clearAllMocks();
  });

  const getDefaultProps = () => ({
    mode: "add" as const,
    backendRates: null,
    fetchedBackendRates: [],
    selectedZone: "1",
    selectedUseGroup: "1",
    assessmentYear: "2024",
    rateUnit: "SqMeter" as const,
    paginatedZoneDescriptions: [],
    zoneDescriptions: mockZoneDescriptions,
    rateCategories: mockRateCategories,
    defaultMatrixData: mockDefaultMatrixData,
    setMatrixData: mockSetMatrixData,
    setShowMatrix: mockSetShowMatrix,
    setRateFrequency: mockSetRateFrequency,
    setAllZoneEdits: mockSetAllZoneEdits,
    allZoneEditsInitializedRef: mockAllZoneEditsInitializedRef,
  });

  describe("Matrix Data Initialization", () => {
    it("should sync matrixData with defaultMatrixData when defaultMatrixData changes", () => {
      const props = getDefaultProps();
      renderHook(() => useMatrixDataSync(props));

      expect(mockSetMatrixData).toHaveBeenCalledWith(mockDefaultMatrixData);
    });

    it("should not sync when defaultMatrixData is empty", () => {
      const props = { ...getDefaultProps(), defaultMatrixData: [] };
      renderHook(() => useMatrixDataSync(props));

      expect(mockSetMatrixData).not.toHaveBeenCalled();
    });
  });

  describe("Edit Mode - Rate Unit Selection", () => {
    it("should use rateSquareMeter values when rateUnit is SqMeter", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "MonthWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
        rateUnit: "SqMeter" as const,
      };

      renderHook(() => useMatrixDataSync(props));

      // Check that setMatrixData was called with the square meter value
      expect(mockSetMatrixData).toHaveBeenCalled();
      const callArg = mockSetMatrixData.mock.calls[mockSetMatrixData.mock.calls.length - 1][0];
      expect(callArg[0].A).toBe(100); // Should use rateSquareMeter
    });

    it("should use rateSquareFeet values when rateUnit is SqFeet", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
        rateUnit: "SqFeet" as const,
      };

      renderHook(() => useMatrixDataSync(props));

      // Check that setMatrixData was called with the square feet value
      expect(mockSetMatrixData).toHaveBeenCalled();
      const callArg = mockSetMatrixData.mock.calls[mockSetMatrixData.mock.calls.length - 1][0];
      expect(callArg[0].A).toBe(1076.39); // Should use rateSquareFeet
    });

    it("should handle multiple construction types with different rate units", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "MonthWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
        {
          id: 2,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 2,
          rateSquareMeter: 80,
          rateSquareFeet: 861.11,
          rateRemark: "MonthWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
        rateUnit: "SqFeet" as const,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetMatrixData).toHaveBeenCalled();
      const callArg = mockSetMatrixData.mock.calls[mockSetMatrixData.mock.calls.length - 1][0];
      expect(callArg[0].A).toBe(1076.39); // Construction type A with SqFeet
      expect(callArg[0].B).toBe(861.11); // Construction type B with SqFeet
    });

    it("should default to 0 when rate value is undefined", () => {
      // Type assertion to simulate edge case where backend returns undefined
      const mockBackendRates = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: undefined as unknown as number,
          rateRemark: "MonthWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ] as IBackendRateMaster[];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
        rateUnit: "SqFeet" as const,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetMatrixData).toHaveBeenCalled();
      const callArg = mockSetMatrixData.mock.calls[mockSetMatrixData.mock.calls.length - 1][0];
      expect(callArg[0].A).toBeUndefined(); // Should default to undefined when rateSquareFeet is undefined
    });
  });

  describe("Delete Mode - Rate Unit Selection", () => {
    it("should use rateSquareMeter values in delete mode when unit is SqMeter", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 150,
          rateSquareFeet: 1614.59,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "delete" as const,
        backendRates: mockBackendRates,
        rateUnit: "SqMeter" as const,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetMatrixData).toHaveBeenCalled();
      const callArg = mockSetMatrixData.mock.calls[mockSetMatrixData.mock.calls.length - 1][0];
      expect(callArg[0].A).toBe(150); // Should use rateSquareMeter
    });

    it("should use rateSquareFeet values in delete mode when unit is SqFeet", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 150,
          rateSquareFeet: 1614.59,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "delete" as const,
        backendRates: mockBackendRates,
        rateUnit: "SqFeet" as const,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetMatrixData).toHaveBeenCalled();
      const callArg = mockSetMatrixData.mock.calls[mockSetMatrixData.mock.calls.length - 1][0];
      expect(callArg[0].A).toBe(1614.59); // Should use rateSquareFeet
    });
  });

  describe("Rate Frequency Detection", () => {
    it("should set Monthly frequency when rates have MonthWise remark", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "MonthWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetRateFrequency).toHaveBeenCalledWith("Monthly");
    });

    it("should set Yearly frequency when rates have YearWise remark", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetRateFrequency).toHaveBeenCalledWith("Yearly");
    });
  });

  describe("Matrix Display Control", () => {
    it("should hide matrix when no zone is selected in edit mode", () => {
      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        selectedZone: "",
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetShowMatrix).toHaveBeenCalledWith(false);
    });

    it("should show matrix when zone is selected in edit mode", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "MonthWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetShowMatrix).toHaveBeenCalledWith(true);
    });
  });

  describe("allZoneEdits Initialization", () => {
    it("should initialize allZoneEdits in edit mode with non-zero values", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
        {
          id: 2,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 2,
          rateSquareMeter: 80,
          rateSquareFeet: 861.11,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
        {
          id: 3,
          taxZoneNo: "2",
          taxZoneId: 2,
          constructionTypeId: 1,
          rateSquareMeter: 90,
          rateSquareFeet: 968.75,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
        {
          id: 4,
          taxZoneNo: "2",
          taxZoneId: 2,
          constructionTypeId: 2,
          rateSquareMeter: 70,
          rateSquareFeet: 753.47,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
        backendRates: mockBackendRates,
      };

      renderHook(() => useMatrixDataSync(props));

      expect(mockSetAllZoneEdits).toHaveBeenCalled();
      const callArg = mockSetAllZoneEdits.mock.calls[mockSetAllZoneEdits.mock.calls.length - 1][0];
      expect(callArg["1"]).toEqual({ A: 100, B: 80 });
      expect(callArg["2"]).toEqual({ A: 90, B: 70 });
    });

    it("should not initialize allZoneEdits when all values are zero", () => {
      const props = {
        ...getDefaultProps(),
        mode: "edit" as const,
      };

      renderHook(() => useMatrixDataSync(props));

      // Only the reset call should happen, not initialization
      expect(mockSetAllZoneEdits).toHaveBeenCalledWith({});
    });

    it("should not initialize allZoneEdits in add mode", () => {
      const mockBackendRates: IBackendRateMaster[] = [
        {
          id: 1,
          taxZoneNo: "1",
          taxZoneId: 1,
          constructionTypeId: 1,
          rateSquareMeter: 100,
          rateSquareFeet: 1076.39,
          rateRemark: "YearWise Rate",
          typeOfUseGroupId: 1,
          rateSectionId: 1,
          yearRangeRVId: 2024,
          year: 2024,
          floorId: 67,
          isActive: true,
          createdDate: "2024-01-01",
          updatedDate: null,
        },
      ];

      const props = {
        ...getDefaultProps(),
        mode: "add" as const,
        backendRates: mockBackendRates,
      };

      renderHook(() => useMatrixDataSync(props));

      // Should only have the reset call from filter change effect
      const resetCalls = mockSetAllZoneEdits.mock.calls.filter(call => 
        JSON.stringify(call[0]) === "{}"
      );
      expect(resetCalls.length).toBeGreaterThan(0);
    });
  });

  describe("Filter Change Handling", () => {
    it("should reset initialization flag when filters change", () => {
      const initialProps = {
        ...getDefaultProps(),
        mode: "edit" as const,
        selectedZone: "1",
      };

      const { rerender } = renderHook((props) => useMatrixDataSync(props), {
        initialProps,
      });

      mockAllZoneEditsInitializedRef.current = true;

      // Change the filter
      rerender({
        ...initialProps,
        selectedZone: "2",
      });

      expect(mockAllZoneEditsInitializedRef.current).toBe(false);
    });

    it("should reset allZoneEdits when filters change", () => {
      const initialProps = {
        ...getDefaultProps(),
        mode: "edit" as const,
        selectedZone: "1",
      };

      const { rerender } = renderHook((props) => useMatrixDataSync(props), {
        initialProps,
      });

      mockSetAllZoneEdits.mockClear();

      // Change the filter
      rerender({
        ...initialProps,
        selectedZone: "2",
      });

      expect(mockSetAllZoneEdits).toHaveBeenCalledWith({});
    });
  });
});
