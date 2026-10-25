import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CitizenServicesGrid from "@/components/modules/water-bill/portal/components/CitizenServicesGrid";
import { mockCitizenServices, mockPortalConfig } from "./portalTestFixtures";

const t = (en: string, _local: string) => en;

// jsdom implements neither matchMedia nor IntersectionObserver; the component
// only touches them inside an effect gated on window being defined, so a
// minimal stand-in is enough to let that effect run without throwing.
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

describe("CitizenServicesGrid Component", () => {
  it("renders nothing when showCitizenServices is false", () => {
    const config = {
      ...mockPortalConfig,
      sectionSettings: { ...mockPortalConfig.sectionSettings, showCitizenServices: false },
    };
    const { container } = render(
      <CitizenServicesGrid config={config} lang="en" t={t} services={mockCitizenServices} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no services", () => {
    const { container } = render(<CitizenServicesGrid config={mockPortalConfig} lang="en" t={t} services={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the section title and every service twice (carousel + grid)", () => {
    render(<CitizenServicesGrid config={mockPortalConfig} lang="en" t={t} services={mockCitizenServices} />);

    expect(screen.getByText("Online Water Services")).toBeInTheDocument();
    expect(screen.getAllByText("Pay Water Bill")).toHaveLength(2);
    expect(screen.getAllByText("Apply for New Connection")).toHaveLength(2);
  });

  it("links each service tile to its referenceLink", () => {
    render(<CitizenServicesGrid config={mockPortalConfig} lang="en" t={t} services={mockCitizenServices} />);

    const links = screen.getAllByText("Pay Water Bill").map((el) => el.closest("a"));
    expect(links[0]).toHaveAttribute("href", "/water-bill/payment");
  });

  it("renders carousel pagination dots when there is more than one service", () => {
    render(<CitizenServicesGrid config={mockPortalConfig} lang="en" t={t} services={mockCitizenServices} />);

    expect(screen.getByRole("button", { name: "Go to slide 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to slide 2" })).toBeInTheDocument();
  });
});
