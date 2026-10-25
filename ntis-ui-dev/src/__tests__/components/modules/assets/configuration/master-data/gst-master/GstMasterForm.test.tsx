import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GstMasterForm from "@/components/modules/assets/configuration/master-data/gst-master/GstMasterForm";
import { saveGstMaster } from "@/app/[locale]/assets/configuration/master-data/gst-master/action";
import { toast } from "sonner";
import type { GstMaster } from "@/types/asset-masters/gst-master.types";

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

// Mock next-intl
vi.mock("next-intl", () => {
  const t = (key: string) => `gstMaster.${key}`;
  t.rich = (key: string, values?: Record<string, unknown>) => {
    if (values && typeof values.b === "function") {
      (values.b as (chunks: string) => void)("bold text");
    }
    return `gstMaster.${key}`;
  };
  return {
    useTranslations: () => t,
    useLocale: () => "en",
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock action
vi.mock("@/app/[locale]/assets/configuration/master-data/gst-master/action", () => ({
  saveGstMaster: vi.fn(),
}));

describe("GstMasterForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInitialData: GstMaster = {
    id: 10,
    taxCode: "GST_12",
    taxName: "GST 12 Percent",
    taxPercentage: 12,
    isActive: true,
    effectiveFromDate: "2017-07-01",
    effectiveToDate: null,
  };

  test("renders in Create mode with empty fields", () => {
    render(<GstMasterForm initialData={null} />);

    expect(screen.getByText("gstMaster.form.addTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("gstMaster.form.fields.code.label *")).toHaveValue("");
    expect(screen.getByLabelText("gstMaster.form.fields.description.label *")).toHaveValue("");
    expect(screen.getByLabelText("gstMaster.form.fields.percent.label *")).toHaveValue(null);
  });

  test("renders in Edit mode with initial data prefilled", () => {
    render(<GstMasterForm initialData={mockInitialData} />);

    expect(screen.getByText("gstMaster.form.editTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("gstMaster.form.fields.code.label *")).toHaveValue("GST_12");
    expect(screen.getByLabelText("gstMaster.form.fields.description.label *")).toHaveValue("GST 12 Percent");
    expect(screen.getByLabelText("gstMaster.form.fields.percent.label *")).toHaveValue(12);
  });

  test("shows validation errors on empty submission", async () => {
    const { container } = render(<GstMasterForm initialData={null} />);

    // Clear pre-filled default dates to trigger required validations
    const fromInput = screen.getByLabelText("gstMaster.form.fields.effectiveFrom.label *");
    const toInput = screen.getByLabelText("gstMaster.form.fields.effectiveTo.label *");
    fireEvent.change(fromInput, { target: { value: "" } });
    fireEvent.change(toInput, { target: { value: "" } });

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("gstMaster.form.validation.codeRequired")).toBeInTheDocument();
      expect(screen.getByText("gstMaster.form.validation.descriptionRequired")).toBeInTheDocument();
      expect(screen.getByText("gstMaster.form.validation.percentRequired")).toBeInTheDocument();
      expect(screen.getByText("gstMaster.form.validation.effectiveFromRequired")).toBeInTheDocument();
      expect(screen.getByText("gstMaster.form.validation.effectiveToRequired")).toBeInTheDocument();
    });
  });

  test("successfully submits form and triggers saveGstMaster action", async () => {
    // Make sure mockup data has valid effectiveToDate since it's now required
    const mockDataWithToDate: GstMaster = {
      ...mockInitialData,
      effectiveToDate: "2027-12-31",
    };
    vi.mocked(saveGstMaster).mockResolvedValue({ ok: true, mode: "update" });

    const { container } = render(<GstMasterForm initialData={mockDataWithToDate} />);

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(saveGstMaster).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("gstMaster.form.messages.updateSuccess");
      expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/gst-master");
    });
  });

  test("triggers onToggle, onChange, and onBlur handlers in form inputs", async () => {
    const mockDataWithToDate: GstMaster = {
      ...mockInitialData,
      effectiveToDate: "2027-12-31",
    };
    const { container } = render(<GstMasterForm initialData={mockDataWithToDate} />);

    // Toggle active switch
    const toggleCard = screen.getByText("gstMaster.form.status.label");
    fireEvent.click(toggleCard);

    // Change input value
    const codeInput = screen.getByLabelText("gstMaster.form.fields.code.label *");
    fireEvent.change(codeInput, { target: { value: "GST_18" } });
    fireEvent.blur(codeInput);

    // Submit form
    vi.mocked(saveGstMaster).mockResolvedValue({ ok: true, mode: "update" });
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(saveGstMaster).toHaveBeenCalled();
    });
  });

  test("shows error toast on duplicate tax code submission", async () => {
    const mockDataWithToDate: GstMaster = {
      ...mockInitialData,
      effectiveToDate: "2027-12-31",
    };
    vi.mocked(saveGstMaster).mockResolvedValue({ ok: false, error: "duplicate" });

    const { container } = render(<GstMasterForm initialData={mockDataWithToDate} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("gstMaster.apiErrors.duplicateRecord");
    });
  });

  test("shows custom message error toast on unknown api failure", async () => {
    const mockDataWithToDate: GstMaster = {
      ...mockInitialData,
      effectiveToDate: "2027-12-31",
    };
    vi.mocked(saveGstMaster).mockResolvedValue({ ok: false, error: "unknown", message: "Network Timeout" });

    const { container } = render(<GstMasterForm initialData={mockDataWithToDate} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network Timeout");
    });
  });

  test("shows fallback message error toast on exception", async () => {
    const mockDataWithToDate: GstMaster = {
      ...mockInitialData,
      effectiveToDate: "2027-12-31",
    };
    vi.mocked(saveGstMaster).mockRejectedValue(new Error("Database offline"));

    const { container } = render(<GstMasterForm initialData={mockDataWithToDate} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Database offline");
    });
  });

  test("shows validation error when Effective To Date is earlier than Effective From Date", async () => {
    const { container } = render(<GstMasterForm initialData={mockInitialData} />);

    const fromInput = screen.getByLabelText("gstMaster.form.fields.effectiveFrom.label *");
    const toInput = screen.getByLabelText("gstMaster.form.fields.effectiveTo.label *");

    fireEvent.change(fromInput, { target: { value: "2026-07-02" } });
    fireEvent.change(toInput, { target: { value: "2026-07-01" } });
    fireEvent.blur(toInput);

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("gstMaster.form.validation.effectiveToInvalid")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("gstMaster.form.validation.fixErrors");
    });
  });
});
