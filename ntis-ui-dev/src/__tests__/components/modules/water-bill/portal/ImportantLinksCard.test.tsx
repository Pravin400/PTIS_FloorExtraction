import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import ImportantLinksCard from "@/components/modules/water-bill/portal/components/ImportantLinksCard";
import { mockPortalConfig, mockPortalContentItems } from "./portalTestFixtures";
import type { PortalContentItem } from "@/types/water-bill/portalContent.types";

const t = (en: string, _local: string) => en;

const baseLink = mockPortalContentItems.find((i) => i.contentType === "IMPORTANT_LINK")!;

function buildLinks(count: number): PortalContentItem[] {
  return Array.from({ length: count }, (_, i) => ({
    ...baseLink,
    id: i + 1,
    title: `Link ${i + 1}`,
    displayOrder: i + 1,
  }));
}

describe("ImportantLinksCard Component", () => {
  it("renders nothing when showImportantLinks is false", () => {
    const config = {
      ...mockPortalConfig,
      sectionSettings: { ...mockPortalConfig.sectionSettings, showImportantLinks: false },
    };
    const { container } = render(<ImportantLinksCard config={config} lang="en" t={t} links={buildLinks(2)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no links", () => {
    const { container } = render(<ImportantLinksCard config={mockPortalConfig} lang="en" t={t} links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders link titles as anchors pointing at referenceLink", () => {
    render(<ImportantLinksCard config={mockPortalConfig} lang="en" t={t} links={buildLinks(2)} />);

    const link = screen.getByText("Link 1").closest("a");
    expect(link).toHaveAttribute("href", baseLink.referenceLink);
  });

  it("caps the grid at 6 by default and expands on toggle", async () => {
    const user = userEvent.setup();
    render(<ImportantLinksCard config={mockPortalConfig} lang="en" t={t} links={buildLinks(8)} />);

    expect(screen.queryByText("Link 7")).not.toBeInTheDocument();

    await user.click(screen.getByText("View All (8)"));

    expect(screen.getByText("Link 7")).toBeInTheDocument();
    expect(screen.getByText("Show Less")).toBeInTheDocument();
  });
});
