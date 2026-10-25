import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PenaltyRuleFormDrawer } from "@/components/modules/water-bill/penalty-rule-master/PenaltyRuleFormDrawer";
import { useRouter } from "next/navigation";
import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useLocale: () => "en",
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/penalty-rule-master/action", () => ({
  savePenaltyRuleAction: vi.fn(),
  deletePenaltyRuleAction: vi.fn(),
  updatePenaltyRuleStatusAction: vi.fn(),
  fetchFinancialYearLookupOptionsAction: vi.fn().mockResolvedValue([]),
  fetchConnectionCategoryLookupOptionsAction: vi.fn().mockResolvedValue([]),
  fetchGeographyLookupOptionsAction: vi.fn().mockResolvedValue([]),
  fetchChargeHeadLookupOptionsAction: vi.fn().mockResolvedValue([]),
}));

describe("PenaltyRuleFormDrawer", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("renders Add form elements properly", () => {
    render(<PenaltyRuleFormDrawer open={true} initialData={null} />);

    expect(screen.getByText("form.addTitle")).toBeInTheDocument();
    expect(screen.getByText("form.financialYear")).toBeInTheDocument();
    expect(screen.getByText("form.penaltyType")).toBeInTheDocument();
  });

  it("renders Edit form with initial data and status switch", () => {
    const data: WaterPenaltyRuleDto = {
      penaltyRuleId: 9,
      financialYearId: 1,
      connectionCategoryId: 1,
      penaltyType: "Percentage",
      percentageRate: 15,
      fromDay: 7,
      effectiveFrom: "2026-04-01",
      effectiveTo: "2027-03-31",
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    render(<PenaltyRuleFormDrawer open={true} initialData={data} />);

    expect(screen.getByText("form.editTitle")).toBeInTheDocument();
    expect(screen.getByText("form.status.label")).toBeInTheDocument();
  });

  it("triggers close callback when CancelButton is clicked", () => {
    const handleClose = vi.fn();
    render(<PenaltyRuleFormDrawer open={true} onClose={handleClose} />);

    const cancelButton = screen.getByRole("button", { name: /buttons\.cancel/i });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalled();
  });
});
