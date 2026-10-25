import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryCards } from "@/components/modules/assets/MapDashboard/SummaryCards";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("SummaryCards Component", () => {
  const mockLabels = {
    title: "ULB Estate Management Dashboard",
    ulbLabel: "Total ULBs",
    assetLabel: "Total Assets",
    buildingLabel: "Building Assets",
    landLabel: "Land Assets",
    infraLabel: "Infrastructure Assets",
    locationLabel: "ULB",
  };

  const mockTotalStats = {
    totalAssets: 44,
    criticalAssets: 0,
    pendingDocuments: 0,
    assetValue: 27567675532.01,
    buildingCount: 44,
    landCount: 0,
    infrastructureCount: 0,
    movableCount: 0,
    monetizationCount: 17,
    encroachmentCount: 0,
    totalValue: 27567675532.01,
  };

  it("should render all summary KPI cards with formatted values", () => {
    render(
      <SummaryCards
        labels={mockLabels}
        filteredCitiesLength={1}
        totalStats={mockTotalStats}
      />
    );

    // Total ULBs
    expect(screen.getByText("Total ULBs")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Total Assets & Building Assets value check
    expect(screen.getByText("Total Assets")).toBeInTheDocument();
    expect(screen.getAllByText("44")).toHaveLength(2);

    // Building Assets
    expect(screen.getByText("Building Assets")).toBeInTheDocument();

    // Asset Valuation formatting
    expect(screen.getByText("₹2756.77Cr")).toBeInTheDocument();
  });
});
