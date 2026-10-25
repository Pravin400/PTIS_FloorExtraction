import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Portal from "@/components/modules/water-bill/portal/Portal";
import { mockCitizenServices, mockPortalConfig, mockPortalContentItems } from "./portalTestFixtures";
import type { PortalContentGrouped } from "@/types/water-bill/portalContent.types";

vi.mock("next/image", () => ({
  default: ({ alt = "", ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...rest} />
  ),
}));

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

const mockContent: PortalContentGrouped = {
  updates: mockPortalContentItems.filter((i) => i.contentType === "LATEST_UPDATE"),
  announcements: mockPortalContentItems.filter((i) => i.contentType === "ANNOUNCEMENT"),
  importantLinks: mockPortalContentItems.filter((i) => i.contentType === "IMPORTANT_LINK"),
};

describe("Portal Component", () => {
  it("renders the header, hero, and footer sections", () => {
    render(<Portal config={mockPortalConfig} content={mockContent} citizenServices={mockCitizenServices} />);

    expect(screen.getAllByText(mockPortalConfig.contact.email).length).toBeGreaterThan(0);
    expect(screen.getByText("Water Bill Services")).toBeInTheDocument();
    expect(screen.getByText("Copyright © 2026 Panvel Municipal Corporation. All Rights Reserved.")).toBeInTheDocument();
  });

  it("renders citizen services, announcements, and important links from content", () => {
    render(<Portal config={mockPortalConfig} content={mockContent} citizenServices={mockCitizenServices} />);

    expect(screen.getAllByText("Pay Water Bill").length).toBeGreaterThan(0);
    expect(screen.getByText("Online Water Bill Payment Facility is Now Available")).toBeInTheDocument();
    expect(screen.getByText("Water Tariff Details")).toBeInTheDocument();
  });

  it("switches language when the header language toggle is used", async () => {
    const user = userEvent.setup();
    render(<Portal config={mockPortalConfig} content={mockContent} citizenServices={mockCitizenServices} />);

    expect(screen.getByText("Water Bill Services")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch language" }));

    expect(screen.getByText("पाणी बिल सेवा")).toBeInTheDocument();
  });
});
