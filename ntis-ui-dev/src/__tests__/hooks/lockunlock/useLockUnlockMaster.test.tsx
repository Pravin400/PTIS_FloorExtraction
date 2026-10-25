import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { LockedScreen, LockUnlockPropertyItem, LockUnlockPropertiesResponse } from "@/types/lockunlock.types";
import { useLockUnlockMaster } from "@/hooks/lockunlock/useLockUnlockMaster";

// Mock next-intl
const mockT = vi.fn((key: string, _values?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    "messages.validationError": "Please fill in all required fields",
    "messages.fetchSuccess": "Properties fetched successfully",
    "messages.fetchNoResults": "No properties found",
    "messages.fetchFailed": "Failed to fetch properties",
    "messages.fetchPropertiesFailed": "Failed to fetch properties",
    "messages.screenRequired": "Please select at least one screen",
    "messages.lockConfirmTitle": "Confirm Lock",
    "messages.unlockConfirmTitle": "Confirm Unlock",
    "messages.lockButtonText": "Lock",
    "messages.unlockButtonText": "Unlock",
    "messages.clearedFilters": "Filters cleared",
    "messages.selectPropertyRequired": "Please select at least one property",
    "messages.selectScreenRequired": "Please select at least one screen",
    "messages.bulkLockTitle": "Confirm Bulk Lock",
    "messages.bulkUnlockTitle": "Confirm Bulk Unlock",
    "messages.bulkSuccess": "Bulk operation successful",
    "messages.bulkFailed": "Bulk operation failed",
    "messages.propertySuccess": "Property {action} successfully",
    "messages.operationFailed": "Operation failed",
    "messages.unexpectedError": "An unexpected error occurred",
    "messages.saveSuccess": "Changes saved successfully",
    "messages.saveFailed": "Failed to save changes",
    "messages.savePartialFailed": "Some changes could not be saved",
    "resultsTable.status.locked": "locked",
    "resultsTable.status.unlocked": "unlocked",
    "lockUnlock": "lockUnlock",
  };
  if (key === "lockUnlock") return "lockUnlock";
  return (translations[key] as string) || key;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

mockT.rich = vi.fn((key: string) => key);

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = "/property-tax/lockunlock";
const mockSearchParams = new URLSearchParams();
const mockRouter = { push: mockPush };
const mockUseRouter = vi.fn(() => mockRouter);
const mockUsePathname = vi.fn(() => mockPathname);
const mockUseSearchParams = vi.fn(() => mockSearchParams);

vi.mock("next/navigation", () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock ConfirmProvider
const mockConfirm = vi.fn();
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

// Mock the server actions
const mockFetchAction = vi.fn();
const mockBulkAction = vi.fn();
vi.mock("@/app/[locale]/property-tax/lockunlock/action", () => ({
  fetchLockUnlockPropertiesPagedAction: (...args: unknown[]) => mockFetchAction(...args),
  bulkLockUnlockPropertiesAction: (...args: unknown[]) => mockBulkAction(...args),
}));

// Mock lockunlock utils
vi.mock("@/lib/api/lockunlock/lockunlock.utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/lockunlock/lockunlock.utils")>();
  return {
    ...actual,
    getScreenIds: (list: (number | { id: number })[]) =>
      (list || []).map((item) => (typeof item === "object" ? item.id : Number(item))).filter((id) => id > 0),
  };
});

// Mock useLockUnlockColumns
vi.mock("@/hooks/lockunlock/useLockUnlockColumns", () => ({
  useLockUnlockColumns: () => [],
}));

