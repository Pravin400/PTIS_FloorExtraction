import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import PortalNavItem from "@/components/modules/water-bill/portal/components/PortalNavItem";
import type { PortalNavigationItem } from "@/types/water-bill/portalConfig.types";

const t = (en: string, _local: string) => en;

const leafItem: PortalNavigationItem = {
  code: "HOME",
  title: "Home",
  titleLocal: "मुख्यपृष्ठ",
  icon: "home",
  url: "/",
  displayOrder: 1,
  openInNewTab: false,
};

const parentItem: PortalNavigationItem = {
  code: "ABOUT",
  title: "About Us",
  titleLocal: "आमच्याबद्दल",
  icon: null,
  url: "/about-us",
  displayOrder: 2,
  openInNewTab: false,
  children: [
    { title: "Our History", titleLocal: "आमचा इतिहास", url: "/about-us/history", displayOrder: 1 },
    { title: "Vision & Mission", titleLocal: "दृष्टी आणि ध्येय", url: "/about-us/vision-mission", displayOrder: 2 },
  ],
};

describe("PortalNavItem Component", () => {
  it("renders a plain link for an item without children (desktop variant)", () => {
    render(
      <ul>
        <PortalNavItem item={leafItem} t={t} variant="desktop" />
      </ul>
    );

    const link = screen.getByText("Home").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  it("does not navigate immediately when a parent item with children is clicked (desktop)", () => {
    render(
      <ul>
        <PortalNavItem item={parentItem} t={t} variant="desktop" />
      </ul>
    );

    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.queryByText("Our History")).toBeInTheDocument();
  });

  it("expands child links on tap in the mobile variant", async () => {
    const user = userEvent.setup();
    render(
      <ul>
        <PortalNavItem item={parentItem} t={t} variant="mobile" />
      </ul>
    );

    const toggleButton = screen.getByRole("button", { name: "Expand About Us submenu" });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Our History")).toBeInTheDocument();
  });

  it("calls onNavigate when a leaf link is clicked in the mobile variant", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <ul>
        <PortalNavItem item={leafItem} t={t} variant="mobile" onNavigate={onNavigate} />
      </ul>
    );

    await user.click(screen.getByText("Home"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
