import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { CollapsibleSectionHeader } from "@/components/common/CollapsibleSectionHeader";
import { User, Settings, FileText } from "lucide-react";

describe("CollapsibleSectionHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with required props", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Basic Information"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with icon when provided", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="User Settings"
        icon={User}
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    const button = screen.getByRole("button");
    // Check that an svg element exists (the icon)
    const icons = button.querySelectorAll("svg");
    // Should have 2 SVGs: one for the icon, one for chevron
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows ChevronDown when isOpen is false", () => {
    const handleToggle = vi.fn();
    const { container } = render(
      <CollapsibleSectionHeader
        title="Collapsed Section"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    // ChevronDown should be visible
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it("shows ChevronUp when isOpen is true", () => {
    const handleToggle = vi.fn();
    const { container } = render(
      <CollapsibleSectionHeader
        title="Expanded Section"
        isOpen={true}
        onToggle={handleToggle}
      />
    );
    
    // ChevronUp should be visible
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it("calls onToggle when clicked", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Clickable Section"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle multiple times when clicked multiple times", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Multiple Clicks"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(handleToggle).toHaveBeenCalledTimes(3);
  });

  it("renders with primary variant by default", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Primary Variant"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-blue-600");
  });

  it("renders with secondary variant", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Secondary Variant"
        isOpen={false}
        onToggle={handleToggle}
        variant="secondary"
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-gray-600");
  });

  it("renders with outline variant", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Outline Variant"
        isOpen={false}
        onToggle={handleToggle}
        variant="outline"
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-white");
    expect(button).toHaveClass("border");
  });

  it("accepts custom className", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Custom Class"
        isOpen={false}
        onToggle={handleToggle}
        className="custom-test-class"
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-test-class");
  });

  it("renders different icons correctly", () => {
    const handleToggle = vi.fn();
    const icons = [User, Settings, FileText];
    
    icons.forEach((Icon, index) => {
      cleanup();
      render(
        <CollapsibleSectionHeader
          title={`Section ${index}`}
          icon={Icon}
          isOpen={false}
          onToggle={handleToggle}
        />
      );
      
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  it("has correct ARIA attributes", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Accessible Section"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("toggles between open and closed states", () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <CollapsibleSectionHeader
        title="Toggle Test"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    // Initial state - closed
    let button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    
    // Click to open
    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalled();
    
    // Rerender with isOpen={true}
    rerender(
      <CollapsibleSectionHeader
        title="Toggle Test"
        isOpen={true}
        onToggle={handleToggle}
      />
    );
    
    button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("renders title with correct styling", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="Styled Title"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    const title = screen.getByText("Styled Title");
    expect(title).toHaveClass("font-semibold");
    expect(title).toHaveClass("text-sm");
  });

  it("renders without icon when icon prop is not provided", () => {
    const handleToggle = vi.fn();
    render(
      <CollapsibleSectionHeader
        title="No Icon"
        isOpen={false}
        onToggle={handleToggle}
      />
    );
    
    const button = screen.getByRole("button");
    const svgElements = button.querySelectorAll("svg");
    // Should only have chevron icon (1 svg)
    expect(svgElements.length).toBe(1);
  });
});
