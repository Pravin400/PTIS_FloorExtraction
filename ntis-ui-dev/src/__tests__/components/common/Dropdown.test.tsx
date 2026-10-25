import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { MultiSelectDropdown } from "@/components/common/Dropdown";
import { NextIntlClientProvider } from 'next-intl';

const mockMessages = {
  multiSelect: {
    placeholder: 'Select...',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    search: 'Search...',
    noOptions: 'No options',
  },
};

describe("MultiSelectDropdown", () => {
  const options = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Cherry", value: "cherry" },
  ];
  function setup(props: Partial<{ value: string[]; onChange: (value: string[]) => void }> = {}) {
    const value = props.value ?? [];
    const onChange = props.onChange ?? vi.fn();
    return render(
      <NextIntlClientProvider locale="en" messages={{ common: mockMessages }}>
        <MultiSelectDropdown
          label="Fruits"
          options={options}
          value={value}
          onChange={onChange}
          {...props}
        />
      </NextIntlClientProvider>
    );
  }

  it("renders label and placeholder", () => {
    setup();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText("Select...")).toBeInTheDocument();
  });

  it("opens dropdown on trigger click", () => {
    setup();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Select All")).toBeInTheDocument();
    expect(screen.getByText("Clear All")).toBeInTheDocument();
  });

  it("shows options and can select/deselect", () => {
    // Use a stateful wrapper to control value
    function Wrapper() {
      const [value, setValue] = React.useState<string[]>([]);
      const handleChange = (val: string[]) => {
        setValue(val);
        onChange(val);
      };
      return (
        <NextIntlClientProvider locale="en" messages={{ common: mockMessages }}>
          <MultiSelectDropdown
            label="Fruits"
            options={options}
            value={value}
            onChange={handleChange}
          />
        </NextIntlClientProvider>
      );
    }
    const onChange = vi.fn();
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button"));
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(3);
    // Select Apple
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenNthCalledWith(1, ["apple"]);
    // Select Banana
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenNthCalledWith(2, expect.arrayContaining(["apple", "banana"]));
    expect(onChange.mock.calls[1][0].length).toBe(2);
    // Deselect Apple
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenNthCalledWith(3, ["banana"]);
  });

  it("shows selected labels in trigger", () => {
    setup({ value: ["apple", "banana"] });
    expect(screen.getByText("Apple, Banana")).toBeInTheDocument();
  });

  it("filters options by search", () => {
    setup();
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "ban" } });
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("shows no options message if search yields nothing", () => {
    setup();
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No options")).toBeInTheDocument();
  });

  it("selects all filtered options with Select All", () => {
    const onChange = vi.fn();
    setup({ onChange });
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Select All"));
    expect(onChange).toHaveBeenCalledWith(["apple", "banana", "cherry"]);
  });

  it("clears all filtered options with Clear All", () => {
    const onChange = vi.fn();
    setup({ value: ["apple", "banana", "cherry"], onChange });
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Clear All"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("disables Select All if all filtered selected", () => {
    setup({ value: ["apple", "banana", "cherry"] });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Select All")).toBeDisabled();
  });

  it("disables Clear All if nothing selected", () => {
    setup({ value: [] });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Clear All")).toBeDisabled();
  });

  it("closes dropdown on outside click", () => {
    setup();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Select All")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Select All")).not.toBeInTheDocument();
  });
});
