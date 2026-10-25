import { renderHook, act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAliasMasterList } from "@/hooks/configuration-settings/alias-master/useAliasMasterList";
import { toggleAliasMasterStatusAction } from "@/app/[locale]/configuration-settings/alias-master/action";
import { toast } from "sonner";
import type { AliasMaster, AliasMasterProps } from "@/types/alias-master.types";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/configuration-settings/alias-master/action", () => ({
  toggleAliasMasterStatusAction: vi.fn(),
}));

const baseProps: AliasMasterProps = {
  data: [],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 25,
  totalPages: 3,
  counts: { totalCount: 25, activeCount: 20, inactiveCount: 5 },
};

const row: AliasMaster = {
  id: 47,
  aliasKey: "ALS-000047",
  keyName: "Ward_No",
  labelName: "Ward No",
  englishName: "Sector",
  regionalName: "सेक्टर",
  hindiName: "सेक्टर",
  isActive: true,
};

describe("useAliasMasterList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("q");
  });

  it("builds 6 columns", () => {
    const { result } = renderHook(() => useAliasMasterList(baseProps));
    expect(result.current.columns).toHaveLength(6);
  });

  it("computes the showing start/end range", () => {
    const { result } = renderHook(() => useAliasMasterList({ ...baseProps, pageNumber: 2, pageSize: 10, totalCount: 25 }));
    expect(result.current.start).toBe(11);
    expect(result.current.end).toBe(20);
  });

  it("returns 0/0 range when there are no records", () => {
    const { result } = renderHook(() => useAliasMasterList({ ...baseProps, totalCount: 0 }));
    expect(result.current.start).toBe(0);
    expect(result.current.end).toBe(0);
  });

  it("navigates to page 1 with the new sortBy/asc order when a column is sorted for the first time", () => {
    const { result } = renderHook(() => useAliasMasterList(baseProps));
    const keyNameCol = result.current.columns.find((c) => c.key === "keyName")!;

    render(<div>{keyNameCol.label}</div>);
    fireEvent.click(screen.getByRole("button", { name: /common\.table\.sort\.by aliasMaster\.keyName/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("sortBy=keyName"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("sortOrder=asc"));
  });

  it("toggles sortOrder to desc when the currently-sorted column is clicked again", () => {
    const { result } = renderHook(() => useAliasMasterList({ ...baseProps, sortBy: "keyName", sortOrder: "asc" }));
    const keyNameCol = result.current.columns.find((c) => c.key === "keyName")!;

    render(<div>{keyNameCol.label}</div>);
    fireEvent.click(screen.getByRole("button", { name: /common\.table\.sort\.verb aliasMaster\.keyName/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("sortOrder=desc"));
  });

  it("navigates with the new page number when changePage is called", () => {
    const { result } = renderHook(() => useAliasMasterList(baseProps));

    act(() => {
      result.current.changePage(2);
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });

  it("navigates with the new page size when changePageSize is called", () => {
    const { result } = renderHook(() => useAliasMasterList(baseProps));

    act(() => {
      result.current.changePageSize(20);
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageSize=20"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
  });

  describe("handleToggleStatus (via the rendered status column)", () => {
    it("toggles to inactive, shows a success toast, and refreshes on success", async () => {
      vi.mocked(toggleAliasMasterStatusAction).mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAliasMasterList(baseProps));
      const statusCol = result.current.columns.find((c) => c.key === "isActive")!;

      render(<div>{statusCol.render!(true, row, 0)}</div>);
      fireEvent.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toggleAliasMasterStatusAction).toHaveBeenCalledWith(47, false);
        expect(toast.success).toHaveBeenCalledWith("aliasMaster.form.messages.deactivateSuccess");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("toggles to active and shows the activate success message", async () => {
      vi.mocked(toggleAliasMasterStatusAction).mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAliasMasterList(baseProps));
      const statusCol = result.current.columns.find((c) => c.key === "isActive")!;
      const inactiveRow = { ...row, isActive: false };

      render(<div>{statusCol.render!(false, inactiveRow, 0)}</div>);
      fireEvent.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toggleAliasMasterStatusAction).toHaveBeenCalledWith(47, true);
        expect(toast.success).toHaveBeenCalledWith("aliasMaster.form.messages.activateSuccess");
      });
    });

    it("shows an error toast and does not refresh when the action fails", async () => {
      vi.mocked(toggleAliasMasterStatusAction).mockResolvedValue({ success: false, message: "Boom" });
      const { result } = renderHook(() => useAliasMasterList(baseProps));
      const statusCol = result.current.columns.find((c) => c.key === "isActive")!;

      render(<div>{statusCol.render!(true, row, 0)}</div>);
      fireEvent.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toggleAliasMasterStatusAction).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Boom");
        expect(mockRefresh).not.toHaveBeenCalled();
      });
    });

    it("falls back to a generic error message when the action fails without one", async () => {
      vi.mocked(toggleAliasMasterStatusAction).mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAliasMasterList(baseProps));
      const statusCol = result.current.columns.find((c) => c.key === "isActive")!;

      render(<div>{statusCol.render!(true, row, 0)}</div>);
      fireEvent.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("common.errors.updateError");
      });
    });
  });
});
