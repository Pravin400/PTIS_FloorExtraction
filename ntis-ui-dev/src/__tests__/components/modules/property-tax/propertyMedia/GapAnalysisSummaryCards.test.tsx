import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GapAnalysisSummaryCards } from "@/components/modules/property-tax/PropertyMedia/GapAnalysis/GapAnalysisSummaryCards";
import { DashboardStatistics } from "@/types/PropertyMedia/PropertyMedia.types";

describe("GapAnalysisSummaryCards", () => {
    const mockCategoryClick = vi.fn();
    const mockTranslate = (key: string) => key;

    const mockStats: DashboardStatistics = {
        totalProperties: { total: 1000, structures: 800, units: 1000 },
        buildingPhotoAvailable: { total: 600, structures: 500, units: 600 },
        buildingPlanAvailable: { total: 600, structures: 500, units: 600 },
        buildingPhotoMissing: {
            applicable: 1000,
            available: 600,
            missing: 400,
        },
        buildingPlanMissing: {
            applicable: 800,
            available: 600,
            missing: 200,
        },
        surveyFormMissing: {
            applicable: 500,
            available: 450,
            missing: 50,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the 3 gap analysis summary cards with titles and stats", () => {
        render(
            <GapAnalysisSummaryCards
                dashboardStats={mockStats}
                activeCategory=""
                onCategoryClick={mockCategoryClick}
                t={mockTranslate}
            />
        );

        expect(screen.getByText("gapAnalysis.summaryCards.buildingPhotoMissing")).toBeInTheDocument();
        expect(screen.getByText("gapAnalysis.summaryCards.buildingPlanMissing")).toBeInTheDocument();
        expect(screen.getByText("gapAnalysis.summaryCards.surveyFormMissing")).toBeInTheDocument();

        // Check missing values (rendered in both top header and bottom stat card)
        expect(screen.getAllByText("400").length).toBe(2);
        expect(screen.getAllByText("200").length).toBe(2);
        expect(screen.getAllByText("50").length).toBe(2);

        // Check calculated missing percentage badges: (400/1000)=40%, (200/800)=25%, (50/500)=10%
        expect(screen.getByText("40%")).toBeInTheDocument();
        expect(screen.getByText("25%")).toBeInTheDocument();
        expect(screen.getByText("10%")).toBeInTheDocument();
    });

    it("triggers onCategoryClick when card is clicked", () => {
        render(
            <GapAnalysisSummaryCards
                dashboardStats={mockStats}
                activeCategory=""
                onCategoryClick={mockCategoryClick}
                t={mockTranslate}
            />
        );

        const cards = screen.getAllByRole("button");
        fireEvent.click(cards[0]);

        // First card corresponds to category id 1
        expect(mockCategoryClick).toHaveBeenCalledWith("1");
    });

    it("handles keyboard events (Enter and Space) on cards", () => {
        render(
            <GapAnalysisSummaryCards
                dashboardStats={mockStats}
                activeCategory=""
                onCategoryClick={mockCategoryClick}
                t={mockTranslate}
            />
        );

        const cards = screen.getAllByRole("button");

        fireEvent.keyDown(cards[1], { key: "Enter" });
        expect(mockCategoryClick).toHaveBeenCalledWith("2");

        fireEvent.keyDown(cards[2], { key: " " });
        expect(mockCategoryClick).toHaveBeenCalledWith("3");

        // Other keys should not trigger callback
        fireEvent.keyDown(cards[0], { key: "Escape" });
        expect(mockCategoryClick).toHaveBeenCalledTimes(2);
    });

    it("applies active styling to the currently selected category card", () => {
        render(
            <GapAnalysisSummaryCards
                dashboardStats={mockStats}
                activeCategory="1"
                onCategoryClick={mockCategoryClick}
                t={mockTranslate}
            />
        );

        const cards = screen.getAllByRole("button");
        // Card 1 is active
        expect(cards[0].className).toContain("border-blue-600");
        // Card 2 is inactive
        expect(cards[1].className).not.toContain("border-blue-600");
    });

    it("gracefully displays 0 and 0% when dashboardStats is undefined", () => {
        render(
            <GapAnalysisSummaryCards
                dashboardStats={undefined}
                activeCategory=""
                onCategoryClick={mockCategoryClick}
                t={mockTranslate}
            />
        );

        const zeroBadges = screen.getAllByText("0%");
        expect(zeroBadges).toHaveLength(3);
    });
});
