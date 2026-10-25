import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { SortableColumnHeader, type SortableColumnHeaderProps, type SortDirection } from "@/components/common/SortableColumnHeader";

describe("SortableColumnHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with label", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Column Name"
        onSort={handleSort}
      />
    );
    
    expect(screen.getByText("Column Name")).toBeInTheDocument();
  });

  it("renders as a button when sortable (default)", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Sortable Column"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Sortable Column");
  });

  it("renders as a span when sortable is false", () => {
    render(
      <SortableColumnHeader
        label="Non-Sortable Column"
        sortable={false}
      />
    );
    
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Non-Sortable Column")).toBeInTheDocument();
  });

  it("calls onSort when clicked", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Clickable"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(handleSort).toHaveBeenCalledTimes(1);
  });

  it("does not call onSort when sortable is false", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Non-Clickable"
        sortable={false}
        onSort={handleSort}
      />
    );
    
    const span = screen.getByText("Non-Clickable");
    fireEvent.click(span);
    
    expect(handleSort).not.toHaveBeenCalled();
  });

  it("shows ArrowUpDown icon when sortDirection is null", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Unsorted"
        sortDirection={null}
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("shows ArrowUp icon when sortDirection is asc", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Ascending"
        sortDirection="asc"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("shows ArrowDown icon when sortDirection is desc", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Descending"
        sortDirection="desc"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders with xs size by default", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Default Size"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-2");
    expect(button).toHaveClass("py-1");
  });

  it("renders with sm size", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Small Size"
        onSort={handleSort}
        size="sm"
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-2.5");
    expect(button).toHaveClass("py-1.5");
  });

  it("renders with md size", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Medium Size"
        onSort={handleSort}
        size="md"
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-3");
    expect(button).toHaveClass("py-2");
  });

  it("accepts custom className", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Custom Class"
        onSort={handleSort}
        className="custom-test-class"
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-test-class");
  });

  it("applies correct styling for sortable button", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Styled Button"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-gray-100");
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("rounded");
  });

  it("applies correct styling for non-sortable span", () => {
    render(
      <SortableColumnHeader
        label="Styled Span"
        sortable={false}
      />
    );
    
    const span = screen.getByText("Styled Span");
    expect(span).toHaveClass("text-gray-700");
  });

  it("has correct button type attribute", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Button Type"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("toggles sort direction on multiple clicks", () => {
    const handleSort = vi.fn();
    const { rerender } = render(
      <SortableColumnHeader
        label="Toggle Sort"
        sortDirection={null}
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    
    // First click - should call handler
    fireEvent.click(button);
    expect(handleSort).toHaveBeenCalledTimes(1);
    
    // Rerender with asc
    rerender(
      <SortableColumnHeader
        label="Toggle Sort"
        sortDirection="asc"
        onSort={handleSort}
      />
    );
    
    // Second click
    fireEvent.click(button);
    expect(handleSort).toHaveBeenCalledTimes(2);
    
    // Rerender with desc
    rerender(
      <SortableColumnHeader
        label="Toggle Sort"
        sortDirection="desc"
        onSort={handleSort}
      />
    );
    
    expect(screen.getByText("Toggle Sort")).toBeInTheDocument();
  });

  it("renders icon with correct size for each size variant", () => {
    const handleSort = vi.fn();
    const sizes: Array<SortableColumnHeaderProps["size"]> = ["xs", "sm", "md"];
    
    sizes.forEach((size) => {
      cleanup();
      render(
        <SortableColumnHeader
          label={`Size ${size}`}
          onSort={handleSort}
          size={size}
        />
      );
      
      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  it("renders with all sort directions", () => {
    const handleSort = vi.fn();
    const directions: SortDirection[] = [null, "asc", "desc"];
    
    directions.forEach((direction) => {
      cleanup();
      render(
        <SortableColumnHeader
          label={`Sort ${direction || "none"}`}
          sortDirection={direction}
          onSort={handleSort}
        />
      );
      
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  it("has hover effect on sortable button", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Hover Effect"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-gray-200");
  });

  it("has focus ring on sortable button", () => {
    const handleSort = vi.fn();
    render(
      <SortableColumnHeader
        label="Focus Ring"
        onSort={handleSort}
      />
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("focus:ring-1");
    expect(button).toHaveClass("focus:ring-blue-500");
  });
});
