import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SearchInput } from "@/components/common/SearchInput";

describe("SearchInput", () => {
  it("renders input with placeholder", () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Find..." />);
    expect(screen.getByPlaceholderText("Find...")).toBeInTheDocument();
  });

  it("renders search icon", () => {
    render(<SearchInput value="" onChange={() => {}} />);
    // Query the SVG by its aria-hidden attribute
    const icon = document.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(handleChange).toHaveBeenCalledWith("abc");
  });

  it("shows clear button when value and showClear", () => {
    render(<SearchInput value="test" onChange={() => {}} showClear={true} />);
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("does not show clear button when showClear is false", () => {
    render(<SearchInput value="test" onChange={() => {}} showClear={false} />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("calls onChange with empty string when clear button clicked", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="test" onChange={handleChange} showClear={true} />);
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("applies custom className", () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
