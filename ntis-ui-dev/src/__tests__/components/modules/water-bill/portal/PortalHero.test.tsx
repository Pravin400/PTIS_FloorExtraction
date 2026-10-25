import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import PortalHero from "@/components/modules/water-bill/portal/components/PortalHero";
import { mockPortalConfig } from "./portalTestFixtures";

const t = (en: string, _local: string) => en;

describe("PortalHero Component", () => {
  it("renders the hero title and subtitle", () => {
    render(<PortalHero config={mockPortalConfig} lang="en" t={t} />);

    expect(screen.getByText("Water Bill Services")).toBeInTheDocument();
    expect(screen.getByText("Safe Water | Efficient Services | Clean Panvel")).toBeInTheDocument();
  });

  it("renders every hero feature sorted by displayOrder", () => {
    render(<PortalHero config={mockPortalConfig} lang="en" t={t} />);

    expect(screen.getByText("Reliable Water Supply")).toBeInTheDocument();
    expect(screen.getByText("Sustainable Infrastructure")).toBeInTheDocument();
  });

  it("renders a <video> element when backgroundMediaType is video with a source", () => {
    const videoConfig = {
      ...mockPortalConfig,
      hero: {
        ...mockPortalConfig.hero,
        backgroundMediaType: "video" as const,
        backgroundVideoSrc: "/videos/water-banner.mp4",
      },
    };

    const { container } = render(<PortalHero config={videoConfig} lang="en" t={t} />);

    expect(container.querySelector("video")).toBeInTheDocument();
    expect(container.querySelector("source")).toHaveAttribute("src", "/videos/water-banner.mp4");
  });
});
