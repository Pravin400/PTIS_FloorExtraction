import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { DateInput, DateInputProps, formatDateDDMMYYYY, toISODateString } from "@/components/common/DateInput";

describe("DateInput", () => {
  function setup(props: Partial<DateInputProps> = {}) {
    return render(<DateInput {...props} />);
  }

  describe("formatDateDDMMYYYY and toISODateString helpers", () => {
    it("formats ISO date string to DD/MM/YYYY", () => {
      expect(formatDateDDMMYYYY("2026-04-01")).toBe("01/04/2026");
      expect(formatDateDDMMYYYY("2027-03-31")).toBe("31/03/2027");
    });

    it("normalizes date to ISO YYYY-MM-DD", () => {
      expect(toISODateString("2026-04-01")).toBe("2026-04-01");
      expect(toISODateString("01/04/2026")).toBe("2026-04-01");
    });
  });

  describe("rendering and interactions", () => {
    it("renders with label and placeholder", () => {
      setup({ label: "Period From" });
      expect(screen.getByLabelText("Period From")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("DD/MM/YYYY")).toBeInTheDocument();
    });

    it("displays formatted DD/MM/YYYY for ISO date value", () => {
      setup({ label: "Period Date", value: "2026-04-01" });
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("01/04/2026");
    });

    it("makes textbox readOnly when disableManualEntry is true", () => {
      setup({ disableManualEntry: true, value: "2026-04-01" });
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("readonly");
    });

    it("leaves textbox editable when disableManualEntry is false", () => {
      setup({ disableManualEntry: false, value: "2026-04-01" });
      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("readonly");
    });

    it("renders error message and helperText", () => {
      setup({ error: "Date is required" });
      expect(screen.getByText("Date is required")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveClass("border-red-500");
    });

    it("renders disabled state", () => {
      setup({ disabled: true });
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("calls onValueChange when date input changes", () => {
      const handleValueChange = vi.fn();
      const handleChange = vi.fn();
      const { container } = setup({
        onValueChange: handleValueChange,
        onChange: handleChange,
      });

      const hiddenNativeDate = container.querySelector('input[type="date"]');
      expect(hiddenNativeDate).toBeInTheDocument();

      if (hiddenNativeDate) {
        fireEvent.change(hiddenNativeDate, { target: { value: "2026-04-01" } });
      }

      expect(handleValueChange).toHaveBeenCalledWith("2026-04-01");
      expect(handleChange).toHaveBeenCalled();
    });

    it("triggers calendar picker on calendar icon click", () => {
      const { container } = setup({ label: "Date Field" });
      const nativeInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      const showPickerSpy = vi.fn();
      if (nativeInput) {
        nativeInput.showPicker = showPickerSpy;
      }

      const calendarBtn = screen.getByRole("button", { name: "Open calendar" });
      fireEvent.click(calendarBtn);

      expect(showPickerSpy).toHaveBeenCalled();
    });

    it("triggers calendar picker on keyboard access (Enter/Space) when disableManualEntry is true", () => {
      const { container } = setup({ disableManualEntry: true });
      const nativeInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      const showPickerSpy = vi.fn();
      if (nativeInput) {
        nativeInput.showPicker = showPickerSpy;
      }

      const textInput = screen.getByRole("textbox");
      fireEvent.keyDown(textInput, { key: "Enter" });
      expect(showPickerSpy).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(textInput, { key: " " });
      expect(showPickerSpy).toHaveBeenCalledTimes(2);
    });

    it("forwards ref to native input element", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<DateInput ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
