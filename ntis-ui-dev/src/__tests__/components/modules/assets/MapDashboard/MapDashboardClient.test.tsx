import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MapDashboardClient from "@/components/modules/assets/MapDashboard/MapDashboardClient";
import type { DashboardStatsData, HighCommitteeDashboardProps } from "@/types/assets/map-dashboard.types";

// Mock HighCommitteeDashboard to simplify client component assertions
vi.mock("@/components/modules/assets/MapDashboard/HighCommitteeDashboard", () => ({
  HighCommitteeDashboard: ({ dashboardStats, initialDistrict }: HighCommitteeDashboardProps) => (
    <div data-testid="high-committee-dashboard">
      <span data-testid="district">{initialDistrict}</span>
      <span data-testid="total-assets">{dashboardStats?.totalAssets}</span>
    </div>
  ),
}));

describe("MapDashboardClient Component", () => {
  it("should render HighCommitteeDashboard with passed initial props", () => {
    const mockInitialData: DashboardStatsData = {
      totalAssets: 44,
      totalValue: 27567675532.01,
      buildingCount: 44,
    };

    render(
      <MapDashboardClient initialData={mockInitialData} initialDistrict="Akola" />
    );

    expect(screen.getByTestId("high-committee-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("district")).toHaveTextContent("Akola");
    expect(screen.getByTestId("total-assets")).toHaveTextContent("44");
  });
});
