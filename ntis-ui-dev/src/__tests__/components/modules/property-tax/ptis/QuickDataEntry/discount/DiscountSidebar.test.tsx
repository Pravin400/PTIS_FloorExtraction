import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscountSidebar } from "@/components/modules/property-tax/ptis/QuickDataEntry/discount/DiscountSidebar";
import { DiscountAttributeState } from "@/types/discount.types";

describe("DiscountSidebar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockDiscounts: DiscountAttributeState[] = [
        {
            id: 1,
            socialAttributeCode: "DISC_SENIOR",
            socialAttributeName: "Senior Citizen Discount",
            dataType: "BIT",
            enabled: false,
            bitValue: false,
            displayOrder: 1,
            isDiscountApplicable: true,
        },
        {
            id: 2,
            socialAttributeCode: "DISC_SOLAR",
            socialAttributeName: "Solar Panel Discount",
            dataType: "BIT",
            enabled: true,
            bitValue: true,
            displayOrder: 2,
            isDiscountApplicable: true,
        },
        {
            id: 3,
            socialAttributeCode: "DISC_RAINWATER",
            socialAttributeName: "Rainwater Harvesting Discount",
            dataType: "BIT",
            enabled: false,
            bitValue: false,
            displayOrder: 3,
            isDiscountApplicable: true,
        },
    ];

    const mockT = Object.assign((key: string) => key, {
        has: () => true,
    });

    const defaultProps = {
        searchTerm: "",
        onSearchChange: vi.fn(),
        showActiveFirst: false,
        onShowActiveChange: vi.fn(),
        discounts: mockDiscounts,
        selectedId: 1,
        onSelect: vi.fn(),
        onToggleEnabled: vi.fn(),
        t: mockT,
    };

    it("renders discounts in their default order when showActiveFirst is false", () => {
        render(<DiscountSidebar {...defaultProps} />);

        expect(screen.getByText("Senior Citizen Discount")).toBeInTheDocument();
        expect(screen.getByText("Solar Panel Discount")).toBeInTheDocument();
        expect(screen.getByText("Rainwater Harvesting Discount")).toBeInTheDocument();
    });

    it("sorts active discounts first when showActiveFirst is true", () => {
        const { container } = render(
            <DiscountSidebar {...defaultProps} showActiveFirst={true} />
        );

        const cardLabels = container.querySelectorAll("[data-certificate-id]");
        expect(cardLabels.length).toBe(3);
        // Solar Panel Discount (bitValue: true) should be first
        expect(cardLabels[0].getAttribute("data-certificate-id")).toBe("2");
    });

    it("filters discounts by search term", () => {
        render(<DiscountSidebar {...defaultProps} searchTerm="Solar" />);

        expect(screen.getByText("Solar Panel Discount")).toBeInTheDocument();
        expect(screen.queryByText("Senior Citizen Discount")).not.toBeInTheDocument();
        expect(screen.queryByText("Rainwater Harvesting Discount")).not.toBeInTheDocument();
    });

    it("calls onShowActiveChange when toggle switch is clicked", () => {
        render(<DiscountSidebar {...defaultProps} />);

        const toggleLabel = screen.getByText("discount.showActiveFirst");
        fireEvent.click(toggleLabel);

        expect(defaultProps.onShowActiveChange).toHaveBeenCalledWith(true);
    });

    it("calls onSelect when a discount card is clicked", () => {
        render(<DiscountSidebar {...defaultProps} />);

        const card = screen.getByText("Solar Panel Discount");
        fireEvent.click(card);

        expect(defaultProps.onSelect).toHaveBeenCalledWith(2);
    });
});
