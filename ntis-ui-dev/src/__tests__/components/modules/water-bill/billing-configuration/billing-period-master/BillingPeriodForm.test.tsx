import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BillingPeriodForm } from "@/components/modules/water-bill/billing-configuration/billing-period/BillingPeriodForm";
import type { DropdownOption } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, params?: { count?: number }) => {
    if (params?.count !== undefined) {
      return `${ns}.${key}_${params.count}`;
    }
    return `${ns}.${key}`;
  },
}));

describe("BillingPeriodForm - Component & Code Generation Tests", () => {
  const financialYearOptions: DropdownOption[] = [
    {
      value: "1",
      label: "2022",
      data: { year: 2022, startDate: "2022-04-01", endDate: "2023-03-31" },
    },
  ];

  const billingFrequencyOptions: DropdownOption[] = [
    {
      value: "10",
      label: "Quarterly",
      data: { billingFrequencyCode: "QUARTERLY", periodsPerYear: 4 },
    },
    {
      value: "20",
      label: "Monthly",
      data: { billingFrequencyCode: "MONTHLY", periodsPerYear: 12 },
    },
  ];

  it("does NOT show Due Date validation error when Financial Year is selected", () => {
    render(
      <BillingPeriodForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        financialYearOptions={financialYearOptions}
        billingFrequencyOptions={billingFrequencyOptions}
      />
    );

    // Initial state: no errors
    expect(screen.queryByText(/dueDateRequired/i)).not.toBeInTheDocument();

    // Select Financial Year 2022 by clicking custom combobox and option
    const fyCombobox = screen.getAllByRole("combobox")[0];
    fireEvent.click(fyCombobox);
    const option = screen.getByRole("option", { name: "2022" });
    fireEvent.click(option);

    // Verify Due Date validation error is NOT visible
    expect(screen.queryByText(/dueDateRequired/i)).not.toBeInTheDocument();
  });

  it("shows required field errors only when form is submitted", () => {
    const { container } = render(
      <BillingPeriodForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        financialYearOptions={financialYearOptions}
        billingFrequencyOptions={billingFrequencyOptions}
      />
    );

    // Submit form
    const form = container.querySelector("#billing-period-form")!;
    fireEvent.submit(form);

    // Now required errors should be visible
    expect(screen.getByText(/financialYearRequired/i)).toBeInTheDocument();
    expect(screen.getByText(/billingFrequencyRequired/i)).toBeInTheDocument();
  });

  it("generates billing period code with FinancialYear-BillingFrequencyCode+count format (e.g. 2022-QUARTERLY1)", () => {
    const handleSubmit = vi.fn();
    const { container } = render(
      <BillingPeriodForm
        open={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        financialYearOptions={financialYearOptions}
        billingFrequencyOptions={billingFrequencyOptions}
      />
    );

    // 1. Select Financial Year 2022
    const fyCombobox = screen.getAllByRole("combobox")[0];
    fireEvent.click(fyCombobox);
    fireEvent.click(screen.getByRole("option", { name: "2022" }));

    // 2. Select Billing Frequency Quarterly
    const bfCombobox = screen.getAllByRole("combobox")[1];
    fireEvent.click(bfCombobox);
    fireEvent.click(screen.getByRole("option", { name: "Quarterly" }));

    // Submit valid form
    const form = container.querySelector("#billing-period-form")!;
    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedPayload = handleSubmit.mock.calls[0][0];

    // Verify code is formatted as 2022-QUARTERLY1
    expect(submittedPayload.billingPeriodCode).toBe("2022-QUARTERLY1");
    expect(submittedPayload.sequenceNo).toBe(1);
  });
});
