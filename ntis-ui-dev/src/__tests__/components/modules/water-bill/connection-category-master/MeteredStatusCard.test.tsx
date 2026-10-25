import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MeteredStatusCard } from "@/components/modules/water-bill/connection-category-master/MeteredStatusCard";

describe("MeteredStatusCard Component", () => {
  it("renders metered on state correctly", () => {
    const handleChange = vi.fn();
    render(
      <MeteredStatusCard
        isMetered={true}
        onChange={handleChange}
        title="Metered Status"
        onLabel="Metered - Connection has a meter"
        offLabel="Non-Metered - Flat rate"
      />
    );

    expect(screen.getByText("Metered Status")).toBeInTheDocument();
    expect(screen.getByText("Metered - Connection has a meter")).toBeInTheDocument();
  });

  it("renders non-metered off state correctly", () => {
    const handleChange = vi.fn();
    render(
      <MeteredStatusCard
        isMetered={false}
        onChange={handleChange}
        title="Metered Status"
        onLabel="Metered - Connection has a meter"
        offLabel="Non-Metered - Flat rate"
      />
    );

    expect(screen.getByText("Metered Status")).toBeInTheDocument();
    expect(screen.getByText("Non-Metered - Flat rate")).toBeInTheDocument();
  });

  it("triggers onChange when metered switch is clicked", () => {
    const handleChange = vi.fn();
    render(
      <MeteredStatusCard
        isMetered={true}
        onChange={handleChange}
        title="Metered Status"
        onLabel="Metered"
        offLabel="Non-Metered"
      />
    );

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(false);
  });
});
