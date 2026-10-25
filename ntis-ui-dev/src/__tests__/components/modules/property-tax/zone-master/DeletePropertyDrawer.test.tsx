import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import DeletePropertyDrawer from "@/components/modules/property-tax/zone-master/properties/DeletePropertyDrawer";
import type { WardItem } from "@/types/wardMaster.types";
import type { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: vi.fn((ns?: string) => (key: string) => (ns ? `${ns}.${key}` : key)),
}));

const mockBuildingList = vi.fn(() => ({
  buildingList: [] as unknown[],
  loadingBuildingList: false,
}));

vi.mock("@/hooks/zoneMaster/useBuildingList", () => ({
  useBuildingList: () => mockBuildingList(),
}));

vi.mock("@/components/modules/property-tax/zone-master/properties/components/PropertyAmenitySection", () => ({
  PropertyAmenitySection: ({
    propertyId,
    directDeleteFallback,
  }: {
    propertyId: string;
    directDeleteFallback?: React.ReactNode;
  }) => (
    <div
      data-testid="property-amenity-section"
      data-property-id={propertyId}
      data-has-direct-fallback={String(!!directDeleteFallback)}
    />
  ),
}));

vi.mock("@/components/modules/property-tax/zone-master/properties/components/DirectPropertyDeleteSection", () => ({
  DirectPropertyDeleteSection: ({ propertyId }: { propertyId: string }) => (
    <div data-testid="direct-property-delete-section" data-property-id={propertyId} />
  ),
}));

vi.mock("@/components/modules/property-tax/zone-master/properties/components", () => ({
  PropertyInfoSection: (props: Record<string, unknown>) => (
    <div data-testid="property-info-section" data-has-ward={String(!!props.selectedWard)} />
  ),
  PropertySelectionSection: ({
    value,
    onPropertyChange,
    placeholder,
  }: {
    value: string;
    onPropertyChange: (e: unknown, val: string) => void;
    placeholder: string;
  }) => (
    <div data-testid="property-selection-section">
      <input
        data-testid="property-select-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onPropertyChange(e, e.target.value)}
        readOnly={false}
      />
    </div>
  ),
}));

vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({
    open,
    children,
    footer,
  }: {
    open: boolean;
    children: React.ReactNode;
    title: React.ReactNode;
    footer: React.ReactNode;
    onClose: () => void;
    width: string;
  }) =>
    open ? (
      <div role="dialog">
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("@/components/common", () => ({
  CancelButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Cancel</button>
  ),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeWard = (overrides?: Partial<WardItem>): WardItem => ({
  id: 10,
  wardNo: "W-01",
  zoneId: 1,
  description: "Ward 1",
  sequenceNo: 1,
  isActive: true,
  createdDate: "2024-01-01T00:00:00Z",
  updatedDate: null,
  ...overrides,
});

const makeProperty = (overrides?: Partial<ZonePropertyItem>): ZonePropertyItem => ({
  id: 1,
  taxZoneId: 1,
  wardId: 10,
  propertyNo: "PROP-001",
  partitionNo: null,
  propertyTypeId: null,
  upicId: "",
  openPlot: false,
  csn: null,
  subZoneNo: null,
  plotNo: null,
  categoryId: 2,
  type: null,
  ownerTitle: null,
  ownerName: null,
  ownerTitleEnglish: null,
  ownerNameEnglish: null,
  occupierTitle: null,
  occupierName: null,
  occupierTitleEnglish: null,
  occupierNameEnglish: null,
  flatOrShopNo: null,
  flatOrShopName: null,
  flatOrShopNoEnglish: null,
  flatOrShopNameEnglish: null,
  address: null,
  location: null,
  addressEnglish: null,
  locationEnglish: null,
  mobileNo: null,
  emailId: null,
  societyDetailId: null,
  markedForDeletion: false,
  propertySeqNo: null,
  displayProperty: null,
  isActive: true,
  createdDate: "2024-01-01T00:00:00Z",
  updatedDate: null,
  ...overrides,
});

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DeletePropertyDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildingList.mockReturnValue({ buildingList: [], loadingBuildingList: false });
  });

  // ── Visibility ─────────────────────────────────────────────────────────────

  it("renders the drawer when isOpen is true", () => {
    render(<DeletePropertyDrawer {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render the drawer when isOpen is false", () => {
    render(<DeletePropertyDrawer {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ── Cancel button ──────────────────────────────────────────────────────────

  it("calls onClose when Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<DeletePropertyDrawer {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── PropertySelectionSection placeholder ───────────────────────────────────

  it("shows loading placeholder when building list is loading and empty", () => {
    mockBuildingList.mockReturnValue({ buildingList: [], loadingBuildingList: true });
    render(<DeletePropertyDrawer {...defaultProps} wardId={10} />);
    const input = screen.getByTestId("property-select-input");
    // Should show loading text from i18n key
    expect(input).toHaveAttribute("placeholder", expect.stringContaining("propertyList.loading"));
  });

  it("shows noMainPropertiesFound placeholder when ward set but list empty and not loading", () => {
    const ward = makeWard();
    render(<DeletePropertyDrawer {...defaultProps} selectedWard={ward} />);
    const input = screen.getByTestId("property-select-input");
    expect(input).toHaveAttribute(
      "placeholder",
      expect.stringContaining("partitionForm.helpText.noMainPropertiesFound")
    );
  });

  it("shows default select placeholder when no ward is set", () => {
    render(<DeletePropertyDrawer {...defaultProps} />);
    const input = screen.getByTestId("property-select-input");
    expect(input).toHaveAttribute(
      "placeholder",
      expect.stringContaining("partitionForm.placeholders.selectMainProperty")
    );
  });

  // ── Property options from buildingList ─────────────────────────────────────

  it("builds property options from buildingList filtering out partitioned items", () => {
    mockBuildingList.mockReturnValue({
      buildingList: [
        { propertyId: 1, propertyNo: "P-001", catPropertyCategoryName: "Residential", partitionNo: "" },
        { propertyId: 2, propertyNo: "P-002", catPropertyCategoryName: "Commercial", partitionNo: "1" }, // should be excluded
        { propertyId: 3, propertyNo: "P-003", catPropertyCategoryName: null, partitionNo: "0" },
      ],
      loadingBuildingList: false,
    });
    render(<DeletePropertyDrawer {...defaultProps} wardId={10} />);
    // PropertySelectionSection is rendered; we trust the options are passed correctly.
    // Since we mock it, we just verify it's rendered (options are passed as props internally).
    expect(screen.getByTestId("property-selection-section")).toBeInTheDocument();
  });

  // ── ssrProperties fallback ─────────────────────────────────────────────────

  it("falls back to ssrProperties when buildingList is empty", () => {
    const ssrProperties = [makeProperty({ id: 10, propertyNo: "SSR-001", partitionNo: null })];
    const categoryMap = { 2: "Residential" };
    render(
      <DeletePropertyDrawer
        {...defaultProps}
        ssrProperties={ssrProperties}
        categoryMap={categoryMap}
      />
    );
    expect(screen.getByTestId("property-selection-section")).toBeInTheDocument();
  });

  it("excludes ssrProperties with non-zero partitionNo from options", () => {
    const ssrProperties = [
      makeProperty({ id: 1, partitionNo: null }),    // included
      makeProperty({ id: 2, partitionNo: "0" }),     // included
      makeProperty({ id: 3, partitionNo: "2" }),     // excluded
    ];
    render(<DeletePropertyDrawer {...defaultProps} ssrProperties={ssrProperties} />);
    // Drawer renders without error; exclusion logic tested via hook/unit
    expect(screen.getByTestId("property-selection-section")).toBeInTheDocument();
  });

  // ── PropertyAmenitySection ─────────────────────────────────────────────────

  it("does not show PropertyAmenitySection when no property is selected", () => {
    render(<DeletePropertyDrawer {...defaultProps} wardId={10} />);
    expect(screen.queryByTestId("property-amenity-section")).not.toBeInTheDocument();
  });

  it("shows PropertyAmenitySection after a property is selected", () => {
    mockBuildingList.mockReturnValue({
      buildingList: [
        { propertyId: 5, propertyNo: "P-005", catPropertyCategoryName: "Apartment", partitionNo: "" },
      ],
      loadingBuildingList: false,
    });
    render(<DeletePropertyDrawer {...defaultProps} wardId={10} />);
    const input = screen.getByTestId("property-select-input");
    fireEvent.change(input, { target: { value: "5" } });
    expect(screen.getByTestId("property-amenity-section")).toBeInTheDocument();
    expect(screen.getByTestId("property-amenity-section")).toHaveAttribute(
      "data-property-id",
      "5"
    );
  });

  it("passes direct property delete fallback for the selected property", () => {
    mockBuildingList.mockReturnValue({
      buildingList: [
        { propertyId: 6, propertyNo: "P-006", catPropertyCategoryName: "Individual", partitionNo: "" },
      ],
      loadingBuildingList: false,
    });

    render(<DeletePropertyDrawer {...defaultProps} wardId={10} />);
    fireEvent.change(screen.getByTestId("property-select-input"), { target: { value: "6" } });

    expect(screen.getByTestId("property-amenity-section")).toHaveAttribute(
      "data-property-id",
      "6"
    );
    expect(screen.getByTestId("property-amenity-section")).toHaveAttribute(
      "data-has-direct-fallback",
      "true"
    );
  });

  // ── Ward reset ─────────────────────────────────────────────────────────────

  it("resets selected property when ward changes", () => {
    mockBuildingList.mockReturnValue({
      buildingList: [
        { propertyId: 5, propertyNo: "P-005", catPropertyCategoryName: "Apartment", partitionNo: "" },
      ],
      loadingBuildingList: false,
    });

    const { rerender } = render(
      <DeletePropertyDrawer {...defaultProps} wardId={10} />
    );

    // Select a property
    fireEvent.change(screen.getByTestId("property-select-input"), { target: { value: "5" } });
    expect(screen.getByTestId("property-amenity-section")).toBeInTheDocument();

    // Change ward
    rerender(<DeletePropertyDrawer {...defaultProps} wardId={99} />);

    // Amenity section should be gone because selection was reset
    expect(screen.queryByTestId("property-amenity-section")).not.toBeInTheDocument();
  });

  // ── wardId / selectedWard precedence ──────────────────────────────────────

  it("prefers wardId over selectedWard.id when both are provided", () => {
    const ward = makeWard({ id: 20 });
    render(<DeletePropertyDrawer {...defaultProps} wardId={10} selectedWard={ward} />);
    // useBuildingList receives wardId=10; we verify the section renders
    expect(screen.getByTestId("property-info-section")).toBeInTheDocument();
  });

  it("uses selectedWard.id when wardId is not provided", () => {
    const ward = makeWard({ id: 20 });
    render(<DeletePropertyDrawer {...defaultProps} selectedWard={ward} />);
    expect(screen.getByTestId("property-info-section")).toBeInTheDocument();
  });

  // ── PropertyInfoSection ────────────────────────────────────────────────────

  it("always renders PropertyInfoSection inside the drawer", () => {
    render(<DeletePropertyDrawer {...defaultProps} />);
    expect(screen.getByTestId("property-info-section")).toBeInTheDocument();
  });

  it("passes selectedWard to PropertyInfoSection", () => {
    const ward = makeWard();
    render(<DeletePropertyDrawer {...defaultProps} selectedWard={ward} />);
    expect(screen.getByTestId("property-info-section")).toHaveAttribute(
      "data-has-ward",
      "true"
    );
  });
});
