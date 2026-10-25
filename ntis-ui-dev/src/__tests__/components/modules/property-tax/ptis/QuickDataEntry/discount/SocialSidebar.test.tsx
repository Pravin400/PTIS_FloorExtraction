import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SocialSidebar } from "@/components/modules/property-tax/ptis/QuickDataEntry/discount/SocialSidebar";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";

describe("SocialSidebar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockAttributes: FlatSocialAttributeState[] = [
        {
            id: null,
            socialAttributeId: 10,
            socialAttributeCode: "SOC_ELEVATOR",
            socialAttributeName: "Elevator Facility",
            dataType: "BIT",
            parentAttributeId: null,
            isRequiredWhenParentTrue: false,
            bitValue: false,
            intValue: null,
            decimalValue: null,
            textValue: null,
            dateValue: null,
            documentBindingId: null,
            remark: null,
            isUploading: false,
        },
        {
            id: null,
            socialAttributeId: 20,
            socialAttributeCode: "SOC_PARKING",
            socialAttributeName: "Covered Parking",
            dataType: "BIT",
            parentAttributeId: null,
            isRequiredWhenParentTrue: false,
            bitValue: true,
            intValue: null,
            decimalValue: null,
            textValue: null,
            dateValue: null,
            documentBindingId: null,
            remark: null,
            isUploading: false,
        },
        {
            id: null,
            socialAttributeId: 30,
            socialAttributeCode: "SOC_GYM",
            socialAttributeName: "Gymnasium",
            dataType: "BIT",
            parentAttributeId: null,
            isRequiredWhenParentTrue: false,
            bitValue: false,
            intValue: null,
            decimalValue: null,
            textValue: null,
            dateValue: null,
            documentBindingId: null,
            remark: null,
            isUploading: false,
        },
    ];

    const mockSocialData: Record<number, FlatSocialAttributeState> = {
        10: mockAttributes[0],
        20: mockAttributes[1],
        30: mockAttributes[2],
    };

    const mockT = Object.assign((key: string) => key, {
        has: () => true,
    });

    const defaultProps = {
        searchTerm: "",
        onSearchChange: vi.fn(),
        showActiveFirst: false,
        onShowActiveChange: vi.fn(),
        attributes: mockAttributes,
        socialData: mockSocialData,
        selectedId: 10,
        onSelect: vi.fn(),
        onToggleEnabled: vi.fn(),
        t: mockT,
    };

    it("renders attributes in their default order when showActiveFirst is false", () => {
        render(<SocialSidebar {...defaultProps} />);

        expect(screen.getByText("Elevator Facility")).toBeInTheDocument();
        expect(screen.getByText("Covered Parking")).toBeInTheDocument();
        expect(screen.getByText("Gymnasium")).toBeInTheDocument();
    });

    it("sorts active attributes first when showActiveFirst is true", () => {
        const { container } = render(
            <SocialSidebar {...defaultProps} showActiveFirst={true} />
        );

        const cardLabels = container.querySelectorAll("[data-certificate-id]");
        expect(cardLabels.length).toBe(3);
        // Covered Parking (bitValue: true) should be first
        expect(cardLabels[0].getAttribute("data-certificate-id")).toBe("20");
    });

    it("filters attributes by search term", () => {
        render(<SocialSidebar {...defaultProps} searchTerm="Parking" />);

        expect(screen.getByText("Covered Parking")).toBeInTheDocument();
        expect(screen.queryByText("Elevator Facility")).not.toBeInTheDocument();
        expect(screen.queryByText("Gymnasium")).not.toBeInTheDocument();
    });

    it("calls onShowActiveChange when toggle switch is clicked", () => {
        render(<SocialSidebar {...defaultProps} />);

        const toggleLabel = screen.getByText("discount.showActiveFirst");
        fireEvent.click(toggleLabel);

        expect(defaultProps.onShowActiveChange).toHaveBeenCalledWith(true);
    });

    it("calls onSelect when an attribute card is clicked", () => {
        render(<SocialSidebar {...defaultProps} />);

        const card = screen.getByText("Covered Parking");
        fireEvent.click(card);

        expect(defaultProps.onSelect).toHaveBeenCalledWith(20);
    });
});
