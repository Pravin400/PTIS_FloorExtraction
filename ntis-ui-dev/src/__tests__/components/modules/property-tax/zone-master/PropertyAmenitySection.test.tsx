import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyAmenitySection } from "@/components/modules/property-tax/zone-master/properties/components/PropertyAmenitySection";
import {
  fetchSocietyDetailsByPropertyAction,
  getSocietyAmenityDetailsAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@/lib/providers/AliasLabelsProvider", () => ({
  useAliasLabel: vi.fn((_name: string, fallback: string) => fallback),
}));

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  fetchSocietyDetailsByPropertyAction: vi.fn(),
  getSocietyAmenityDetailsAction: vi.fn(),
  deletePropertyAmenityAction: vi.fn(),
  deleteMultiplePropertiesAmenitiesAction: vi.fn(),
}));

describe("PropertyAmenitySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSocietyAmenityDetailsAction).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it("renders directDeleteFallback when property has societyDetails but no wings (apartment with wingId: null)", async () => {
    const mockApartmentSocietyWithoutWings: SocietyDetailItem[] = [
      {
        id: 10,
        propertyId: 1,
        wingId: null,
        wingName: null,
        societyName: "Gokuldham",
        societyAddress: "",
        secretaryName: "",
        managerName: "",
        landOwnerName: "",
        builderName: "",
        secretaryNameEnglish: "",
        societyNameEnglish: "",
        societyAddressEnglish: "",
        managerNameEnglish: "",
        landOwnerNameEnglish: "",
        builderNameEnglish: "",
        managerMobileNo: "",
        secretaryMobileNo: "",
        societyEmailId: "",
        secretaryEmailId: "",
        managerEmailId: "",
        markedForDeletion: false,
        isActive: true,
        createdDate: "2024-01-01T00:00:00Z",
        updatedDate: null,
      },
    ];

    vi.mocked(fetchSocietyDetailsByPropertyAction).mockResolvedValue({
      success: true,
      data: {
        items: mockApartmentSocietyWithoutWings,
        totalCount: 1,
        pageSize: 10,
        pageNumber: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    render(
      <PropertyAmenitySection
        propertyId="1"
        directDeleteFallback={<div data-testid="direct-delete-fallback">Direct Delete Section</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("direct-delete-fallback")).toBeInTheDocument();
    });

    // Should not render wings section when falling back
    expect(screen.queryByText("createProperty.wings")).not.toBeInTheDocument();
  });

  it("renders directDeleteFallback when societyDetails is empty", async () => {
    vi.mocked(fetchSocietyDetailsByPropertyAction).mockResolvedValue({
      success: true,
      data: {
        items: [],
        totalCount: 0,
        pageSize: 10,
        pageNumber: 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    });

    render(
      <PropertyAmenitySection
        propertyId="2"
        directDeleteFallback={<div data-testid="direct-delete-fallback">Direct Delete Section</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("direct-delete-fallback")).toBeInTheDocument();
    });
  });

  it("renders wings section when property has valid wings", async () => {
    const mockApartmentWithWings: SocietyDetailItem[] = [
      {
        id: 11,
        propertyId: 3,
        wingId: 1,
        wingName: "Wing A",
        societyName: "Gokuldham",
        societyAddress: "",
        secretaryName: "",
        managerName: "",
        landOwnerName: "",
        builderName: "",
        secretaryNameEnglish: "",
        societyNameEnglish: "",
        societyAddressEnglish: "",
        managerNameEnglish: "",
        landOwnerNameEnglish: "",
        builderNameEnglish: "",
        managerMobileNo: "",
        secretaryMobileNo: "",
        societyEmailId: "",
        secretaryEmailId: "",
        managerEmailId: "",
        markedForDeletion: false,
        isActive: true,
        createdDate: "2024-01-01T00:00:00Z",
        updatedDate: null,
      },
    ];

    vi.mocked(fetchSocietyDetailsByPropertyAction).mockResolvedValue({
      success: true,
      data: {
        items: mockApartmentWithWings,
        totalCount: 1,
        pageSize: 10,
        pageNumber: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    render(
      <PropertyAmenitySection
        propertyId="3"
        directDeleteFallback={<div data-testid="direct-delete-fallback">Direct Delete Section</div>}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("createProperty.wings")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("direct-delete-fallback")).not.toBeInTheDocument();
  });
});
