import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UrbanLocalBodiesTabs } from "@/components/modules/assets/MapDashboard/UrbanLocalBodiesTabs";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
    toString: vi.fn(() => ""),
  }),
}));

describe("UrbanLocalBodiesTabs Component", () => {
  const mockCities = [
    {
      name: "Akola",
      lat: 20.7002,
      lng: 77.0082,
      totalAssets: 44,
      criticalAssets: 0,
      pendingDocuments: 0,
      assetValue: 27567675532.01,
      x: 93,
      y: 35,
      buildingCount: 44,
      landCount: 0,
      infrastructureCount: 0,
      movableCount: 0,
    },
  ];

  it("should render urban local bodies tabs and city data table", () => {
    const handleRedirect = vi.fn();
    const handleCityClick = vi.fn();

    render(
      <UrbanLocalBodiesTabs
        cities={mockCities}
        selectedCity={null}
        onCityClick={handleCityClick}
        onRedirect={handleRedirect}
      />
    );

    // Section title & tabs check
    expect(screen.getByText("table.columns.name")).toBeInTheDocument();
    expect(screen.getByText("table.columns.totalAssets")).toBeInTheDocument();
    expect(screen.getByText("table.columns.buildings")).toBeInTheDocument();

    // Akola row check
    expect(screen.getByText("Akola")).toBeInTheDocument();
    expect(screen.getAllByText("44")).toHaveLength(2);
  });
});
