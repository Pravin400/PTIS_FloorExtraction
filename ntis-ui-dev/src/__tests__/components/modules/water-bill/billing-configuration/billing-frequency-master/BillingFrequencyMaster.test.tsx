import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingFrequencyMaster } from "@/components/modules/water-bill/billing-configuration/billing-frequency/BillingFrequencyMaster";
import type {
  BillingFrequencyMaster as BillingFrequencyMasterType,
  BillingFrequencyMasterPagedResponse,
} from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";

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

describe("BillingFrequencyMaster - Component Tests", () => {
  const sampleRecords: BillingFrequencyMasterType[] = [
    {
      id: 1,
      billingFrequencyCode: "MONTHLY",
      billingFrequency: "Monthly",
      periodsPerYear: 12,
      description: "Monthly billing",
      isActive: true,
    },
    {
      id: 2,
      billingFrequencyCode: "YEARLY",
      billingFrequency: "Yearly",
      periodsPerYear: 1,
      description: "Yearly billing",
      isActive: false,
    },
  ];

  const samplePagedData: BillingFrequencyMasterPagedResponse = {
    items: sampleRecords,
    totalCount: 2,
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
      <BillingFrequencyMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    expect(screen.getByRole("button", { name: /billingFrequencyMaster.addTitle/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("billingFrequencyMaster.searchPlaceholder")).toBeInTheDocument();
  });

  it("should render table records with frequencies and action buttons", () => {
    render(
      <BillingFrequencyMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Yearly")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "common.table.actions.edit" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "common.table.actions.delete" })).toHaveLength(2);
  });

  it("should navigate to add page when add button is clicked", () => {
    render(
      <BillingFrequencyMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    const addBtn = screen.getByRole("button", { name: /billingFrequencyMaster.addTitle/i });
    fireEvent.click(addBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-frequency/add");
  });

  it("should navigate to edit page when edit button is clicked", () => {
    render(
      <BillingFrequencyMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editBtns[0]);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/billing-configuration/billing-frequency/edit/1");
  });

  it("should trigger confirm modal when delete button is clicked", () => {
    render(
      <BillingFrequencyMaster
        locale="en"
        pagedData={samplePagedData}
      />
    );

    const deleteBtns = screen.getAllByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        meta: { name: "Monthly" },
      })
    );
  });

  it("should open form drawer when drawer prop is 'add'", () => {
    render(
      <BillingFrequencyMaster
        locale="en"
        pagedData={samplePagedData}
        drawer="add"
      />
    );

    expect(screen.getByText("billingFrequencyMaster.addSubtitle")).toBeInTheDocument();
  });

  it("should open form drawer with prefilled values when drawer prop is 'edit'", () => {
    render(
      <BillingFrequencyMaster
        locale="en"
        pagedData={samplePagedData}
        drawer="edit"
        initialEditingData={sampleRecords[0]}
      />
    );

    expect(screen.getByText("billingFrequencyMaster.editSubtitle")).toBeInTheDocument();
    expect(screen.getByLabelText(/form.billingFrequency.label/i)).toHaveValue("Monthly");
  });
});
