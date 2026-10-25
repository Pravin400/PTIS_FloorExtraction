import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import UpdatesTicker from "@/components/modules/water-bill/portal/components/UpdatesTicker";
import { mockPortalConfig } from "./portalTestFixtures";

const t = (en: string, _local: string) => en;

const updates = [
  { tag: "New", text: "Online Water Bill Payment facility is now available" },
  { tag: "New", text: "Revised Water Tariff for FY 2026-27" },
];

describe("UpdatesTicker Component", () => {
  it("renders nothing when showLatestUpdates is false", () => {
    const config = {
      ...mockPortalConfig,
      sectionSettings: { ...mockPortalConfig.sectionSettings, showLatestUpdates: false },
    };
    const { container } = render(<UpdatesTicker config={config} lang="en" t={t} updates={updates} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no updates", () => {
    const { container } = render(<UpdatesTicker config={mockPortalConfig} lang="en" t={t} updates={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the latest updates label and update text", () => {
    render(<UpdatesTicker config={mockPortalConfig} lang="en" t={t} updates={updates} />);

    expect(screen.getAllByText("Latest Updates").length).toBeGreaterThan(0);
    // The marquee duplicates the list once for a seamless scroll loop, so each item appears twice.
    expect(screen.getAllByText("Online Water Bill Payment facility is now available").length).toBe(2);
    expect(screen.getAllByText("Revised Water Tariff for FY 2026-27").length).toBe(2);
  });

  it("toggles the play/pause control", async () => {
    const user = userEvent.setup();
    render(<UpdatesTicker config={mockPortalConfig} lang="en" t={t} updates={updates} />);

    const pauseButton = screen.getByRole("button", { name: "Pause" });
    await user.click(pauseButton);

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
});
