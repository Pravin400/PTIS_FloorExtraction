import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TariffChargeDetails } from "@/components/modules/water-bill/tariff-workbench/charge-details/TariffChargeDetails";
import { TariffChargeDetailForm } from "@/components/modules/water-bill/tariff-workbench/charge-details/TariffChargeDetailForm";
import { getNextSequenceNoAction } from "@/app/[locale]/water-bill/tariff-workbench/charge-details/actions";
import type { TariffChargeData } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import type { TariffChargePagedResponse } from "@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service";

vi.mock("@/app/[locale]/water-bill/tariff-workbench/charge-details/actions", () => ({
  getNextSequenceNoAction: vi.fn(),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  toast: vi.fn(),
};
const mockConfirm = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

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
  const actual = await importOriginal<typeof import("@/components/common")>();
  return {
    ...actual,
    useToast: () => mockToast,
    useConfirm: () => ({ confirm: mockConfirm }),
  };
});

describe("TariffChargeDetails Component Tests", () => {
  const sampleRecords: TariffChargeData[] = [
    {
      id: 20,
      tariffId: 1,
      tariffName: "Residential Metered 2026-27",
      chargeHeadId: 5,
      chargeHeadName: "Meter Rent",
      geographyUnitId: 2,
      geographyUnitName: "Zone A",
      amount: 15,
      isDynamic: false,
      isMandatory: true,
      sequenceNo: 1,
      isActive: true,
    },
  ];

  const samplePagedData: TariffChargePagedResponse = {
    items: sampleRecords,
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render charge details table records correctly", () => {
    render(<TariffChargeDetails locale="en" pagedData={samplePagedData} />);

    expect(screen.getByText("Residential Metered 2026-27")).toBeInTheDocument();
    expect(screen.getByText("Meter Rent")).toBeInTheDocument();
    expect(screen.getByText("Zone A")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("should trigger confirmation dialog when delete button is clicked", () => {
    render(<TariffChargeDetails locale="en" pagedData={samplePagedData} deleteAction={vi.fn()} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        title: "tariffWorkbench.confirm.deleteChargeDetailTitle",
        description: "tariffWorkbench.confirm.deleteChargeDetailDescription",
        meta: { name: "Meter Rent", id: 20 },
      })
    );
  });

  it("should execute deleteAction and show success toast when confirmed", async () => {
    const mockDelete = vi.fn().mockResolvedValue({ success: true, message: "Charge detail deleted" });
    render(<TariffChargeDetails locale="en" pagedData={samplePagedData} deleteAction={mockDelete} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    const confirmCall = mockConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmCall.onConfirm();
    });

    expect(mockDelete).toHaveBeenCalledWith(20);
    expect(mockToast.success).toHaveBeenCalledWith("Charge detail deleted");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should show error toast if deleteAction fails", async () => {
    const mockDelete = vi.fn().mockResolvedValue({ success: false, message: "Delete failed" });
    render(<TariffChargeDetails locale="en" pagedData={samplePagedData} deleteAction={mockDelete} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    const confirmCall = mockConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmCall.onConfirm();
    });

    expect(mockDelete).toHaveBeenCalledWith(20);
    expect(mockToast.error).toHaveBeenCalledWith("Delete failed");
  });

  it("should show error toast if deleteAction is not provided", async () => {
    render(<TariffChargeDetails locale="en" pagedData={samplePagedData} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    const confirmCall = mockConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmCall.onConfirm();
    });

    expect(mockToast.error).toHaveBeenCalledWith("tariffWorkbench.errors.noDeleteAction");
  });

  it("should navigate to edit charge detail page when edit action is clicked", () => {
    render(<TariffChargeDetails locale="en" pagedData={samplePagedData} />);

    const editBtn = screen.getByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/charge-details/edit/20");
  });
});

