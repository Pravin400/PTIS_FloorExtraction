import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PenaltyRuleMasterForm from "@/components/modules/assets/configuration/master-data/penalty-rule-master/PenaltyRuleMasterForm";
import { savePenaltyRule } from "@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action";
import { toast } from "sonner";
import type { PenaltyRule } from "@/types/asset-masters/penalty-rule-master.types";

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

// Mock next-intl
vi.mock("next-intl", () => {
  const t = (key: string) => `penaltyRuleMaster.${key}`;
  t.rich = (key: string, values?: Record<string, unknown>) => {
    if (values && typeof values.b === "function") {
      (values.b as (chunks: string) => void)("bold text");
    }
    return `penaltyRuleMaster.${key}`;
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
vi.mock("@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action", () => ({
  savePenaltyRule: vi.fn(),
}));

describe("PenaltyRuleMasterForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInitialData: PenaltyRule = {
    id: 10,
    penaltyCode: "LATE_RENT",
    penaltyName: "Late Rent Flat Fee",
    calculationType: "FlatAmount",
    penaltyValue: 100,
    gracePeriodDays: 5,
    isActive: true,
  };

  test("renders in Create mode with empty fields", () => {
    render(<PenaltyRuleMasterForm initialData={null} />);

    expect(screen.getByText("penaltyRuleMaster.form.addTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.code.label *")).toHaveValue("");
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.description.label *")).toHaveValue("");
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.value.label *")).toHaveValue(null);
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.gracePeriod.label *")).toHaveValue(null);
  });

  test("renders in Edit mode with initial data prefilled", () => {
    render(<PenaltyRuleMasterForm initialData={mockInitialData} />);

    expect(screen.getByText("penaltyRuleMaster.form.editTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.code.label *")).toHaveValue("LATE_RENT");
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.description.label *")).toHaveValue("Late Rent Flat Fee");
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.value.label *")).toHaveValue(100);
    expect(screen.getByLabelText("penaltyRuleMaster.form.fields.gracePeriod.label *")).toHaveValue(5);
  });

  test("shows validation errors on empty submission", async () => {
    const { container } = render(<PenaltyRuleMasterForm initialData={null} />);

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("penaltyRuleMaster.form.validation.codeRequired")).toBeInTheDocument();
      expect(screen.getByText("penaltyRuleMaster.form.validation.nameRequired")).toBeInTheDocument();
      expect(screen.getByText("penaltyRuleMaster.form.validation.calculationTypeRequired")).toBeInTheDocument();
      expect(screen.getByText("penaltyRuleMaster.form.validation.valueRequired")).toBeInTheDocument();
      expect(screen.getByText("penaltyRuleMaster.form.validation.gracePeriodRequired")).toBeInTheDocument();
    });
  });

  test("successfully submits form and triggers savePenaltyRule action", async () => {
    vi.mocked(savePenaltyRule).mockResolvedValue({ ok: true, mode: "update" });

    const { container } = render(<PenaltyRuleMasterForm initialData={mockInitialData} />);

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(savePenaltyRule).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("penaltyRuleMaster.form.messages.updateSuccess");
      expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/penalty-rule-master");
    });
  });

  test("triggers onToggle, onChange, and onBlur handlers in form inputs", async () => {
    const { container } = render(<PenaltyRuleMasterForm initialData={mockInitialData} />);

    // Toggle active switch
    const toggleSwitch = screen.getByRole("switch");
    fireEvent.click(toggleSwitch);

    // Change input value
    const codeInput = screen.getByLabelText("penaltyRuleMaster.form.fields.code.label *");
    fireEvent.change(codeInput, { target: { value: "LATE_RENT_NEW" } });
    fireEvent.blur(codeInput);

    // Submit form
    vi.mocked(savePenaltyRule).mockResolvedValue({ ok: true, mode: "update" });
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(savePenaltyRule).toHaveBeenCalled();
    });
  });

  test("shows error toast on duplicate penalty rule code submission", async () => {
    vi.mocked(savePenaltyRule).mockResolvedValue({ ok: false, error: "duplicate" });

    const { container } = render(<PenaltyRuleMasterForm initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("penaltyRuleMaster.apiErrors.duplicateRecord");
    });
  });

  test("shows custom message error toast on unknown api failure", async () => {
    vi.mocked(savePenaltyRule).mockResolvedValue({ ok: false, error: "unknown", message: "Network Timeout" });

    const { container } = render(<PenaltyRuleMasterForm initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network Timeout");
    });
  });

  test("shows fallback message error toast on exception", async () => {
    vi.mocked(savePenaltyRule).mockRejectedValue(new Error("Database offline"));

    const { container } = render(<PenaltyRuleMasterForm initialData={mockInitialData} />);
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Database offline");
    });
  });
});
