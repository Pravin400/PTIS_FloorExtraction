import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReadingSourceMaster } from "@/hooks/water-bill/reading-source-master/useReadingSourceMaster";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { deleteReadingSourceAction } from "@/app/[locale]/water-bill/readingsourcemaster/action";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(),
}));

vi.mock("@/app/[locale]/water-bill/readingsourcemaster/action", () => ({
  deleteReadingSourceAction: vi.fn(),
}));

describe("useReadingSourceMaster", () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as unknown as ReturnType<typeof useTranslations>);
    vi.mocked(useLocale).mockReturnValue("en");
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm } as unknown as ReturnType<typeof useConfirm>);
  });

  const defaultProps = {
    data: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    sortBy: "readingSourceCode",
    sortOrder: "asc",
  };

  it("should initialize master hook state", () => {
    const { result } = renderHook(() => useReadingSourceMaster(defaultProps));

    expect(result.current.searchTerm).toBe("");
    expect(result.current.columns.length).toBeGreaterThan(0);
  });

  it("should sanitize search input and push query", () => {
    const { result } = renderHook(() => useReadingSourceMaster(defaultProps));

    act(() => {
      result.current.handleSearchChange("Field <inspection>");
    });

    expect(result.current.searchTerm).toBe("Field inspection");
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("q=Field+inspection"));
  });

  it("should navigate to the add route", () => {
    const { result } = renderHook(() => useReadingSourceMaster(defaultProps));

    act(() => {
      result.current.handleOpenAdd();
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/en/water-bill/readingsourcemaster/add");
  });

  it("should navigate to the edit route with the record id", () => {
    const { result } = renderHook(() => useReadingSourceMaster(defaultProps));

    const item = { id: 4, readingSourceCode: "FIELD", readingSource: "Field Visit", isActive: true };
    act(() => {
      result.current.handleOpenEdit(item);
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/en/water-bill/readingsourcemaster/edit/4");
  });

  it("should open delete confirm modal", () => {
    const { result } = renderHook(() => useReadingSourceMaster(defaultProps));

    const item = { id: 5, readingSourceCode: "IMPORT", readingSource: "Import", isActive: true };
    act(() => {
      result.current.handleDelete(item);
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
      })
    );
  });

  it("should delete and refresh on confirmed delete", async () => {
    vi.mocked(deleteReadingSourceAction).mockResolvedValue({ success: true });
    mockConfirm.mockImplementation(({ onConfirm }: { onConfirm: () => Promise<void> }) => onConfirm());

    const { result } = renderHook(() => useReadingSourceMaster(defaultProps));

    const item = { id: 5, readingSourceCode: "IMPORT", readingSource: "Import", isActive: true };
    await act(async () => {
      result.current.handleDelete(item);
    });

    expect(deleteReadingSourceAction).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalled();
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
});