describe("useLockUnlockMaster", () => {
  const mockScreens: LockedScreen[] = [
    { id: 1, screenCode: "S1", screenName: "Screen 1", screenNameLocal: "", displayOrder: 1 },
    { id: 2, screenCode: "S2", screenName: "Screen 2", screenNameLocal: "", displayOrder: 2 },
  ];

  const mockProperties: LockUnlockPropertyItem[] = [
    {
      propertyId: 101,
      wardId: 1,
      wardNo: "1",
      propertyNo: "P001",
      partitionNo: "A",
      isLocked: true,
      lockedScreens: [1],
    },
  ];

  const defaultProps = {
    wardIdFromUrl: "1",
    screens: mockScreens,
    dropdownProperties: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.get = vi.fn(() => null);
    mockSearchParams.toString = vi.fn(() => "");
    mockFetchAction.mockResolvedValue({
      items: mockProperties,
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    } as LockUnlockPropertiesResponse);
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    expect(result.current.formData).toEqual({
      searchCategory: 1,
      zoneId: "",
      wardId: "1",
      fromProperty: "",
      toProperty: "",
      propertyNos: [],
    });
    expect(result.current.selectedScreenIds).toEqual([]);
    expect(result.current.showResults).toBe(false);
    expect(result.current.properties).toEqual([]);
    expect(result.current.selectedPropertyIds).toEqual([]);
    expect(result.current.isPending).toBe(false);
    expect(result.current.pagination).toEqual({
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    });
  });

  it("should initialize with provided initial properties and pagination", () => {
    const { result } = renderHook(() =>
      useLockUnlockMaster({
        ...defaultProps,
        initialProperties: mockProperties,
        initialPagination: {
          pageNumber: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
        },
      })
    );

    expect(result.current.properties).toEqual(mockProperties);
    expect(result.current.showResults).toBe(true);
    expect(result.current.pagination.totalCount).toBe(1);
  });

  it("should handle select property", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    act(() => {
      result.current.handleSelectProperty(101);
    });

    // When searchCategory is 1 (default), isAllPropertiesSelected is true
    // so it should add to excludedPropertyIds
    expect(result.current.excludedPropertyIds).toEqual([101]);

    act(() => {
      result.current.handleSelectProperty(101);
    });

    expect(result.current.excludedPropertyIds).toEqual([]);
  });

  it("should handle select all properties", () => {
    const { result } = renderHook(() =>
      useLockUnlockMaster({
        ...defaultProps,
        initialProperties: mockProperties,
      })
    );

    act(() => {
      result.current.handleSelectAllProperties();
    });

    expect(result.current.isAllPropertiesSelected).toBe(false);
    expect(result.current.selectedPropertyIds).toEqual([]);
    expect(result.current.excludedPropertyIds).toEqual([]);

    act(() => {
      result.current.handleSelectAllProperties();
    });

    expect(result.current.isAllPropertiesSelected).toBe(true);
    expect(result.current.selectedPropertyIds).toEqual([]);
    expect(result.current.excludedPropertyIds).toEqual([]);
  });

  it("should handle clear all", () => {
    const { result } = renderHook(() =>
      useLockUnlockMaster({
        ...defaultProps,
        initialProperties: mockProperties,
        initialPagination: { pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      })
    );

    act(() => {
      result.current.handleClearAll();
    });

    expect(result.current.formData).toEqual({
      searchCategory: 1,
      zoneId: "",
      wardId: "",
      fromProperty: "",
      toProperty: "",
      propertyNos: [],
    });
    expect(result.current.selectedScreenIds).toEqual([]);
    expect(result.current.showResults).toBe(false);
    expect(result.current.properties).toEqual([]);
    expect(result.current.selectedPropertyIds).toEqual([]);
    expect(mockPush).toHaveBeenCalledWith(`${mockPathname}?searchCategory=1`);
  });

  it("should handle select change for wardId", async () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    await act(async () => {
      result.current.handleSelectChange("wardId", "2");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.formData.wardId).toBe("2");
  });

  it("should handle select change for fromProperty", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    act(() => {
      result.current.handleSelectChange("fromProperty", "P001");
    });

    expect(result.current.formData.fromProperty).toBe("P001");
  });

  it("should handle select change for toProperty", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    act(() => {
      result.current.handleSelectChange("toProperty", "P002");
    });

    expect(result.current.formData.toProperty).toBe("P002");
  });

  it("should handle manage locks and open modal", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    act(() => {
      result.current.handleManageLocks(mockProperties[0]);
    });

    expect(result.current.editModal.isOpen).toBe(true);
    expect(result.current.editModal.property).toEqual(mockProperties[0]);
  });

  it("should show error when toggling lock without selected screens", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    // Use an unlocked property so willLock=true
    const unlockedProperty: LockUnlockPropertyItem = {
      propertyId: 103,
      wardId: 1,
      wardNo: "1",
      propertyNo: "P003",
      partitionNo: "",
      isLocked: false,
      lockedScreens: [],
    };

    act(() => {
      result.current.handleToggleLock(unlockedProperty);
    });

    // Should show error toast because willLock=true and selectedScreenIds is empty
    expect(toast.error).toHaveBeenCalled();
  });

  it("should call confirm when toggling lock with screens selected", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    act(() => {
      result.current.setSelectedScreenIds([1, 2]);
    });

    act(() => {
      result.current.handleToggleLock(mockProperties[0]);
    });

    expect(mockConfirm).toHaveBeenCalled();
    const confirmCall = mockConfirm.mock.calls[0][0];
    // Property starts locked (isLocked: true), so toggling triggers unlock
    expect(confirmCall.variant).toBe("info");
    expect(confirmCall.confirmText).toBe("Unlock");
  });

  it("should handle bulk action without selected properties", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    act(() => {
      result.current.handleBulkAction("lock");
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("should handle bulk action without selected screens", () => {
    const { result } = renderHook(() => useLockUnlockMaster(defaultProps));

    act(() => {
      result.current.handleSelectProperty(101);
    });

    act(() => {
      result.current.handleBulkAction("lock");
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("should call confirm when bulk action with selections", () => {
    const { result } = renderHook(() => useLockUnlockMaster({
      ...defaultProps,
      initialProperties: mockProperties,
      initialPagination: { pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
    }));

    act(() => {
      // Screen 2 is not locked on mockProperties[0], so exactApplicableCount will be 1
      result.current.setSelectedScreenIds([2]);
    });

    act(() => {
      result.current.handleBulkAction("lock");
    });

    expect(mockConfirm).toHaveBeenCalled();
    const confirmCall = mockConfirm.mock.calls[0][0];
    expect(confirmCall.variant).toBe("warning");
    expect(confirmCall.confirmText).toBe("Lock");
  });
});