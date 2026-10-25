import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import AnnouncementsCard from "@/components/modules/water-bill/portal/components/AnnouncementsCard";
import { mockPortalConfig } from "./portalTestFixtures";
import type { PortalAnnouncementItem } from "@/types/water-bill/portal.types";

const t = (en: string, _local: string) => en;

function buildAnnouncements(count: number): PortalAnnouncementItem[] {
  return Array.from({ length: count }, (_, i) => ({
    date: String(10 + i),
    month: "Sep 2026",
    isNew: i === 0,
    title: `Announcement ${i + 1}`,
    desc: `Description ${i + 1}`,
  }));
}

describe("AnnouncementsCard Component", () => {
  it("renders nothing when showAnnouncements is false", () => {
    const config = {
      ...mockPortalConfig,
      sectionSettings: { ...mockPortalConfig.sectionSettings, showAnnouncements: false },
    };
    const { container } = render(
      <AnnouncementsCard config={config} lang="en" t={t} announcements={buildAnnouncements(2)} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the New badge only for announcements flagged isNew", () => {
    render(<AnnouncementsCard config={mockPortalConfig} lang="en" t={t} announcements={buildAnnouncements(2)} />);

    expect(screen.getByText("Announcement 1")).toBeInTheDocument();
    expect(screen.getByText("Announcement 2")).toBeInTheDocument();
    expect(screen.getAllByText("New")).toHaveLength(1);
  });

  it("does not show the View All toggle when there are 4 or fewer announcements", () => {
    render(<AnnouncementsCard config={mockPortalConfig} lang="en" t={t} announcements={buildAnnouncements(4)} />);
    expect(screen.queryByText(/View All/)).not.toBeInTheDocument();
  });

  it("caps the list at 4 by default and expands on toggle", async () => {
    const user = userEvent.setup();
    render(<AnnouncementsCard config={mockPortalConfig} lang="en" t={t} announcements={buildAnnouncements(6)} />);

    expect(screen.queryByText("Announcement 5")).not.toBeInTheDocument();

    const toggle = screen.getByText("View All (6)");
    await user.click(toggle);

    expect(screen.getByText("Announcement 5")).toBeInTheDocument();
    expect(screen.getByText("Show Less")).toBeInTheDocument();
  });
});
