import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { TapSizeForm } from "@/components/modules/water-bill/tap-size-master/TapSizeForm";
import { toast } from "sonner";
import {
  createTapSizeAction,
  updateTapSizeAction,
} from "@/app/[locale]/water-bill/tap-size-master/actions";
import { mockMessages } from "./mockMessages";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/en/water-bill/tap-size-master",
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return {
    ...actual,
    useLocale: () => "en",
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/tap-size-master/actions", () => ({
  createTapSizeAction: vi.fn(),
  updateTapSizeAction: vi.fn(),
  getTapSizePagedAction: vi.fn().mockResolvedValue({ items: [] }),
}));

const mockCreateAction = vi.mocked(createTapSizeAction);
const mockUpdateAction = vi.mocked(updateTapSizeAction);

describe("TapSizeForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add Tap Size drawer when id is null", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TapSizeForm id={null} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Add Tap Size")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., TAP01")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., 1/2 Inch or 15 mm")).toBeInTheDocument();
  });

  it("shows validation error messages when submitting empty form", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TapSizeForm id={null} />
      </NextIntlClientProvider>
    );

    const submitBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Tap Size Code is required")).toBeInTheDocument();
      expect(screen.getByText("Tap Size is required")).toBeInTheDocument();
      // sizeUnit defaults to "Inch", so it's not empty
    });
  });

  it("auto-populates nominalSizeValue when tapSize is typed", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TapSizeForm id={null} />
      </NextIntlClientProvider>
    );

    const sizeInput = screen.getByPlaceholderText("e.g., 1/2 Inch or 15 mm");
    fireEvent.change(sizeInput, { target: { value: "3/4" } });

    const nominalInput = screen.getByPlaceholderText("e.g., 0.5 or 15") as HTMLInputElement;
    expect(nominalInput.value).toBe("0.75");
  });

  it("creates a tap size and redirects on valid submit", async () => {
    mockCreateAction.mockResolvedValueOnce({
      success: true,
      data: { id: 1, tapSizeCode: "TAP01", tapSize: "1/2 Inch", isActive: true },
    });

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TapSizeForm id={null} />
      </NextIntlClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText("e.g., TAP01"), { target: { value: "TAP01" } });
    fireEvent.change(screen.getByPlaceholderText("e.g., 1/2 Inch or 15 mm"), { target: { value: "1/2 Inch" } });

    const submitBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          tapSizeCode: "TAP01",
          tapSize: "1/2",
          nominalSizeValue: "0.5",
          sizeUnit: "Inch",
          isActive: true,
        })
      );
      expect(toast.success).toHaveBeenCalledWith("Tap Size created successfully");
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master");
    });
  });

  it("renders Edit Tap Size drawer and updates record on submit", async () => {
    mockUpdateAction.mockResolvedValueOnce({
      success: true,
      data: { id: 1, tapSizeCode: "TAP01", tapSize: "1 Inch", isActive: true },
    });

    const initialData = {
      id: 1,
      tapSizeCode: "TAP01",
      tapSize: "1 Inch",
      nominalSizeValue: 1,
      sizeUnit: "Inch",
      isActive: true,
      createdBy: 1,
      updatedBy: 1,
    };

    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TapSizeForm id={1} initialData={initialData} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Edit Tap Size")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TAP01")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Update" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalledWith(1, expect.objectContaining({ tapSizeCode: "TAP01" }));
      expect(toast.success).toHaveBeenCalledWith("Tap Size updated successfully");
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/tap-size-master");
    });
  });
});
