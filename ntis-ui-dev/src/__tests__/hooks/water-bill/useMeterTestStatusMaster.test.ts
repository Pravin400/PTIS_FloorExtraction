import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMeterTestStatusMaster } from "@/hooks/water-bill/meter-test-status-master/useMeterTestStatusMaster";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { deleteMeterTestStatusAction } from "@/app/[locale]/water-bill/meterteststatusmaster/action";

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

vi.mock("@/app/[locale]/water-bill/meterteststatusmaster/action", () => ({
  deleteMeterTestStatusAction: vi.fn(),
}));

describe("useMeterTestStatusMaster", () => {
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
    sortBy: "meterTestStatusCode",
    sortOrder: "asc",
  };

  it("should initialize master hook state", () => {
    const { result } = renderHook(() => useMeterTestStatusMaster(defaultProps));

    expect(result.current.searchTerm).toBe("");
    expect(result.current.columns.length).toBeGreaterThan(0);
  });

  it("should sanitize search term and push router query", () => {
    const { result } = renderHook(() => useMeterTestStatusMaster(defaultProps));

    act(() => {
      result.current.handleSearchChange("Pass<script>");
    });

    expect(result.current.searchTerm).toBe("Passscript");
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("q=Passscript"));
  });

  it("should navigate to the add route", () => {
    const { result } = renderHook(() => useMeterTestStatusMaster(defaultProps));

    act(() => {
      result.current.handleOpenAdd();
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/en/water-bill/meterteststatusmaster/add");
  });

  it("should navigate to the edit route with the record id", () => {
    const { result } = renderHook(() => useMeterTestStatusMaster(defaultProps));

    const editItem = { id: 1, meterTestStatusCode: "PASS", meterTestStatus: "Pass", isActive: true };
    act(() => {
      result.current.handleOpenEdit(editItem);
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/en/water-bill/meterteststatusmaster/edit/1");
  });

  it("should trigger confirm modal on delete", () => {
    const { result } = renderHook(() => useMeterTestStatusMaster(defaultProps));

    const item = { id: 5, meterTestStatusCode: "FAIL", meterTestStatus: "Fail", isActive: true };
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
    vi.mocked(deleteMeterTestStatusAction).mockResolvedValue({ success: true });
    mockConfirm.mockImplementation(({ onConfirm }: { onConfirm: () => Promise<void> }) => onConfirm());

    const { result } = renderHook(() => useMeterTestStatusMaster(defaultProps));

    const item = { id: 5, meterTestStatusCode: "FAIL", meterTestStatus: "Fail", isActive: true };
    await act(async () => {
      result.current.handleDelete(item);
    });

    expect(deleteMeterTestStatusAction).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalled();
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
});
