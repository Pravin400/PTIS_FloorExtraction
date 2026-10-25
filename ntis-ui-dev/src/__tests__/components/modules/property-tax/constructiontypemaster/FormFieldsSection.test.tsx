import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormFieldsSection } from "@/components/modules/property-tax/construction-type-master/components/FormFieldsSection";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
}));

vi.mock("@/components/common", () => ({
  Input: ({ name, label, value, onChange, onBlur, fullWidth: _fullWidth, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; fullWidth?: boolean }) => (
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
    visible && message ? <div data-testid="validation-message">{message}</div> : null,
}));

describe("FormFieldsSection", () => {
  const mockHandleChange = vi.fn();
  const mockHandleBlur = vi.fn();
  const mockShowError = vi.fn();
  const mockT = vi.fn((key: string) => key);

  const defaultProps = {
    formData: {
      constructionCode: "C1",
      description: "Concrete",
      searchSequence: 1,
      isActive: true,
      updatedBy: 1,
    },
    searchSequenceValue: "1",
    handleChange: mockHandleChange,
    handleBlur: mockHandleBlur,
    errors: {},
    showError: mockShowError,
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all input fields with correct values", () => {
    render(<FormFieldsSection {...defaultProps} />);

    expect(screen.getByTestId("constructionCode")).toHaveValue("C1");
    expect(screen.getByTestId("description")).toHaveValue("Concrete");
    expect(screen.getByTestId("searchSequence")).toHaveValue(1);
  });

  it("calls handleChange when input values change", () => {
    render(<FormFieldsSection {...defaultProps} />);

    fireEvent.change(screen.getByTestId("constructionCode"), { target: { value: "C2" } });
    expect(mockHandleChange).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("description"), { target: { value: "Wood" } });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("calls handleBlur when inputs lose focus", () => {
    render(<FormFieldsSection {...defaultProps} />);

    fireEvent.blur(screen.getByTestId("constructionCode"));
    expect(mockHandleBlur).toHaveBeenCalled();
  });

  it("displays validation messages when errors are present and visible", () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: { constructionCode: "Required" },
      showError: vi.fn((field) => field === "constructionCode"),
    };

    render(<FormFieldsSection {...propsWithErrors} />);
    expect(screen.getByTestId("validation-message")).toHaveTextContent("Required");
  });
});
