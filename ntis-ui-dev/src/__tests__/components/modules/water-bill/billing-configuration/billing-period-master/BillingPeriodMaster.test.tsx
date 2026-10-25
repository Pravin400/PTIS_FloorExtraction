import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingPeriodMaster } from "@/components/modules/water-bill/billing-configuration/billing-period/BillingPeriodMaster";
import type {
  BillingPeriodMaster as BillingPeriodMasterType,
  BillingPeriodPagedResponse,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

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
  useTranslations: (ns: string) => (key: string, params?: { count?: number }) => {
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

describe("BillingPeriodMaster - Component Tests", () => {
  const sampleRecords: BillingPeriodMasterType[] = [
    {
      id: 1,
      billingPeriodCode: "BP-1-1-1",
      financialYearId: 1,
      billingFrequencyId: 1,
      periodFromDate: "2026-04-01T00:00:00.000Z",
      periodToDate: "2026-04-30T00:00:00.000Z",
      graceDays: 0,
      isActive: true,
      financialYear: "2026",
      billingFrequency: "Monthly",
    },
  ];

  const samplePagedData: BillingPeriodPagedResponse = {
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

  it("should render add button and search input", () => {
    render(
      <BillingPeriodMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    expect(screen.getByRole("button", { name: /billingPeriodMaster.addTitle/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("billingPeriodMaster.searchPlaceholder")).toBeInTheDocument();
  });

  it("should render table records with periods and action buttons", () => {
    render(
      <BillingPeriodMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    expect(screen.getByText("01 Apr 2026")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "common.table.actions.edit" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "common.table.actions.delete" })).toHaveLength(1);
  });

  it("should navigate to add page when add button is clicked", () => {
    render(
      <BillingPeriodMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    const addBtn = screen.getByRole("button", { name: /billingPeriodMaster.addTitle/i });
    fireEvent.click(addBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-period/add");
  });

  it("should navigate to edit page when edit button is clicked", () => {
    render(
      <BillingPeriodMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editBtns[0]);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-period/edit/1");
  });

  it("should trigger confirm modal when delete button is clicked", () => {
    render(
      <BillingPeriodMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    const deleteBtns = screen.getAllByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        meta: { name: "BP-1-1-1" },
      })
    );
  });

  it("should open form drawer when drawer prop is 'add'", () => {
    render(
      <BillingPeriodMaster
        locale="en"
        pagedData={samplePagedData}
        drawer="add"
      />
    );

    expect(screen.getByText("billingPeriodMaster.addSubtitle")).toBeInTheDocument();
  });

  it("should open form drawer with prefilled values when drawer prop is 'edit'", () => {
    render(
      <BillingPeriodMaster
        locale="en"
        pagedData={samplePagedData}
        drawer="edit"
        initialEditingData={sampleRecords[0]}
      />
    );

    expect(screen.getByText("billingPeriodMaster.editSubtitle")).toBeInTheDocument();
  });
});
