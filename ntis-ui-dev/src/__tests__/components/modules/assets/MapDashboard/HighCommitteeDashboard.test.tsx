import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HighCommitteeDashboard } from "@/components/modules/assets/MapDashboard/HighCommitteeDashboard";
import type { DashboardStatsData } from "@/types/assets/map-dashboard.types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("../../../../../components/modules/assets/MapDashboard/maps/MaharashtraMap", () => ({
  default: ({ selectedCity }: { selectedCity?: { name?: string } | null }) => (
    <div data-testid="mock-maharashtra-map">
      {selectedCity?.name || "NONE"}
    </div>
  ),
}));

vi.mock("../../../../../components/modules/assets/MapDashboard/UrbanLocalBodiesTabs", () => ({
  UrbanLocalBodiesTabs: ({ selectedCity }: { selectedCity?: { name?: string } | null }) => (
    <div data-testid="mock-ulb-tabs">
      {selectedCity?.name || "NONE"}
    </div>
  ),
}));

describe("HighCommitteeDashboard Component", () => {
  const mockDashboardStats: DashboardStatsData = {
    totalAssets: 44,
    totalValue: 27567675532.01,
    buildingCount: 44,
    landCount: 0,
    infrastructureCount: 0,
    movableCount: 0,
    monetizationCount: 17,
    encroachmentCount: 0,
  };

  it("should render main header, KPI summary cards, and ULB table", async () => {
    // Resolve the async Server Component
    const DashboardElement = await HighCommitteeDashboard({
      dashboardStats: mockDashboardStats,
      initialDistrict: "Akola",
    });

    render(DashboardElement);

    // Verify mocks are rendered
    expect(screen.getByTestId("mock-maharashtra-map")).toBeInTheDocument();

    // Summary cards check
    expect(screen.getByText("cards.totalAssets")).toBeInTheDocument();

    // Table city row check (rendered both on map and table)
    expect(screen.getAllByText("Akola").length).toBeGreaterThan(0);
  });
});
