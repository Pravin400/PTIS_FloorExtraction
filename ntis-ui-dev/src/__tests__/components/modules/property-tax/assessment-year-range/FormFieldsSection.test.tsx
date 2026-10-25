import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormFieldsSection } from "@/components/modules/property-tax/assessment-year-range/shared/components/FormFieldsSection";

vi.mock("@/components/common", () => ({
  Input: ({ name, label, value, onChange, onBlur, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; fullWidth?: boolean }) => (
    <div data-testid={`input-container-${name}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        data-testid={name}
        {...props}
      />
    </div>
  ),
  ValidationMessage: ({ message, visible }: { message?: string; visible?: boolean }) =>
    visible && message ? <div data-testid={`validation-message-${message}`}>{message}</div> : null,
}));

describe("FormFieldsSection (AssessmentYearRange)", () => {
  const mockHandleYearChange = vi.fn();
  const mockHandleBlur = vi.fn();
  const mockShowError = vi.fn();
  const mockT = vi.fn((key: string) => key);

  const defaultProps = {
    fromYearValue: "2020",
    toYearValue: "2025",
    handleYearChange: mockHandleYearChange,
    handleBlur: mockHandleBlur,
    errors: {},
    showError: mockShowError,
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockShowError.mockReturnValue(false);
  });

  it("renders all input fields with correct values", () => {
    render(<FormFieldsSection {...defaultProps} />);

    expect(screen.getByTestId("fromYear")).toHaveValue("2020");
    expect(screen.getByTestId("toYear")).toHaveValue("2025");
  });

  it("renders labels using translation keys", () => {
    render(<FormFieldsSection {...defaultProps} />);

    expect(mockT).toHaveBeenCalledWith("form.fields.fromYear.label", expect.anything());
    expect(mockT).toHaveBeenCalledWith("form.fields.toYear.label", expect.anything());
    expect(mockT).toHaveBeenCalledWith("form.fields.fromYear.placeholder", expect.anything());
    expect(mockT).toHaveBeenCalledWith("form.fields.toYear.placeholder", expect.anything());
  });

  it("calls handleYearChange when fromYear value changes", () => {
    render(<FormFieldsSection {...defaultProps} />);

    fireEvent.change(screen.getByTestId("fromYear"), { target: { value: "2021" } });
    expect(mockHandleYearChange).toHaveBeenCalledWith("fromYear", "2021");
  });

  it("calls handleYearChange when toYear value changes", () => {
    render(<FormFieldsSection {...defaultProps} />);

    fireEvent.change(screen.getByTestId("toYear"), { target: { value: "2026" } });
    expect(mockHandleYearChange).toHaveBeenCalledWith("toYear", "2026");
  });

  it("calls handleBlur when fromYear loses focus", () => {
    render(<FormFieldsSection {...defaultProps} />);

    fireEvent.blur(screen.getByTestId("fromYear"));
    expect(mockHandleBlur).toHaveBeenCalledWith("fromYear");
  });

  it("calls handleBlur when toYear loses focus", () => {
    render(<FormFieldsSection {...defaultProps} />);

    fireEvent.blur(screen.getByTestId("toYear"));
    expect(mockHandleBlur).toHaveBeenCalledWith("toYear");
  });

  it("displays validation message for fromYear when error is present and visible", () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: { fromYear: "From Year is required" },
      showError: vi.fn((field) => field === "fromYear"),
    };

    render(<FormFieldsSection {...propsWithErrors} />);
    expect(screen.getByTestId("validation-message-From Year is required")).toHaveTextContent("From Year is required");
  });

  it("displays validation message for toYear when error is present and visible", () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: { toYear: "To Year is required" },
      showError: vi.fn((field) => field === "toYear"),
    };

    render(<FormFieldsSection {...propsWithErrors} />);
    expect(screen.getByTestId("validation-message-To Year is required")).toHaveTextContent("To Year is required");
  });

  it("does not display validation messages when showError returns false", () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: { fromYear: "Error", toYear: "Error" },
      showError: vi.fn().mockReturnValue(false),
    };

    render(<FormFieldsSection {...propsWithErrors} />);
    expect(screen.queryByTestId("validation-message-Error")).not.toBeInTheDocument();
  });

  it("renders inputs with numeric inputMode", () => {
    render(<FormFieldsSection {...defaultProps} />);
    
    expect(screen.getByTestId("fromYear")).toHaveAttribute("inputMode", "numeric");
    expect(screen.getByTestId("toYear")).toHaveAttribute("inputMode", "numeric");
  });

  it("renders inputs with maxLength of 4", () => {
    render(<FormFieldsSection {...defaultProps} />);
    
    expect(screen.getByTestId("fromYear")).toHaveAttribute("maxLength", "4");
    expect(screen.getByTestId("toYear")).toHaveAttribute("maxLength", "4");
  });

  it("renders with empty values", () => {
    const emptyProps = {
      ...defaultProps,
      fromYearValue: "",
      toYearValue: "",
    };

    render(<FormFieldsSection {...emptyProps} />);
    
    expect(screen.getByTestId("fromYear")).toHaveValue("");
    expect(screen.getByTestId("toYear")).toHaveValue("");
  });
});
