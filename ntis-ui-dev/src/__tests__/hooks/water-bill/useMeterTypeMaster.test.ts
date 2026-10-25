import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMeterTypeMaster } from "@/hooks/water-bill/meter-type-master/useMeterTypeMaster";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { deleteMeterTypeAction } from "@/app/[locale]/water-bill/metertypemaster/action";

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

vi.mock("@/app/[locale]/water-bill/metertypemaster/action", () => ({
  deleteMeterTypeAction: vi.fn(),
}));

describe("useMeterTypeMaster", () => {
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
    sortBy: "meterTypeCode",
    sortOrder: "asc",
  };

  it("should initialize master hook state", () => {
    const { result } = renderHook(() => useMeterTypeMaster(defaultProps));

    expect(result.current.searchTerm).toBe("");
    expect(result.current.columns.length).toBeGreaterThan(0);
  });

  it("should sanitize search input and push query", () => {
    const { result } = renderHook(() => useMeterTypeMaster(defaultProps));

    act(() => {
      result.current.handleSearchChange("AMR system<#>");
    });

    expect(result.current.searchTerm).toBe("AMR system");
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("q=AMR+system"));
  });

  it("should navigate to the add route", () => {
    const { result } = renderHook(() => useMeterTypeMaster(defaultProps));

    act(() => {
      result.current.handleOpenAdd();
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/en/water-bill/metertypemaster/add");
  });

  it("should navigate to the edit route with the record id", () => {
    const { result } = renderHook(() => useMeterTypeMaster(defaultProps));

    const item = { id: 2, meterTypeCode: "AMR", meterType: "AMR Meter", description: "Desc", isActive: true };
    act(() => {
      result.current.handleOpenEdit(item);
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/en/water-bill/metertypemaster/edit/2");
  });

  it("should open delete confirm modal", () => {
    const { result } = renderHook(() => useMeterTypeMaster(defaultProps));

    const item = { id: 3, meterTypeCode: "MECH", meterType: "Mechanical", description: "Desc", isActive: true };
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
    vi.mocked(deleteMeterTypeAction).mockResolvedValue({ success: true });
    mockConfirm.mockImplementation(({ onConfirm }: { onConfirm: () => Promise<void> }) => onConfirm());

    const { result } = renderHook(() => useMeterTypeMaster(defaultProps));

    const item = { id: 3, meterTypeCode: "MECH", meterType: "Mechanical", description: "Desc", isActive: true };
    await act(async () => {
      result.current.handleDelete(item);
    });

    expect(deleteMeterTypeAction).toHaveBeenCalledWith(3);
    expect(toast.success).toHaveBeenCalled();
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
});
