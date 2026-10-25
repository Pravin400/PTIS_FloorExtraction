import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import TaxZoningPage from "@/components/modules/property-tax/taxzoningmaster/TaxZoningPage";
import { TaxZone, Ward, TaxZoningPageProps } from "@/types/taxzoning.types";

// Mock imports
vi.mock("next/navigation", () => ({ 
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock actions
const mockUpdateTaxZoningAction = vi.fn();
vi.mock("@/app/[locale]/property-tax/taxzoning/actions", () => ({
    createTaxZoningAction: vi.fn(),
    updateTaxZoningAction: (...args: unknown[]) => mockUpdateTaxZoningAction(...args),
    getTaxZoningByWardAction: vi.fn().mockResolvedValue({ success: true, data: { items: [], totalCount: 0 } }),
}));

const mockTaxZones = {
    items: [{ id: 1, taxZoneNo: "TZ001", taxZoneType: "Residential", isActive: true }] as unknown as TaxZone[],
    pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false,
};
const mockWardsData = {
    items: [{ id: 1, wardNo: "W001", zoneNo: "1", isActive: true }] as unknown as Ward[],
    pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false,
};

describe("TaxZoningPage Integration", () => {
    it("handles full workflow", async () => {
        mockUpdateTaxZoningAction.mockResolvedValue({ success: true, message: "Updated successfully" });

        const mockDataWithRecord = [
            {
                taxZoneId: 1,
                wardId: 1,
                taxZone: "TZ001",
                wardNo: "W001",
                propertyNo: "100",
                fromProperty: "100",
                toProperty: "200",
                isActive: true,
                createdDate: "2024-01-01",
                updatedDate: null,
            },
        ];

        render(
            <TaxZoningPage
                data={mockDataWithRecord}
                pageNumber={1}
                pageSize={10}
                totalCount={1}
                totalPages={1}
                taxZones={mockTaxZones as unknown as TaxZoningPageProps["taxZones"]}
                wardsData={mockWardsData as unknown as TaxZoningPageProps["wardsData"]}
            />
        );

        // Verify component renders with data (title is combined with form.update as "form.update title")
        expect(screen.getByText(/form\.update.*title/)).toBeInTheDocument();
        expect(screen.getByText("W001")).toBeInTheDocument();
        expect(screen.getByText("TZ001")).toBeInTheDocument();

        // Verify table shows the data
        expect(screen.getAllByText("100").length).toBeGreaterThan(0);
        expect(screen.getAllByText("200").length).toBeGreaterThan(0);

        // Verify form components exist
        expect(screen.getAllByText("form.selectTaxZone").length).toBeGreaterThan(0);
        expect(screen.getAllByText("form.selectWard").length).toBeGreaterThan(0);
    });
});
