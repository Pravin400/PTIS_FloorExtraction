import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { RateTabsNavigation } from "@/components/modules/property-tax/RVRateMaster/RateTabsNavigation";

// Expose mockPush for assertions
export const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/en/property-tax/rvratemaster",
}));

const mockMessages = {
  ptis_RVRateMaster: {
    aliasFallback: {
      rateSection: "Rate Section",
      constructionType: "Construction Type",
      typeOfUse: "Type of Use",
      taxZone: "Tax Zone",
      category: "Category",
      mouja: "Mouja",
      zone: "Zone",
      zones: "Zones",
      use: "Use",
      assessment: "Assessment",
    },
    header: {
      rateableTab: "Rateable Value",
      capitalTab: "Capital Value",
      moujaTab: "Mouja Master",
      openplotTab: "Open Plot Rate Master",
      rateableTitle: "Rateable Value Rate Master",
      rateableDescription: "Manage rateable value rates",
      capitalTitle: "Capital Value Rate Master",
      capitalDescription: "Manage capital value rates",
      moujaTitle: "Mouja Rate Master",
      moujaDescription: "Manage mouja rates",
      openplotTitle: "Open Plot Title",
      openplotDescription: "Open Plot Description",
    },
  },
};

describe("RateTabsNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active tabs (Capital Value is hidden)", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateTabsNavigation />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Rateable Value")).toBeInTheDocument();
    expect(screen.getByText("Open Plot Rate Master")).toBeInTheDocument();
    // Capital Value tab is intentionally hidden until feature is implemented
    expect(screen.queryByText("Capital Value")).not.toBeInTheDocument();
  });

  it("shows Rateable Value as active on rvratemaster path", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateTabsNavigation />
      </NextIntlClientProvider>
    );

    const rateableTab = screen.getByText("Rateable Value").closest("button");
    expect(rateableTab).toHaveClass("text-blue-600");
  });

  it("navigates to Rateable Value when clicked", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateTabsNavigation />
      </NextIntlClientProvider>
    );

    const rateableTab = screen.getByText("Rateable Value");
    fireEvent.click(rateableTab);
    // Assert navigation was triggered with the expected URL
    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/rate-master/rvratemaster");
  });

  it("navigates to Open Plot Rate Master when clicked", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateTabsNavigation />
      </NextIntlClientProvider>
    );

    const openPlotTab = screen.getByText("Open Plot Rate Master");
    fireEvent.click(openPlotTab);
    // Assert navigation was triggered with the expected URL
    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/rate-master/openplot");
  });

  it("renders with proper styling", () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RateTabsNavigation />
      </NextIntlClientProvider>
    );

    const rateableTab = screen.getByText("Rateable Value").closest("button");
    
    expect(rateableTab).toHaveClass("px-4", "py-2");
  });
});
