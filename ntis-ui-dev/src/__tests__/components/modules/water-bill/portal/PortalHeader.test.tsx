import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import PortalHeader from "@/components/modules/water-bill/portal/components/PortalHeader";
import { mockPortalConfig } from "./portalTestFixtures";

vi.mock("next/image", () => ({
  default: ({ alt = "", ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...rest} />
  ),
}));

const t = (en: string, _local: string) => en;

describe("PortalHeader Component", () => {
  it("renders the portal title and contact details", () => {
    render(<PortalHeader config={mockPortalConfig} lang="en" t={t} onToggleLanguage={vi.fn()} />);

    // Email/helpline render once in the desktop contact block and once in the mobile drawer.
    expect(screen.getAllByText(mockPortalConfig.contact.email).length).toBeGreaterThan(0);
    expect(screen.getAllByText(mockPortalConfig.contact.helplineNo).length).toBeGreaterThan(0);
  });

  it("renders every navigation item", () => {
    render(<PortalHeader config={mockPortalConfig} lang="en" t={t} onToggleLanguage={vi.fn()} />);

    const homeLinks = screen.getAllByText("Home");
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(screen.getAllByText("About Us").length).toBeGreaterThan(0);
  });

  it("hides the Admin Login link when showAdminLogin is false", () => {
    const config = { ...mockPortalConfig, header: { ...mockPortalConfig.header, showAdminLogin: false } };
    render(<PortalHeader config={config} lang="en" t={t} onToggleLanguage={vi.fn()} />);

    expect(screen.queryByText("Admin Login")).not.toBeInTheDocument();
  });

  it("calls onToggleLanguage when the language switch is clicked", async () => {
    const onToggleLanguage = vi.fn();
    const user = userEvent.setup();
    render(<PortalHeader config={mockPortalConfig} lang="en" t={t} onToggleLanguage={onToggleLanguage} />);

    await user.click(screen.getByRole("button", { name: "Switch language" }));
    expect(onToggleLanguage).toHaveBeenCalledTimes(1);
  });

  it("opens the mobile drawer when the hamburger button is clicked", async () => {
    const user = userEvent.setup();
    render(<PortalHeader config={mockPortalConfig} lang="en" t={t} onToggleLanguage={vi.fn()} />);

    const openButton = screen.getByRole("button", { name: "Open menu" });
    await user.click(openButton);

    expect(openButton).toHaveAttribute("aria-expanded", "true");
  });
});
