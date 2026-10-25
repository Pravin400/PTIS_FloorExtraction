import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PenaltyRuleMaster } from "@/components/modules/water-bill/penalty-rule-master";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/en/water-bill/penalty-rule-master"),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => ""),
    toString: vi.fn(() => ""),
  })),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/penalty-rule-master/action", () => ({
  deletePenaltyRuleAction: vi.fn(),
  fetchFinancialYearLookupOptionsAction: vi.fn().mockResolvedValue([]),
  fetchConnectionCategoryLookupOptionsAction: vi.fn().mockResolvedValue([]),
  fetchGeographyLookupOptionsAction: vi.fn().mockResolvedValue([]),
  fetchChargeHeadLookupOptionsAction: vi.fn().mockResolvedValue([]),
}));

describe("PenaltyRuleMaster", () => {
  const mockPush = vi.fn();
  const mockConfirm = vi.fn();

  const mockData: WaterPenaltyRuleDto[] = [
    {
      penaltyRuleId: 1,
      financialYearId: 1,
      financialYearName: "2026-27",
      connectionCategoryId: 1,
      connectionCategoryName: "Residential",
      geographyUnitId: null,
      geographyName: null,
      chargeHeadId: 1,
      chargeHeadName: "Late Fee",
      penaltyType: "Percentage",
      fromDay: 1,
      toDay: 30,
      percentageRate: 2.5,
      flatAmount: null,
      maximumAmount: 500,
      effectiveFrom: "2026-04-01T00:00:00",
      effectiveTo: "2027-03-31T00:00:00",
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    },
  ];

  const defaultProps = {
    data: mockData,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useConfirm).mockReturnValue({
      confirm: mockConfirm,
    });
  });

  it("renders page header, search input, and add button", () => {
    render(<PenaltyRuleMaster {...defaultProps} />);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("searchPlaceholder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "add" })).toBeInTheDocument();
  });

  it("renders table row data for Water Bill penalty rules", () => {
    render(<PenaltyRuleMaster {...defaultProps} />);

    expect(screen.getByText("2026-27")).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
  });

  it("navigates to add route when add button is clicked", () => {
    render(<PenaltyRuleMaster {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "add" }));
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/penalty-rule-master/add");
  });

  it("navigates to edit route when edit action button is clicked", () => {
    render(<PenaltyRuleMaster {...defaultProps} />);

    const editBtn = screen.getByLabelText("Edit Penalty Rule");
    fireEvent.click(editBtn);
    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/penalty-rule-master/edit/1");
  });

  it("opens confirm dialog when delete action button is clicked", () => {
    render(<PenaltyRuleMaster {...defaultProps} />);

    const deleteBtn = screen.getByLabelText("Delete Penalty Rule");
    fireEvent.click(deleteBtn);
    expect(mockConfirm).toHaveBeenCalled();
  });
});
