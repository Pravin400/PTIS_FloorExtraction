import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyFilter } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/PropertyFilter";

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
}));

describe("PropertyFilter", () => {
    const mockZoneChange = vi.fn();
    const mockWardsChange = vi.fn();
    const mockTranslate = (key: string) => key;

    const mockZoneOptions = [{ value: "Z1", label: "Zone 1" }];
    const mockWardOptions = [{ value: "W1", label: "Ward 1" }];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders header and toggles filter expansion on Filter button click", () => {
        render(
            <PropertyFilter
                zoneOptions={mockZoneOptions}
                wardOptions={mockWardOptions}
                onZoneChange={mockZoneChange}
                onWardsChange={mockWardsChange}
                t={mockTranslate}
            />
        );

        expect(screen.getByText("uploadDownloadDrawer.propertyFilter.title")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.propertyFilter.noFilter")).toBeInTheDocument();

        const filterButton = screen.getByText("uploadDownloadDrawer.propertyFilter.filter");
        fireEvent.click(filterButton);

        expect(screen.getByText("uploadDownloadDrawer.propertyFilter.divisionLabel")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.propertyFilter.wardLabel")).toBeInTheDocument();
    });

    it("shows active filter indicator when a filter is applied", () => {
        render(
            <PropertyFilter
                zoneOptions={mockZoneOptions}
                wardOptions={mockWardOptions}
                selectedZone="Z1"
                onZoneChange={mockZoneChange}
                onWardsChange={mockWardsChange}
                t={mockTranslate}
            />
        );

        expect(screen.getByText("uploadDownloadDrawer.propertyFilter.filterActive")).toBeInTheDocument();
    });
});
