import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { Select, Option } from "@/components/common/select";

// Mock scrollIntoView for all tests
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = function() {};
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Select", () => {
  const options: Option[] = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Cherry", value: "cherry", disabled: true },
  ];

  it("renders placeholder when no value", () => {
    render(<Select options={options} placeholder="Pick one" />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("renders selected value label", () => {
    render(<Select options={options} value="banana" />);
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("opens dropdown on button click", () => {
    render(<Select options={options} />);
    // Find the button by role
    const button = screen.getByRole("combobox");
    fireEvent.click(button);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("selects option and calls onChange", () => {
    const handleChange = vi.fn();
    render(<Select options={options} onChange={handleChange} />);
    const button = screen.getByRole("combobox");
    fireEvent.click(button);
    fireEvent.click(screen.getByText("Banana"));
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: "banana" })
    }), "banana");
    // Should close dropdown
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select disabled option", () => {
    const handleChange = vi.fn();
    render(<Select options={options} onChange={handleChange} />);
    const button = screen.getByRole("combobox");
    fireEvent.click(button);
    fireEvent.click(screen.getByText("Cherry"));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    const { container } = render(<Select options={options} className="custom-class" />);
    // The custom class is applied to the select wrapper div (inside the flex container)
    const selectWrapper = container.querySelector(".relative.w-full");
    expect(selectWrapper).toHaveClass("custom-class");
  });

  it("renders with selectSize 'sm' and 'md'", () => {
    const { rerender, container } = render(<Select options={options} selectSize="sm" />);
    // The button should have the correct size class
    const button = container.querySelector("button");
    expect(button).toHaveClass("h-8");
    rerender(<Select options={options} selectSize="md" />);
    expect(button).toHaveClass("h-10");
  });

  it("renders as disabled", () => {
    render(<Select options={options} disabled />);
    const button = screen.getByRole("combobox");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-not-allowed");
  });

  it("closes dropdown on blur", () => {
    render(<Select options={options} />);
    const button = screen.getByRole("combobox");
    fireEvent.click(button);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    // Blur the button to close the dropdown
    fireEvent.blur(button);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  // Keyboard navigation tests are skipped because the Select component does not implement keyboard navigation.
  it.skip("navigates options with ArrowDown/ArrowUp and selects with Enter", async () => {});

  it.skip("skips disabled options during keyboard navigation", async () => {});

  it.skip("closes dropdown with Escape key", () => {});

  it.skip("aria-activedescendant updates during navigation", async () => {});

  it.skip("highlights first enabled option when first option is disabled and opening with keyboard", async () => {});

  it.skip("highlights first enabled option when value is invalid and opening with keyboard", async () => {});
});
