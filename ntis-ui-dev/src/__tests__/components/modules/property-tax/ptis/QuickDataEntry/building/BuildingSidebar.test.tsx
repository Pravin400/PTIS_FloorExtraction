import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BuildingSidebar } from "@/components/modules/property-tax/ptis/QuickDataEntry/building/BuildingSidebar";
import { CertificateData } from "@/types/building-permission.types";

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
}));

describe("BuildingSidebar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCertificates: CertificateData[] = [
        {
            certificateTypeId: 1,
            certificateTypeName: "Commencement Certificate",
            enabled: false,
            number: "CC-101",
            date: "2024-01-01",
            displayOrder: 1,
        },
        {
            certificateTypeId: 2,
            certificateTypeName: "Occupancy Certificate",
            enabled: true,
            number: "OC-202",
            date: "2024-02-02",
            displayOrder: 2,
        },
        {
            certificateTypeId: 3,
            certificateTypeName: "Possession Certificate",
            enabled: false,
            number: "PC-303",
            date: "2024-03-03",
            displayOrder: 3,
        },
    ];

    const defaultProps = {
        searchTerm: "",
        onSearchChange: vi.fn(),
        showActiveFirst: false,
        onShowActiveChange: vi.fn(),
        certificates: mockCertificates,
        selectedTypeId: 1,
        onSelect: vi.fn(),
        onToggleEnabled: vi.fn(),
        t: (key: string) => key,
    };

    it("renders certificates in their default order when showActiveFirst is false", () => {
        const { container } = render(<BuildingSidebar {...defaultProps} />);
        
        const cardLabels = container.querySelectorAll("[data-certificate-id]");
        expect(cardLabels.length).toBe(3);
        expect(screen.getByText("Commencement Certificate")).toBeInTheDocument();
        expect(screen.getByText("Occupancy Certificate")).toBeInTheDocument();
        expect(screen.getByText("Possession Certificate")).toBeInTheDocument();
    });

    it("sorts active certificates first when showActiveFirst is true", () => {
        const { container } = render(
            <BuildingSidebar {...defaultProps} showActiveFirst={true} />
        );

        const cardLabels = container.querySelectorAll("[data-certificate-id]");
        expect(cardLabels.length).toBe(3);
        // Occupancy Certificate (enabled: true) should be first
        expect(cardLabels[0].getAttribute("data-certificate-id")).toBe("2");
    });

    it("filters certificates by search term", () => {
        render(<BuildingSidebar {...defaultProps} searchTerm="Occupancy" />);

        expect(screen.getByText("Occupancy Certificate")).toBeInTheDocument();
        expect(screen.queryByText("Commencement Certificate")).not.toBeInTheDocument();
        expect(screen.queryByText("Possession Certificate")).not.toBeInTheDocument();
    });

    it("calls onShowActiveChange when toggle switch is clicked", () => {
        render(<BuildingSidebar {...defaultProps} />);

        const toggleLabel = screen.getByText("building.showActiveFirst");
        fireEvent.click(toggleLabel);

        expect(defaultProps.onShowActiveChange).toHaveBeenCalledWith(true);
    });

    it("calls onSelect when a certificate card is clicked", () => {
        render(<BuildingSidebar {...defaultProps} />);

        const card = screen.getByText("Occupancy Certificate");
        fireEvent.click(card);

        expect(defaultProps.onSelect).toHaveBeenCalledWith(2);
    });

    it("renders disabled checked toggle only for already applied certificates and interactive toggle for unapplied certificates", () => {
        const testCerts: CertificateData[] = [
            {
                certificateTypeId: 1,
                certificateTypeName: "Build Completion Certificate",
                enabled: true,
                number: "123",
                date: "2024-01-01",
                hasExistingData: true,
                propertyCertificateId: 101,
                sourceLevel: "Direct",
            },
            {
                certificateTypeId: 2,
                certificateTypeName: "Occupancy Certificate",
                enabled: false,
                number: "",
                date: "",
                hasExistingData: false,
                sourceLevel: "None",
            },
            {
                certificateTypeId: 3,
                certificateTypeName: "Sale Deed",
                enabled: true,
                number: "",
                date: "",
                hasExistingData: false,
                sourceLevel: "None",
            },
        ];

        const { container } = render(
            <BuildingSidebar
                {...defaultProps}
                certificates={testCerts}
            />
        );

        const card1 = container.querySelector('[data-certificate-id="1"]');
        const card2 = container.querySelector('[data-certificate-id="2"]');
        const card3 = container.querySelector('[data-certificate-id="3"]');

        const button1 = card1?.querySelector('button[role="switch"]');
        const button2 = card2?.querySelector('button[role="switch"]');
        const button3 = card3?.querySelector('button[role="switch"]');

        // Applied certificate: checked=true, disabled=true
        expect(button1).toHaveAttribute("aria-checked", "true");
        expect(button1).toBeDisabled();

        // Unapplied disabled certificate: checked=false, disabled=false
        expect(button2).toHaveAttribute("aria-checked", "false");
        expect(button2).not.toBeDisabled();

        // Unapplied empty state enabled certificate: checked=true, disabled=false
        expect(button3).toHaveAttribute("aria-checked", "true");
        expect(button3).not.toBeDisabled();
    });
});
