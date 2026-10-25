import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTapSizeForm } from "@/hooks/water-bill/tap-size-master/useTapSizeForm";
import * as actions from "@/app/[locale]/water-bill/tap-size-master/actions";
import { toast } from "sonner";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/en/water-bill/tap-size-master",
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/tap-size-master/actions", () => ({
  createTapSizeAction: vi.fn(),
  updateTapSizeAction: vi.fn(),
  getTapSizePagedAction: vi.fn(),
}));

describe("useTapSizeForm Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes create form with default values", () => {
    const { result } = renderHook(() => useTapSizeForm(null));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData).toEqual({
      tapSizeCode: "",
      tapSize: "",
      nominalSizeValue: "",
      sizeUnit: "Inch",
      isActive: true,
    });
  });

  it("initializes edit form with formatted initial values, stripping non-digits from tapSize", () => {
    const initialData = {
      id: 1,
      tapSizeCode: "TAP01",
      tapSize: "3/4 Inch",
      nominalSizeValue: 0.75,
      sizeUnit: "Inch",
      isActive: true,
    };
    const { result } = renderHook(() => useTapSizeForm(1, initialData));

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.tapSizeCode).toBe("TAP01");
    // " Inch" is stripped out by initialTapSize sanitization
    expect(result.current.formData.tapSize).toBe("3/4");
    expect(result.current.formData.nominalSizeValue).toBe("0.75");
    expect(result.current.formData.sizeUnit).toBe("Inch");
  });

  it("validates required fields when values are empty", () => {
    const { result } = renderHook(() => useTapSizeForm(null));

    act(() => {
      // Clear sizeUnit to test its required validation
      result.current.handleChange("sizeUnit", "");
    });

    // nominalSizeValue is disabled and auto-calculated, so it's not checked here
    expect(result.current.errors.tapSizeCode).toBeDefined();
    expect(result.current.errors.tapSize).toBeDefined();
    expect(result.current.errors.sizeUnit).toBeDefined();
  });

  it("auto-populates nominalSizeValue when tapSize is entered", () => {
    const { result } = renderHook(() => useTapSizeForm(null));

    act(() => {
      result.current.handleChange("tapSize", "1/2");
    });

    expect(result.current.formData.tapSize).toBe("1/2");
    expect(result.current.formData.nominalSizeValue).toBe("0.5");
  });

  it("always overwrites nominalSizeValue on subsequent tapSize changes because it is read-only", () => {
    const { result } = renderHook(() => useTapSizeForm(null));

    act(() => {
      result.current.handleChange("tapSize", "3/4");
    });
    expect(result.current.formData.nominalSizeValue).toBe("0.75");

    act(() => {
      result.current.handleChange("tapSize", "1");
    });
    // nominalSizeValue should become 1
    expect(result.current.formData.nominalSizeValue).toBe("1");
  });

  it("submits create form and redirects on success", async () => {
    vi.mocked(actions.getTapSizePagedAction).mockResolvedValueOnce({
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    });
    vi.mocked(actions.createTapSizeAction).mockResolvedValueOnce({
      success: true,
      data: { id: 10, tapSizeCode: "TAP10", tapSize: "1", isActive: true },
    });

    const { result } = renderHook(() => useTapSizeForm(null));

    act(() => {
      result.current.handleChange("tapSizeCode", "TAP10");
      result.current.handleChange("tapSize", "1");
      result.current.handleChange("sizeUnit", "Inch");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(actions.createTapSizeAction).toHaveBeenCalledWith(
      expect.objectContaining({
        tapSizeCode: "TAP10",
        tapSize: "1",
        nominalSizeValue: "1", // auto-populated
        sizeUnit: "Inch",
        isActive: true,
      })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master");
  });

  it("submits update form and redirects on success", async () => {
    vi.mocked(actions.getTapSizePagedAction).mockResolvedValueOnce({
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    });
    vi.mocked(actions.updateTapSizeAction).mockResolvedValueOnce({
      success: true,
      data: { id: 5, tapSizeCode: "TAP05", tapSize: "2", isActive: true },
    });

    const { result } = renderHook(() =>
      useTapSizeForm(5, {
        id: 5,
        tapSizeCode: "TAP05",
        tapSize: "2 Inch",
        nominalSizeValue: 2,
        sizeUnit: "Inch",
        isActive: true,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(actions.updateTapSizeAction).toHaveBeenCalledWith(5, expect.objectContaining({ tapSizeCode: "TAP05", tapSize: "2" }));
    expect(toast.success).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master");
  });

  it("prevents submission if tap size code is duplicated", async () => {
    vi.mocked(actions.getTapSizePagedAction).mockResolvedValueOnce({
      items: [{ id: 99, tapSizeCode: "TAP10", tapSize: "2", isActive: true, nominalSizeValue: 2, sizeUnit: "Inch" }],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });

    const { result } = renderHook(() => useTapSizeForm(null));

    act(() => {
      result.current.handleChange("tapSizeCode", "TAP10");
      result.current.handleChange("tapSize", "1");
      result.current.handleChange("sizeUnit", "Inch");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(actions.createTapSizeAction).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("messages.duplicateCodeError"));
  });

  it("prevents submission if tap size name is duplicated", async () => {
    vi.mocked(actions.getTapSizePagedAction).mockResolvedValueOnce({
      items: [{ id: 99, tapSizeCode: "TAP99", tapSize: "1", isActive: true, nominalSizeValue: 1, sizeUnit: "Inch" }],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });

    const { result } = renderHook(() => useTapSizeForm(null));

    act(() => {
      result.current.handleChange("tapSizeCode", "TAP10");
      result.current.handleChange("tapSize", "1");
      result.current.handleChange("sizeUnit", "Inch");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(actions.createTapSizeAction).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("messages.duplicateNameError"));
  });
});
