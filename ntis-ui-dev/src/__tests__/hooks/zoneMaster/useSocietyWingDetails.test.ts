import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSocietyWingDetails } from "@/hooks/zoneMaster/useSocietyWingDetails";
import { getSocietyWingDetailsAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { SocietyWingDetailItem } from "@/types/zone-master/properties/society-wing-details.types";

// Mock dependencies
vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  getSocietyWingDetailsAction: vi.fn(),
}));

describe("useSocietyWingDetails", () => {
  const mockWingDetails: SocietyWingDetailItem[] = [
    {
      propertyId: 1,
      societyDetailId: 101,
      wingId: 1,
      wingNo: "A",
      wardNo: "W1",
      propertyNo: "P001",
      wingName: "Wing A",
      societyName: "Test Society",
      societyAddress: "123 Test St",
      secretaryName: "John Doe",
      managerName: "Jane Smith",
      landOwnerName: "Land Owner",
      builderName: "Builder Co",
      societyNameEnglish: "Test Society",
      societyAddressEnglish: "123 Test St",
      secretaryNameEnglish: "John Doe",
      managerNameEnglish: "Jane Smith",
      landOwnerNameEnglish: "Land Owner",
      builderNameEnglish: "Builder Co",
      managerMobileNo: "1234567890",
      secretaryMobileNo: "0987654321",
      societyEmailId: "society@test.com",
      secretaryEmailId: "secretary@test.com",
      managerEmailId: "manager@test.com",
      propertyCount: 10,
      aminityCount: 5,
    },
    {
      propertyId: 1,
      societyDetailId: 102,
      wingId: 2,
      wingNo: "B",
      wardNo: "W1",
      propertyNo: "P001",
      wingName: "Wing B",
      societyName: "Test Society",
      societyAddress: "123 Test St",
      secretaryName: "John Doe",
      managerName: "Jane Smith",
      landOwnerName: "Land Owner",
      builderName: "Builder Co",
      societyNameEnglish: "Test Society",
      societyAddressEnglish: "123 Test St",
      secretaryNameEnglish: "John Doe",
      managerNameEnglish: "Jane Smith",
      landOwnerNameEnglish: "Land Owner",
      builderNameEnglish: "Builder Co",
      managerMobileNo: "1234567890",
      secretaryMobileNo: "0987654321",
      societyEmailId: "society@test.com",
      secretaryEmailId: "secretary@test.com",
      managerEmailId: "manager@test.com",
      propertyCount: 8,
      aminityCount: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty state", () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: null }));

    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.loadingWingDetails).toBe(false);
    expect(result.current.wingDetailsError).toBeNull();
  });

  it("should not fetch when propertyId is null", () => {
    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: null }));

    expect(getSocietyWingDetailsAction).not.toHaveBeenCalled();
    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.loadingWingDetails).toBe(false);
    expect(result.current.wingDetailsError).toBeNull();
  });

  it("should not fetch when propertyId is undefined", () => {
    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: undefined }));

    expect(getSocietyWingDetailsAction).not.toHaveBeenCalled();
    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.loadingWingDetails).toBe(false);
    expect(result.current.wingDetailsError).toBeNull();
  });

  it("should not fetch when propertyId is 0 or negative", () => {
    const { result: result1 } = renderHook(() => useSocietyWingDetails({ propertyId: 0 }));
    expect(getSocietyWingDetailsAction).not.toHaveBeenCalled();
    expect(result1.current.wingDetails).toEqual([]);

    const { result: result2 } = renderHook(() => useSocietyWingDetails({ propertyId: -1 }));
    expect(getSocietyWingDetailsAction).not.toHaveBeenCalled();
    expect(result2.current.wingDetails).toEqual([]);
  });

  it("should fetch wing details successfully when propertyId is provided", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: mockWingDetails,
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    expect(result.current.loadingWingDetails).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(getSocietyWingDetailsAction).toHaveBeenCalledWith(1);
    expect(result.current.wingDetails).toEqual(mockWingDetails);
    expect(result.current.wingDetailsError).toBeNull();
  });

  it("should handle empty wing details response", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.wingDetailsError).toBeNull();
  });

  it("should handle API error response", async () => {
    const errorMessage = "Failed to fetch wing details";
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.wingDetailsError).toBe(errorMessage);
  });

  it("should handle API error without custom message", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: false,
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.wingDetailsError).toBe("Failed to fetch wing details");
  });

  it("should handle thrown errors", async () => {
    const thrownError = new Error("Network error");
    vi.mocked(getSocietyWingDetailsAction).mockRejectedValue(thrownError);

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.wingDetailsError).toBe("Network error");
  });

  it("should handle non-Error thrown objects", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockRejectedValue("String error");

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.wingDetailsError).toBe("Failed to fetch wing details");
  });

  it("should refetch wing details when propertyId changes", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: mockWingDetails,
    });

    const { result, rerender } = renderHook(
      ({ propertyId }) => useSocietyWingDetails({ propertyId }),
      { initialProps: { propertyId: 1 } }
    );

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(getSocietyWingDetailsAction).toHaveBeenCalledTimes(1);
    expect(getSocietyWingDetailsAction).toHaveBeenCalledWith(1);

    // Change propertyId
    const newMockData: SocietyWingDetailItem[] = [
      {
        ...mockWingDetails[0],
        propertyId: 2,
        wingNo: "C",
        wingName: "Wing C",
        propertyCount: 15,
        aminityCount: 7,
      },
    ];

    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: newMockData,
    });

    rerender({ propertyId: 2 });

    await waitFor(() => {
      expect(result.current.wingDetails).toEqual(newMockData);
    });

    expect(getSocietyWingDetailsAction).toHaveBeenCalledTimes(2);
    expect(getSocietyWingDetailsAction).toHaveBeenCalledWith(2);
  });

  it("should clear wing details when propertyId changes to null", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: mockWingDetails,
    });

    const { result, rerender } = renderHook(
      ({ propertyId }: { propertyId: number | null }) => useSocietyWingDetails({ propertyId }),
      { initialProps: { propertyId: 1 as number | null } }
    );

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toEqual(mockWingDetails);

    // Change to null
    rerender({ propertyId: null });

    expect(result.current.wingDetails).toEqual([]);
    expect(result.current.wingDetailsError).toBeNull();
  });

  it("should manually refetch wing details using refetchWingDetails", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: mockWingDetails,
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(getSocietyWingDetailsAction).toHaveBeenCalledTimes(1);

    // Manually refetch
    const newMockData: SocietyWingDetailItem[] = [
      ...mockWingDetails,
      {
        ...mockWingDetails[0],
        societyDetailId: 103,
        wingId: 3,
        wingNo: "C",
        wingName: "Wing C",
        propertyCount: 12,
        aminityCount: 6,
      },
    ];

    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: newMockData,
    });

    await result.current.refetchWingDetails();

    await waitFor(() => {
      expect(result.current.wingDetails).toEqual(newMockData);
    });

    expect(getSocietyWingDetailsAction).toHaveBeenCalledTimes(2);
  });

  it("should handle loading state correctly during fetch", async () => {
    let resolvePromise: (value: { success: boolean; data?: SocietyWingDetailItem[] }) => void;
    const promise = new Promise<{ success: boolean; data?: SocietyWingDetailItem[] }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(getSocietyWingDetailsAction).mockReturnValue(promise);

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    // Should be loading
    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(true);
    });

    // Resolve the promise
    resolvePromise!({
      success: true,
      data: mockWingDetails,
    });

    // Should finish loading
    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toEqual(mockWingDetails);
  });

  it("should clear error when refetching after error", async () => {
    // First call returns error
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValueOnce({
      success: false,
      error: "Initial error",
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.wingDetailsError).toBe("Initial error");
    });

    // Second call succeeds
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValueOnce({
      success: true,
      data: mockWingDetails,
    });

    await result.current.refetchWingDetails();

    await waitFor(() => {
      expect(result.current.wingDetailsError).toBeNull();
      expect(result.current.wingDetails).toEqual(mockWingDetails);
    });
  });

  it("should handle concurrent propertyId changes correctly", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: mockWingDetails,
    });

    const { result, rerender } = renderHook(
      ({ propertyId }) => useSocietyWingDetails({ propertyId }),
      { initialProps: { propertyId: 1 } }
    );

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    // Quickly change propertyId multiple times
    rerender({ propertyId: 2 });
    rerender({ propertyId: 3 });
    rerender({ propertyId: 4 });

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    // Should be called for the last propertyId
    expect(getSocietyWingDetailsAction).toHaveBeenLastCalledWith(4);
  });

  it("should provide refetchWingDetails function", () => {
    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: null }));

    expect(typeof result.current.refetchWingDetails).toBe("function");
  });

  it("should correctly handle wing details with property and amenity counts", async () => {
    const detailedWingData: SocietyWingDetailItem[] = [
      {
        ...mockWingDetails[0],
        propertyCount: 25,
        aminityCount: 10,
      },
    ];

    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: detailedWingData,
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails[0].propertyCount).toBe(25);
    expect(result.current.wingDetails[0].aminityCount).toBe(10);
  });

  it("should handle multiple wings for same property", async () => {
    const multipleWings: SocietyWingDetailItem[] = [
      mockWingDetails[0],
      mockWingDetails[1],
      {
        ...mockWingDetails[0],
        societyDetailId: 103,
        wingId: 3,
        wingNo: "C",
        wingName: "Wing C",
        propertyCount: 12,
        aminityCount: 6,
      },
    ];

    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: multipleWings,
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    expect(result.current.wingDetails).toHaveLength(3);
    expect(result.current.wingDetails[0].wingNo).toBe("A");
    expect(result.current.wingDetails[1].wingNo).toBe("B");
    expect(result.current.wingDetails[2].wingNo).toBe("C");
  });

  it("should preserve wing details structure from API", async () => {
    vi.mocked(getSocietyWingDetailsAction).mockResolvedValue({
      success: true,
      data: [mockWingDetails[0]],
    });

    const { result } = renderHook(() => useSocietyWingDetails({ propertyId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingWingDetails).toBe(false);
    });

    const wingDetail = result.current.wingDetails[0];
    expect(wingDetail).toHaveProperty("propertyId");
    expect(wingDetail).toHaveProperty("societyDetailId");
    expect(wingDetail).toHaveProperty("wingId");
    expect(wingDetail).toHaveProperty("wingNo");
    expect(wingDetail).toHaveProperty("wingName");
    expect(wingDetail).toHaveProperty("propertyCount");
    expect(wingDetail).toHaveProperty("aminityCount");
    expect(wingDetail).toHaveProperty("societyName");
    expect(wingDetail).toHaveProperty("managerMobileNo");
    expect(wingDetail).toHaveProperty("secretaryEmailId");
  });
});
