import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TariffForm } from "@/components/modules/water-bill/tariff-workbench/TariffForm";
import type { TariffWorkbench as TariffWorkbenchType } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, params?: Record<string, unknown>) => {
    if (params?.count !== undefined) {
      return `${ns}.${key}_${params.count}`;
    }
    return `${ns}.${key}`;
  },
  useLocale: () => "en",
}));

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useToast: () => ({
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

describe("TariffForm Component Tests", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const sampleEditingData: TariffWorkbenchType = {
    id: 1,
    tariffCode: "RES-MTR-2026",
    tariffName: "Residential Metered Tariff 2026-27",
    financialYearId: 1,
    connectionTypeId: 1,
    connectionCategoryId: 1,
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    effectiveTo: "2027-03-31T00:00:00.000Z",
    versionNo: 1,
    status: "Published",
    description: "Existing Description",
    isActive: true,
    financialYearCode: "2026-27",
    connectionTypeName: "Residential",
    connectionCategoryName: "Regular",
    slabsCount: 2,
  };

  const mockFinancialYearOptions = [
    { value: "1", label: "2026-27" },
    { value: "2", label: "2025-26" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Add mode title when open and initialData is null", async () => {
    render(
      <TariffForm
        open={true}
        financialYearOptions={mockFinancialYearOptions}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText("tariffWorkbench.addTitle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "common.buttons.cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "common.buttons.save" })).toBeInTheDocument();
  });

  it("should render Edit mode title and prefill values when initialData is provided", async () => {
    render(
      <TariffForm
        open={true}
        initialData={sampleEditingData}
        financialYearOptions={mockFinancialYearOptions}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText("tariffWorkbench.editTitle")).toBeInTheDocument();
    expect(screen.getByDisplayValue("RES-MTR-2026")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("should render financial year dropdown options from props", async () => {
    render(
      <TariffForm
        open={true}
        financialYearOptions={mockFinancialYearOptions}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const select = screen.getByRole("combobox", { name: /financialYear/i });
    expect(select).toBeInTheDocument();
  });

  it("should display validation errors when submitting empty required fields", async () => {
    render(
      <TariffForm
        open={true}
        financialYearOptions={mockFinancialYearOptions}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const form = document.querySelector("#tariff-workbench-form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getAllByText("tariffWorkbench.validation.tariffCodeRequired").length).toBeGreaterThan(0);
      expect(screen.getAllByText("tariffWorkbench.validation.tariffNameRequired").length).toBeGreaterThan(0);
      expect(screen.getAllByText("tariffWorkbench.validation.effectiveFromRequired").length).toBeGreaterThan(0);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should validate effectiveTo date is after effectiveFrom date", async () => {
    render(
      <TariffForm
        open={true}
        financialYearOptions={mockFinancialYearOptions}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const form = document.querySelector("#tariff-workbench-form")!;
    fireEvent.change(screen.getByLabelText(/tariffCode/i), { target: { value: "RES-01" } });
    fireEvent.change(screen.getByLabelText(/tariffName/i), { target: { value: "Residential Tariff" } });

    fireEvent.change(screen.getByLabelText(/effectiveFrom/i), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText(/effectiveTo/i), { target: { value: "2026-04-01" } });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getAllByText("tariffWorkbench.validation.effectiveToAfterFrom").length).toBeGreaterThan(0);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it("should load Connection Type and Category dropdown options correctly", async () => {
    render(
      <TariffForm
        open={true}
        financialYearOptions={mockFinancialYearOptions}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it("should submit valid form data correctly", async () => {
    render(
      <TariffForm
        open={true}
        financialYearOptions={mockFinancialYearOptions}
        connectionTypeOptions={[{ value: "1", label: "Residential" }]}
        connectionCategoryOptions={[{ value: "2", label: "Regular" }]}
        tapSizeOptions={[{ value: "3", label: "1/2 inch" }]}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/tariffCode/i), { target: { value: "RES-MTR-2026" } });
    fireEvent.change(screen.getByLabelText(/tariffName/i), { target: { value: "Residential Metered Tariff" } });

    fireEvent.change(screen.getByLabelText(/effectiveFrom/i), { target: { value: "2026-04-01" } });

    const fyCombobox = screen.getByRole("combobox", { name: /financialYear/i });
    fireEvent.click(fyCombobox);
    fireEvent.click(screen.getByText("2026-27"));

    const typeCombobox = screen.getByRole("combobox", { name: /connectionType/i });
    fireEvent.click(typeCombobox);
    fireEvent.click(screen.getByText("Residential"));

    const catCombobox = screen.getByRole("combobox", { name: /connectionCategory/i });
    fireEvent.click(catCombobox);
    fireEvent.click(screen.getByText("Regular"));

    const tapCombobox = screen.getByRole("combobox", { name: /tapSize/i });
    fireEvent.click(tapCombobox);
    fireEvent.click(screen.getByText("1/2 inch"));

    const form = document.querySelector("#tariff-workbench-form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tariffCode: "RES-MTR-2026",
          tariffName: "Residential Metered Tariff",
          financialYearId: 1,
          connectionTypeId: 1,
          connectionCategoryId: 2,
          tapSizeId: 3,
          effectiveFrom: "2026-04-01",
        })
      );
    });
  });

  it("should trigger onClose when Cancel button is clicked", () => {
    render(
      <TariffForm
        open={true}
        financialYearOptions={mockFinancialYearOptions}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "common.buttons.cancel" });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

});
