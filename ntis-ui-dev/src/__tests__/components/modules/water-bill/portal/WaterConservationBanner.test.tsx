import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import WaterConservationBanner from "@/components/modules/water-bill/portal/components/WaterConservationBanner";

const t = (en: string, _local: string) => en;

describe("WaterConservationBanner Component", () => {
  it("renders the Save Water heading split across two spans", () => {
    render(<WaterConservationBanner t={t} />);

    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Water")).toBeInTheDocument();
  });

  it("renders the conservation description and tagline", () => {
    render(<WaterConservationBanner t={t} />);

    expect(
      screen.getByText("Save Panvel. Use water wisely today to secure a sustainable tomorrow.")
    ).toBeInTheDocument();
    expect(screen.getByText("Every drop matters")).toBeInTheDocument();
  });

  it("applies the given footerColor to the gradient background", () => {
    const { container } = render(<WaterConservationBanner t={t} footerColor="#123456" />);
    const section = container.querySelector('section[aria-label="Water conservation"]');

    expect(section?.getAttribute("style")).toContain("#123456");
  });
});
