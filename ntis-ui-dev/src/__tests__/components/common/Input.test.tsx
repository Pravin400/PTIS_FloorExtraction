import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { Input, InputProps } from "@/components/common/Input";

describe("Input", () => {
  function setup(props: Partial<InputProps> = {}) {
    return render(<Input {...props} />);
  }

  it("renders input with label", () => {
    setup({ label: "Username" });
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });

  it("renders input with error", () => {
    setup({ error: "Required field" });
    expect(screen.getByText("Required field")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby");
  });

  it("renders input with helperText", () => {
    setup({ helperText: "Enter your username" });
    expect(screen.getByText("Enter your username")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby");
  });

  it("renders fullWidth input", () => {
    const { container } = setup({ fullWidth: true });
    expect(container.firstChild).toHaveClass("w-full");
  });

  it("renders disabled input", () => {
    setup({ disabled: true });
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("cursor-not-allowed");
  });

  it("passes className to input", () => {
    setup({ className: "custom-class" });
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("calls onChange when typing", () => {
    const handleChange = vi.fn();
    setup({ onChange: handleChange });
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("forwards ref to input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("renders input with custom id", () => {
    setup({ id: "custom-id", label: "Email" });
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "custom-id");
  });
});
