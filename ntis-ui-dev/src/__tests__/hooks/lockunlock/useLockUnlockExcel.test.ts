import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLockUnlockExcel } from "@/hooks/lockunlock/useLockUnlockExcel";
import { fetchLockUnlockPropertiesByExcelAction } from "@/app/[locale]/property-tax/lockunlock/action";

// Mock toast methods
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  toast: vi.fn(),
};

vi.mock("@/components/common", () => ({
  useToast: () => mockToast,
  useConfirm: () => ({ confirm: vi.fn() }),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

// Mock next-intl
const mockT = vi.fn((key: string, values?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    "selectPropertyCard.invalidFile": "Invalid file. Please upload an .xlsx or .xls file.",
    "selectPropertyCard.fileSelected": values?.name ? `${values.name} selected` : "File selected",
    "selectPropertyCard.excelUploadRequired": "Please upload an Excel file first.",
    "messages.excelDuplicatesNotice": `Found ${values?.count} duplicate rows in the Excel file. Each property is shown only once.`,
    "messages.unexpectedError": "An unexpected error occurred",
    "messages.fetchNoResults": "No properties found.",
    "messages.fetchFailed": "Failed to load properties.",
  };
  return translations[key] || key;
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = "/property-tax/lockunlock";
const mockSearchParams = new URLSearchParams();
const mockRouter = { push: mockPush };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// Mock action
vi.mock("@/app/[locale]/property-tax/lockunlock/action", () => ({
  fetchLockUnlockPropertiesByExcelAction: vi.fn(),
  fetchLockUnlockPropertiesPagedAction: vi.fn(),
  bulkLockUnlockPropertiesAction: vi.fn(),
}));

import { SEARCH_CATEGORY } from "@/types/lockunlock.types";

describe("useLockUnlockExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useLockUnlockExcel());

    expect(result.current.excelFile).toBeNull();
    expect(result.current.excelFileName).toBe("");
    expect(result.current.isExcelSearching).toBe(false);
    expect(result.current.properties).toEqual([]);
    expect(result.current.showResults).toBe(false);
    expect(result.current.pagination.pageNumber).toBe(1);
  });

  it("should fetch Excel properties and show duplicate toast if duplicateCount > 0", async () => {
    const mockResponse = {
      items: [
        { propertyId: 1, wardId: 1, wardNo: "W1", propertyNo: "1", partitionNo: "", isLocked: false, lockedScreens: [] },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
      duplicateCount: 3,
      fileSessionId: "session-123",
    };

    vi.mocked(fetchLockUnlockPropertiesByExcelAction).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useLockUnlockExcel());

    const file = new File(["content"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    act(() => {
      result.current.setExcelFile(file);
      result.current.setExcelFileName("test.xlsx");
      result.current.handleScopeChange(SEARCH_CATEGORY.EXCEL);
    });

    await act(async () => {
      await result.current.handleShow(true);
    });

    expect(result.current.properties).toHaveLength(1);
    expect(result.current.showResults).toBe(true);
    expect(mockToast.info).toHaveBeenCalledWith(
      "Found 3 duplicate rows in the Excel file. Each property is shown only once."
    );
  });

  it("should not show duplicate toast when paginating", async () => {
    const mockResponse = {
      items: [
        { propertyId: 2, wardId: 1, wardNo: "W1", propertyNo: "2", partitionNo: "", isLocked: false, lockedScreens: [] },
      ],
      totalCount: 20,
      pageNumber: 2,
      pageSize: 10,
      totalPages: 2,
      hasPrevious: true,
      hasNext: false,
      duplicateCount: 3,
    };

    vi.mocked(fetchLockUnlockPropertiesByExcelAction).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useLockUnlockExcel());

    const file = new File(["content"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    act(() => {
      result.current.setExcelFile(file);
      result.current.setExcelFileName("test.xlsx");
      result.current.handleScopeChange(SEARCH_CATEGORY.EXCEL);
    });

    await act(async () => {
      await result.current.handlePageChange(2);
    });

    expect(result.current.properties).toHaveLength(1);
    expect(mockToast.info).not.toHaveBeenCalled();
  });

  it("should handle scope change away from category 5 by resetting excel state", () => {
    const { result } = renderHook(() => useLockUnlockExcel());

    const file = new File(["dummy"], "test.xlsx");
    act(() => {
      result.current.setExcelFile(file);
      result.current.setExcelFileName("test.xlsx");
      result.current.handleScopeChange(SEARCH_CATEGORY.EXCEL);
    });

    act(() => {
      result.current.handleScopeChange(SEARCH_CATEGORY.ZONE);
    });

    expect(result.current.excelFile).toBeNull();
    expect(result.current.excelFileName).toBe("");
  });

  it("should handle clear all by resetting excel state", () => {
    const { result } = renderHook(() => useLockUnlockExcel());

    const file = new File(["dummy"], "test.xlsx");
    act(() => {
      result.current.setExcelFile(file);
      result.current.setExcelFileName("test.xlsx");
    });

    act(() => {
      result.current.handleClearAll();
    });

    expect(result.current.excelFile).toBeNull();
    expect(result.current.excelFileName).toBe("");
  });
});
