import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChargeHeads } from "@/components/modules/water-bill/charge-heads/ChargeHeads";
import type {
  ChargeHead,
  ChargeHeadsPagedResponse,
} from "@/types/water-bill/chargeHeads.types";

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
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
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

describe("ChargeHeads Component Tests", () => {
  const sampleRecords: ChargeHead[] = [
    {
      id: 1,
      chargeHeadCode: "WTR_CHG",
      chargeHeadName: "Water Supply Charge",
      chargeType: "Charge",
      sequenceNo: 1,
      isRefundable: false,
      isRegularPay: false,
      isActive: true,
    },
    {
      id: 2,
      chargeHeadCode: "WTR_TAX",
      chargeHeadName: "Water Conservation Tax",
      chargeType: "Tax",
      sequenceNo: 2,
      isRefundable: false,
      isRegularPay: false,
      isActive: true,
    },
  ];

  const samplePagedData: ChargeHeadsPagedResponse = {
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

  it("should render page header and add button successfully", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} />);

    expect(screen.getByText("chargeHeads.list.title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chargeHeads.list.buttons.add/i })).toBeInTheDocument();
  });

  it("should render list/table records with code, name, and charge type", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} />);

    expect(screen.getByText("WTR_CHG")).toBeInTheDocument();
    expect(screen.getByText("Water Supply Charge")).toBeInTheDocument();
    expect(screen.getByText("WTR_TAX")).toBeInTheDocument();
    expect(screen.getByText("Water Conservation Tax")).toBeInTheDocument();
    expect(screen.getByText("Charge")).toBeInTheDocument();
    expect(screen.getByText("Tax")).toBeInTheDocument();
  });

  it("should render empty state when no records are returned", () => {
    const emptyPagedData: ChargeHeadsPagedResponse = {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    render(<ChargeHeads locale="en" pagedData={emptyPagedData} />);

    expect(screen.getByText("common.messages.noData")).toBeInTheDocument();
  });

  it("should handle search input change", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} />);

    const searchInput = screen.getByPlaceholderText("chargeHeads.list.filters.search");
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "WTR" } });
    expect(searchInput).toHaveValue("WTR");
  });

  it("should navigate to add page when Add button is clicked", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} />);

    const addBtn = screen.getByRole("button", { name: /chargeHeads.list.buttons.add/i });
    fireEvent.click(addBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/charge-heads/add");
  });

  it("should navigate to edit page when Edit action button is clicked", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} />);

    const editBtns = screen.getAllByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editBtns[0]);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/charge-heads/edit/1");
  });

  it("should trigger confirm modal when Delete action button is clicked", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} />);

    const deleteBtns = screen.getAllByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        title: "chargeHeads.list.table.code: WTR_CHG",
        meta: { name: "Water Supply Charge", id: 1 },
      })
    );
  });

  it("should open form drawer when drawer prop is 'add'", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} drawer="add" />);

    expect(screen.getAllByText("chargeHeads.form.addTitle").length).toBeGreaterThan(0);
  });

  it("should open form drawer with prefilled values when drawer prop is 'edit'", () => {
    render(
      <ChargeHeads
        locale="en"
        pagedData={samplePagedData}
        drawer="edit"
        initialEditingData={sampleRecords[0]}
      />
    );

    expect(screen.getByText("chargeHeads.form.editTitle")).toBeInTheDocument();
    expect(screen.getByDisplayValue("WTR_CHG")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Water Supply Charge")).toBeInTheDocument();
  });

  it("should open user manual modal when user manual button is clicked", () => {
    render(<ChargeHeads locale="en" pagedData={samplePagedData} />);

    const userManualBtn = screen.getByRole("button", { name: "common.buttons.userManual" });
    fireEvent.click(userManualBtn);

    expect(screen.getByText("chargeHeads.userManualModal.title")).toBeInTheDocument();
  });
});