describe("TariffChargeDetailForm Sequence Handling Tests", () => {
  const tariffOptions = [
    { value: "1", label: "Tariff 1" },
    { value: "2", label: "Tariff 2" },
  ];
  const chargeHeadOptions = [
    { value: "10", label: "Meter Rent" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("discards stale asynchronous sequence results when user changes tariff quickly", async () => {
    let resolveFirst: (val: number) => void = () => {};
    let resolveSecond: (val: number) => void = () => {};

    const firstPromise = new Promise<number>((res) => {
      resolveFirst = res;
    });
    const secondPromise = new Promise<number>((res) => {
      resolveSecond = res;
    });

    vi.mocked(getNextSequenceNoAction)
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

    const mockSubmit = vi.fn();

    const { container } = render(
      <TariffChargeDetailForm
        open={true}
        onClose={vi.fn()}
        onSubmit={mockSubmit}
        tariffOptions={tariffOptions}
        chargeHeadOptions={chargeHeadOptions}
      />
    );

    // Open tariff dropdown
    const tariffDropdownButton = screen.getByText("Select Tariff Name");
    fireEvent.click(tariffDropdownButton);

    // Select Tariff 1
    const option1 = screen.getByRole("option", { name: "Tariff 1" });
    fireEvent.click(option1);

    expect(getNextSequenceNoAction).toHaveBeenCalledWith(1);
    expect(screen.getByText("tariffWorkbench.messages.sequenceLoading")).toBeInTheDocument();

    // Select Tariff 2 before first resolves
    fireEvent.click(screen.getByText("Tariff 1"));
    const option2 = screen.getByRole("option", { name: "Tariff 2" });
    fireEvent.click(option2);

    expect(getNextSequenceNoAction).toHaveBeenCalledWith(2);

    // First promise finishes late with sequence 5
    await act(async () => {
      resolveFirst(5);
    });

    // Loading should still be true because second request is pending
    expect(screen.getByText("tariffWorkbench.messages.sequenceLoading")).toBeInTheDocument();

    // Second promise finishes with sequence 12
    await act(async () => {
      resolveSecond(12);
    });

    // Loading indicator disappears
    expect(screen.queryByText("tariffWorkbench.messages.sequenceLoading")).not.toBeInTheDocument();

    // Fill other required fields
    fireEvent.click(screen.getByText("Select Charge Head"));
    fireEvent.click(screen.getByRole("option", { name: "Meter Rent" }));

    // isDynamic -> false
    fireEvent.click(screen.getByText("Select Dynamic"));
    fireEvent.click(screen.getAllByRole("option", { name: "tariffWorkbench.table.no" })[0]);

    // isMandatory -> true
    fireEvent.click(screen.getByText("Select Mandatory"));
    fireEvent.click(screen.getAllByRole("option", { name: "tariffWorkbench.table.yes" })[0]);

    // amount
    const amountInput = screen.getByPlaceholderText("e.g: 0");
    fireEvent.change(amountInput, { target: { value: "100" } });

    const form = container.querySelector("#tariff-charge-detail-form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        tariffId: 2,
        sequenceNo: 12,
      })
    );
  });

  it("prevents submission while sequence number is actively loading", async () => {
    let resolveSequence: (val: number) => void = () => {};
    const sequencePromise = new Promise<number>((res) => {
      resolveSequence = res;
    });

    vi.mocked(getNextSequenceNoAction).mockImplementationOnce(() => sequencePromise);

    const mockSubmit = vi.fn();

    const { container } = render(
      <TariffChargeDetailForm
        open={true}
        onClose={vi.fn()}
        onSubmit={mockSubmit}
        tariffOptions={tariffOptions}
        chargeHeadOptions={chargeHeadOptions}
      />
    );

    // Select Tariff 1
    fireEvent.click(screen.getByText("Select Tariff Name"));
    fireEvent.click(screen.getByRole("option", { name: "Tariff 1" }));

    // Sequence is loading
    expect(screen.getByText("tariffWorkbench.messages.sequenceLoading")).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: "common.buttons.save" });
    expect(saveButton).toBeDisabled();

    // Attempt form submit while loading
    const form = container.querySelector("#tariff-charge-detail-form");
    fireEvent.submit(form!);

    expect(mockSubmit).not.toHaveBeenCalled();

    // Resolve sequence
    await act(async () => {
      resolveSequence(3);
    });

    expect(screen.queryByText("tariffWorkbench.messages.sequenceLoading")).not.toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });

  it("rejects form submission if isDynamic or isMandatory or amount is omitted", () => {
    const mockSubmit = vi.fn();

    const { container } = render(
      <TariffChargeDetailForm
        open={true}
        onClose={vi.fn()}
        onSubmit={mockSubmit}
        tariffOptions={tariffOptions}
        chargeHeadOptions={chargeHeadOptions}
      />
    );

    // Submit form without selecting required fields
    const form = container.querySelector("#tariff-charge-detail-form");
    fireEvent.submit(form!);

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalled();
  });

  it("sets amount to 0 and disables amount input when isDynamic is selected as Yes", async () => {
    const mockSubmit = vi.fn();

    render(
      <TariffChargeDetailForm
        open={true}
        onClose={vi.fn()}
        onSubmit={mockSubmit}
        tariffOptions={tariffOptions}
        chargeHeadOptions={chargeHeadOptions}
      />
    );

    const amountInput = screen.getByPlaceholderText("e.g: 0") as HTMLInputElement;
    expect(amountInput.disabled).toBe(false);

    // Select Dynamic -> Yes
    fireEvent.click(screen.getByText("Select Dynamic"));
    fireEvent.click(screen.getAllByRole("option", { name: "tariffWorkbench.table.yes" })[0]);

    // Amount input is now disabled with value 0
    expect(amountInput.disabled).toBe(true);
    expect(amountInput.value).toBe("0");
  });
});
