import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button, type ButtonProps } from "@/components/common/ActionButton";
import type { LucideProps } from "lucide-react";

const DummyIcon = (props: LucideProps) => <svg data-testid="dummy-icon" {...props} />;

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with default props", () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-blue-600");
    expect(button).toHaveClass("h-10");
  });

  it("renders with different variants", () => {
    const variants: ButtonProps["variant"][] = [
      "primary", "secondary", "ghost", "danger", "success", "edit", "delete"
    ];
    for (const variant of variants) {
      cleanup();
      render(<Button variant={variant}>Test</Button>);
      expect(screen.getByRole("button", { name: "Test" })).toBeInTheDocument();
    }
  });

  it("renders with different sizes", () => {
    const sizes: ButtonProps["size"][] = ["xs", "sm", "md", "lg"];
    for (const size of sizes) {
      cleanup();
      render(<Button size={size}>Sized</Button>);
      expect(screen.getByRole("button", { name: "Sized" })).toBeInTheDocument();
    }
  });

  it("renders left icon when iconPosition is left (default)", () => {
    render(<Button icon={DummyIcon}>With Icon</Button>);
    const icon = screen.getByTestId("dummy-icon");
    expect(icon).toBeInTheDocument();
  });

  it("renders right icon when iconPosition is right", () => {
    render(<Button icon={DummyIcon} iconPosition="right">With Icon</Button>);
    const icon = screen.getByTestId("dummy-icon");
    expect(icon).toBeInTheDocument();
  });

  it("does not render icon if not provided", () => {
    render(<Button>Text Only</Button>);
    expect(screen.queryByTestId("dummy-icon")).not.toBeInTheDocument();
  });

  it("shows loader when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
    // Check for svg with animate-spin class inside the button
    const button = screen.getByRole("button");
    const svg = button.querySelector(".animate-spin");
    expect(svg).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("is disabled when both disabled and isLoading are true", () => {
    render(<Button disabled isLoading>Disabled Loading</Button>);
    expect(screen.getByRole("button", { name: "Disabled Loading" })).toBeDisabled();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>NoClick</Button>);
    fireEvent.click(screen.getByRole("button", { name: "NoClick" }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("accepts custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button", { name: "Custom" })).toHaveClass("custom-class");
  });

  it("renders children inside a span", () => {
    render(<Button>ChildText</Button>);
    const span = screen.getByText("ChildText");
    expect(span.tagName.toLowerCase()).toBe("span");
  });

  it("renders as type=button by default", () => {
    render(<Button>DefaultType</Button>);
    expect(screen.getByRole("button", { name: "DefaultType" })).toHaveAttribute("type", "button");
  });

  it("renders as type=submit when specified", () => {
    render(<Button type="submit">SubmitType</Button>);
    expect(screen.getByRole("button", { name: "SubmitType" })).toHaveAttribute("type", "submit");
  });

  it("is focusable and accessible", () => {
    render(<Button>Focusable</Button>);
    const button = screen.getByRole("button", { name: "Focusable" });
    button.focus();
    expect(button).toHaveFocus();
  });

  it("forwards other props to button element", () => {
    render(<Button data-testid="my-btn">Test</Button>);
    expect(screen.getByTestId("my-btn")).toBeInTheDocument();
  });

  it("handles empty children", () => {
    render(<Button></Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("renders icon and children together", () => {
    render(<Button icon={DummyIcon}>WithBoth</Button>);
    const icon = screen.getByTestId("dummy-icon");
    const span = screen.getByText("WithBoth");
    expect(icon).toBeInTheDocument();
    expect(span).toBeInTheDocument();
  });
});
