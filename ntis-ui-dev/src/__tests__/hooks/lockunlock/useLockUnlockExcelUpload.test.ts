import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as XLSX from "xlsx";
import { useLockUnlockExcelUpload } from "@/hooks/lockunlock/useLockUnlockExcelUpload";
import { ChangeEvent } from "react";

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
}));

// Mock next-intl
const mockT = vi.fn((key: string, values?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    "selectPropertyCard.invalidFile": "Invalid file. Please upload an .xlsx or .xls file.",
    "selectPropertyCard.fileSelected": values?.name ? `${values.name} selected` : "File selected",
    "selectPropertyCard.noDataInFile": "No data rows found in the uploaded file.",
    "selectPropertyCard.tooManyRows": `Excel has too many rows. Maximum allowed is ${values?.max}.`,
    "messages.unexpectedError": "An unexpected error occurred",
  };
  return translations[key] || key;
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

// Mock XLSX
vi.mock("xlsx", async () => {
  const actual = await vi.importActual<typeof import("xlsx")>("xlsx");
  return {
    ...actual,
    utils: {
      ...actual.utils,
      aoa_to_sheet: vi.fn(actual.utils.aoa_to_sheet),
      book_new: vi.fn(actual.utils.book_new),
      book_append_sheet: vi.fn(actual.utils.book_append_sheet),
    },
    writeFile: vi.fn(),
  };
});

describe("useLockUnlockExcelUpload", () => {
  const setExcelFile = vi.fn();
  const setExcelFileName = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.fileInputRef.current).toBeNull();
    expect(typeof result.current.handleDownloadTemplate).toBe("function");
    expect(typeof result.current.handleFileUpload).toBe("function");
    expect(typeof result.current.handleRemoveFile).toBe("function");
  });

  it("should handle valid .xlsx file upload successfully", () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    const file = new File(["dummy content"], "test_properties.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const event = {
      target: {
        files: [file],
        value: "C:\\fakepath\\test_properties.xlsx",
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(event);
    });

    expect(setExcelFile).toHaveBeenCalledWith(file);
    expect(setExcelFileName).toHaveBeenCalledWith("test_properties.xlsx");
    expect(mockToast.success).toHaveBeenCalledWith("test_properties.xlsx selected");
  });

  it("should handle valid .xls file upload successfully", () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    const file = new File(["dummy content"], "old_properties.xls", {
      type: "application/vnd.ms-excel",
    });

    const event = {
      target: {
        files: [file],
        value: "C:\\fakepath\\old_properties.xls",
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(event);
    });

    expect(setExcelFile).toHaveBeenCalledWith(file);
    expect(setExcelFileName).toHaveBeenCalledWith("old_properties.xls");
    expect(mockToast.success).toHaveBeenCalledWith("old_properties.xls selected");
  });

  it("should reject invalid file format and show error toast", () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    const file = new File(["dummy content"], "document.pdf", {
      type: "application/pdf",
    });

    const event = {
      target: {
        files: [file],
        value: "C:\\fakepath\\document.pdf",
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(event);
    });

    expect(setExcelFile).not.toHaveBeenCalled();
    expect(setExcelFileName).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith("Invalid file. Please upload an .xlsx or .xls file.");
  });

  it("should do nothing if no file is selected", () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    const event = {
      target: {
        files: [],
        value: "",
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(event);
    });

    expect(setExcelFile).not.toHaveBeenCalled();
    expect(setExcelFileName).not.toHaveBeenCalled();
  });

  it("should handle remove file properly", () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    act(() => {
      result.current.handleRemoveFile();
    });

    expect(setExcelFile).toHaveBeenCalledWith(null);
    expect(setExcelFileName).toHaveBeenCalledWith("");
  });

  it("should generate and download template Excel file using XLSX.writeFile with only headers", () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    act(() => {
      result.current.handleDownloadTemplate();
    });

    // Check XLSX was called with headers only
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ["ZoneNo", "WardNo", "PropertyNo", "PartitionNo"],
    ]);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      "LockUnlock_Template.xlsx"
    );
  });

  it("should show error toast if uploaded file has no data rows", async () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    const file = new File(["dummy content"], "empty.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    // Mock arrayBuffer
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    // Mock sheet_to_json to return only headers or empty array
    vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce([
      ["ZoneNo", "WardNo", "PropertyNo", "PartitionNo"],
    ]);

    const event = {
      target: {
        files: [file],
        value: "C:\\fakepath\\empty.xlsx",
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    expect(setExcelFile).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith("No data rows found in the uploaded file.");
  });

  it("should show error toast if uploaded file exceeds MAX_EXCEL_ROWS", async () => {
    const { result } = renderHook(() =>
      useLockUnlockExcelUpload({ setExcelFile, setExcelFileName })
    );

    const file = new File(["dummy content"], "huge.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    // 100_001 data rows + 1 header row = 100_002
    const fakeRows = new Array(100_002).fill(["1", "2", "3", ""]);
    fakeRows[0] = ["ZoneNo", "WardNo", "PropertyNo", "PartitionNo"];
    vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce(fakeRows);

    const event = {
      target: {
        files: [file],
        value: "C:\\fakepath\\huge.xlsx",
      },
    } as unknown as ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    expect(setExcelFile).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith("Excel has too many rows. Maximum allowed is 1,00,000.");
  });
});
