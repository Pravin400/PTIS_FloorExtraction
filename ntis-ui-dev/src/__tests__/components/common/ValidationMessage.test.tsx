import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ValidationMessage } from "@/components/common/ValidationMessage";

describe("ValidationMessage", () => {
  it("renders error message by default", () => {
    render(<ValidationMessage message="Error occurred" />);
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
    const div = screen.getByText("Error occurred").closest("div");
    expect(div).toHaveClass("bg-red-50");
    expect(div).toHaveClass("text-red-600");
    expect(div).toHaveClass("border-red-200");
  });

  it("renders warning message", () => {
    render(<ValidationMessage message="Warning!" type="warning" />);
    expect(screen.getByText("Warning!")).toBeInTheDocument();
    const div = screen.getByText("Warning!").closest("div");
    expect(div).toHaveClass("bg-amber-50");
    expect(div).toHaveClass("text-amber-700");
    expect(div).toHaveClass("border-amber-200");
  });

  it("renders info message", () => {
    render(<ValidationMessage message="Info here" type="info" />);
    expect(screen.getByText("Info here")).toBeInTheDocument();
    const div = screen.getByText("Info here").closest("div");
    expect(div).toHaveClass("bg-blue-50");
    expect(div).toHaveClass("text-blue-700");
    expect(div).toHaveClass("border-blue-200");
  });

  it("does not render if visible is false", () => {
    render(<ValidationMessage message="Hidden" visible={false} />);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("does not render if message is empty", () => {
    render(<ValidationMessage message="" />);
    // Should not render any element with the error class
    expect(document.querySelector('.text-red-600')).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ValidationMessage message="Custom" className="custom-class" />);
    const div = screen.getByText("Custom").closest("div");
    expect(div).toHaveClass("custom-class");
  });

  it("renders correct icon for error", () => {
    render(<ValidationMessage message="Error occurred" type="error" />);
    const div = screen.getByText("Error occurred").closest("div");
    const icon = div?.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders correct icon for warning", () => {
    render(<ValidationMessage message="Warning!" type="warning" />);
    const div = screen.getByText("Warning!").closest("div");
    const icon = div?.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders correct icon for info", () => {
    render(<ValidationMessage message="Info here" type="info" />);
    const div = screen.getByText("Info here").closest("div");
    const icon = div?.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});
