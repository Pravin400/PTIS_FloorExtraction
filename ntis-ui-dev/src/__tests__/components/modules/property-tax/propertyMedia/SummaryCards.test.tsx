import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SummaryCards } from "@/components/modules/property-tax/PropertyMedia/SummaryCards";
import { DashboardStatistics } from "@/types/PropertyMedia/PropertyMedia.types";

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}));

describe("SummaryCards", () => {
    const mockStats: DashboardStatistics = {
        totalProperties: { total: 1250, structures: 110, units: 210 },
        buildingPhotoAvailable: { total: 1100, structures: 120, units: 220 },
        buildingPlanAvailable: { total: 950, structures: 130, units: 230 },
        surveyFormAvailable: { total: 800, structures: 140, units: 240 },
        buildingPhotoMissing: { applicable: 150, available: 1100, missing: 150 },
        buildingPlanMissing: { applicable: 300, available: 950, missing: 300 },
    };

    it("renders all four summary cards with titles and values", () => {
        render(<SummaryCards dashboardStats={mockStats} />);

        expect(screen.getByText("summaryCards.totalProperties")).toBeInTheDocument();
        expect(screen.getByText("summaryCards.buildingPhotoAvailable")).toBeInTheDocument();
        expect(screen.getByText("summaryCards.buildingPlanAvailable")).toBeInTheDocument();
        expect(screen.getByText("summaryCards.surveyFormAvailable")).toBeInTheDocument();

        expect(screen.getByText("1,250")).toBeInTheDocument();
        expect(screen.getByText("1,100")).toBeInTheDocument();
        expect(screen.getByText("950")).toBeInTheDocument();
        expect(screen.getByText("800")).toBeInTheDocument();
    });

    it("renders structure and unit metrics for each card", () => {
        render(<SummaryCards dashboardStats={mockStats} />);

        expect(screen.getAllByText("summaryCards.structures").length).toBe(4);
        expect(screen.getAllByText("summaryCards.units").length).toBe(4);

        expect(screen.getByText("110")).toBeInTheDocument();
        expect(screen.getByText("210")).toBeInTheDocument();
        expect(screen.getByText("120")).toBeInTheDocument();
        expect(screen.getByText("220")).toBeInTheDocument();
        expect(screen.getByText("130")).toBeInTheDocument();
        expect(screen.getByText("230")).toBeInTheDocument();
        expect(screen.getByText("140")).toBeInTheDocument();
        expect(screen.getByText("240")).toBeInTheDocument();
    });

    it("renders 0 fallback when dashboardStats is undefined or empty", () => {
        render(<SummaryCards dashboardStats={undefined} />);

        const zeroElements = screen.getAllByText("0");
        // 4 cards * 3 metrics (value, structures, units) = 12 zeros
        expect(zeroElements.length).toBeGreaterThanOrEqual(12);
    });

    it("handles partial dashboardStats gracefully", () => {
        const partialStats: Partial<DashboardStatistics> = {
            totalProperties: { total: 500, structures: 200, units: 300 },
        };

        render(<SummaryCards dashboardStats={partialStats as DashboardStatistics} />);

        expect(screen.getByText("500")).toBeInTheDocument();
        expect(screen.getByText("200")).toBeInTheDocument();
        expect(screen.getByText("300")).toBeInTheDocument();
    });
});
