import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TariffSlabs } from "@/components/modules/water-bill/tariff-workbench/slabs/TariffSlabs";
import { TariffSlabForm } from "@/components/modules/water-bill/tariff-workbench/slabs/TariffSlabForm";
import type { TariffSlabData } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import type { TariffSlabPagedResponse } from "@/lib/api/water-bill/tariff-workbench/tariffSlabDetail.service";

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

describe("TariffSlabs Component Tests", () => {
  const sampleRecords: TariffSlabData[] = [
    {
      id: 10,
      tariffId: 1,
      tariffName: "Residential Metered 2026-27",
      geographyUnitId: 2,
      geographyUnitName: "Zone A",
      fromUnit: 0,
      toUnit: 15,
      unitRate: 12.5,
      fixedCharge: 50,
      minimumCharge: 50,
      maximumCharge: 500,
      perConnectionAmount: 0,
      formulaCode: "SLAB_RATE",
      isActive: true,
    },
  ];

  const samplePagedData: TariffSlabPagedResponse = {
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

  it("should render slabs table records correctly", () => {
    render(<TariffSlabs locale="en" pagedData={samplePagedData} />);

    expect(screen.getByText("Residential Metered 2026-27")).toBeInTheDocument();
    expect(screen.getByText("Zone A")).toBeInTheDocument();
    expect(screen.getByText("SLAB_RATE")).toBeInTheDocument();
  });

  it("should trigger confirmation dialog when delete button is clicked", () => {
    render(<TariffSlabs locale="en" pagedData={samplePagedData} deleteAction={vi.fn()} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        title: "tariffWorkbench.confirm.deleteSlabTitle",
        description: "tariffWorkbench.confirm.deleteSlabDescription",
        meta: { name: "Residential Metered 2026-27", id: 10 },
      })
    );
  });

  it("should execute deleteAction and show success toast when confirmed", async () => {
    const mockDelete = vi.fn().mockResolvedValue({ success: true, message: "Deleted" });
    render(<TariffSlabs locale="en" pagedData={samplePagedData} deleteAction={mockDelete} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    const confirmCall = mockConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmCall.onConfirm();
    });

    expect(mockDelete).toHaveBeenCalledWith(10);
    expect(mockToast.success).toHaveBeenCalledWith("Deleted");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should show error toast if deleteAction fails", async () => {
    const mockDelete = vi.fn().mockResolvedValue({ success: false, message: "Delete failed" });
    render(<TariffSlabs locale="en" pagedData={samplePagedData} deleteAction={mockDelete} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    const confirmCall = mockConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmCall.onConfirm();
    });

    expect(mockDelete).toHaveBeenCalledWith(10);
    expect(mockToast.error).toHaveBeenCalledWith("Delete failed");
  });

  it("should show error toast if deleteAction is not provided", async () => {
    render(<TariffSlabs locale="en" pagedData={samplePagedData} />);

    const deleteBtn = screen.getByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtn);

    const confirmCall = mockConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmCall.onConfirm();
    });

    expect(mockToast.error).toHaveBeenCalledWith("tariffWorkbench.errors.noDeleteAction");
  });

  it("should navigate to edit slabs page when edit action is clicked", () => {
    render(<TariffSlabs locale="en" pagedData={samplePagedData} />);

    const editBtn = screen.getByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/slabs/edit/10");
  });

  it("TariffSlabForm maps initial FLAT_RATE to FIXED and submits FIXED", () => {
    const handleSubmit = vi.fn();
    render(
      <TariffSlabForm
        open={true}
        initialData={{
          id: 1,
          tariffId: 1,
          tariffName: "Residential",
          geographyUnitId: null,
          geographyUnitName: "",
          fromUnit: 0,
          toUnit: 0,
          unitRate: 0,
          fixedCharge: 50,
          minimumCharge: 0,
          maximumCharge: null,
          perConnectionAmount: null,
          formulaCode: "FLAT_RATE",
          sortOrder: 1,
          isActive: true,
        }}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const updateBtn = screen.getByRole("button", { name: "common.buttons.update" });
    fireEvent.click(updateBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        formulaCode: "FIXED",
        fixedCharge: 50,
      })
    );
  });
});
