import { Info } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "@/components/common/StatusBadge";

describe("StatusBadge", () => {

  describe("info variant", () => {
    it("renders with label and icon", () => {
      render(<StatusBadge variant="info" label="Info Label" icon={<Info data-testid="info-icon" />} className="custom-info" />);
      const labelSpan = screen.getByText("Info Label");
      const badge = labelSpan.parentElement;
      expect(badge).toHaveClass("bg-[#e3f0fd]");
      expect(badge).toHaveClass("text-blue-700");
      expect(badge).toHaveClass("border-[#e0e7ef]");
      expect(badge).toHaveClass("custom-info");
      expect(labelSpan).toBeInTheDocument();
      expect(screen.getByTestId("info-icon")).toBeInTheDocument();
      // Icon should be inside a span with w-4 h-4
      const iconWrapper = badge?.querySelector(".w-4.h-4");
      expect(iconWrapper).toBeInTheDocument();
    });
    it("renders with label only (no icon)", () => {
      render(<StatusBadge variant="info" label="Info Only" />);
      const labelSpan = screen.getByText("Info Only");
      const badge = labelSpan.parentElement;
      expect(badge).toHaveClass("bg-[#e3f0fd]");
      expect(labelSpan).toBeInTheDocument();
      // Should not render icon span
      expect(badge?.querySelector(".w-4.h-4")).not.toBeInTheDocument();
    });
  });

  describe("pending variant", () => {
    it("renders with default label and animated dot", () => {
      render(<StatusBadge variant="pending" className="custom-pending" />);
      const labelSpan = screen.getByText("Pending");
      const badge = labelSpan.parentElement;
      expect(badge).toHaveClass("bg-amber-50");
      expect(badge).toHaveClass("text-amber-700");
      expect(badge).toHaveClass("border-amber-300");
      expect(badge).toHaveClass("custom-pending");
      expect(labelSpan).toBeInTheDocument();
      // Should render the animated dot (by class)
      expect(badge?.querySelector(".animate-ping")).toBeInTheDocument();
      // Should not render icon span
      expect(badge?.querySelector(".w-3.h-3")).not.toBeInTheDocument();
    });
    it("renders with custom label and icon", () => {
      render(<StatusBadge variant="pending" label="Waiting" icon={<Info data-testid="pending-icon" />} />);
      const labelSpan = screen.getByText("Waiting");
      const badge = labelSpan.parentElement;
      expect(badge).toHaveClass("bg-amber-50");
      expect(labelSpan).toBeInTheDocument();
      expect(screen.getByTestId("pending-icon")).toBeInTheDocument();
      // Icon should be inside a span with w-3 h-3
      const iconWrapper = badge?.querySelector(".w-3.h-3");
      expect(iconWrapper).toBeInTheDocument();
      // Should not render animated dot
      expect(badge?.querySelector(".animate-ping")).not.toBeInTheDocument();
    });
  });
  it("renders active status with default label", () => {
    render(<StatusBadge value="active" />);
    const badge = screen.getByText("Active").closest('span');
    expect(badge).toHaveClass("bg-emerald-50");
  });

  it("renders inactive status with default label", () => {
    render(<StatusBadge value="inactive" />);
    const badge = screen.getByText("Inactive").closest('span');
    expect(badge).toHaveClass("bg-rose-50");
  });

  it("renders custom active/inactive labels", () => {
    render(<StatusBadge value="active" activeLabel="Enabled" inactiveLabel="Disabled" />);
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    // Render separately for inactive
    render(<StatusBadge value="inactive" activeLabel="Enabled" inactiveLabel="Disabled" />);
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("handles numeric value 1 as active", () => {
    render(<StatusBadge value={1} />);
    const badge = screen.getByText("Active").closest('span');
    expect(badge).toHaveClass("bg-emerald-50");
  });

  it("handles boolean true as active", () => {
    render(<StatusBadge value={true} />);
    const badge = screen.getByText("Active").closest('span');
    expect(badge).toHaveClass("bg-emerald-50");
  });

  it("handles numeric value 0 as inactive", () => {
    render(<StatusBadge value={0} />);
    const badge = screen.getByText("Inactive").closest('span');
    expect(badge).toHaveClass("bg-rose-50");
  });

  it("handles boolean false as inactive", () => {
    render(<StatusBadge value={false} />);
    const badge = screen.getByText("Inactive").closest('span');
    expect(badge).toHaveClass("bg-rose-50");
  });

  it("renders correct icon for active", () => {
    render(<StatusBadge value="active" />);
    const badge = screen.getByText("Active").closest('span');
    const icon = badge?.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("w-3");
  });

  it("renders correct icon for inactive", () => {
    render(<StatusBadge value="inactive" />);
    const badge = screen.getByText("Inactive").closest('span');
    const icon = badge?.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("w-3");
  });
});
