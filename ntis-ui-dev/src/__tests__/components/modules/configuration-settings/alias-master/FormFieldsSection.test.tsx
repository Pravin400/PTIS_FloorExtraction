import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormFieldsSection, type FormFieldsSectionRef } from "@/components/modules/configuration-settings/alias-master/FormFieldsSection";
import type { AliasMasterFormModel } from "@/types/alias-master.types";

function MockInput(
  { name, label, value, onChange, onBlur, disabled, fullWidth: _fullWidth, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; fullWidth?: boolean },
  ref: React.Ref<HTMLInputElement>
) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        data-testid={name}
        {...props}
      />
    </div>
  );
}

vi.mock("@/components/common", () => ({
  Input: React.forwardRef(MockInput),
  ValidationMessage: ({ message, visible }: { message?: string; visible?: boolean }) =>
    visible && message ? <div data-testid="validation-message">{message}</div> : null,
}));

describe("FormFieldsSection", () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();
  const mockShowError = vi.fn();
  const t = (key: string) => key;

  const formData: AliasMasterFormModel = {
    id: null,
    keyName: "Ward_No",
    labelName: "Ward No",
    englishName: "Sector",
    regionalName: "सेक्टर",
    hindiName: "सेक्टर",
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all five input fields with correct values", () => {
    render(
      <FormFieldsSection
        formData={formData}
        errors={{}}
        showError={mockShowError}
        isEdit={false}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        t={t}
      />
    );

    expect(screen.getByTestId("keyName")).toHaveValue("Ward_No");
    expect(screen.getByTestId("labelName")).toHaveValue("Ward No");
    expect(screen.getByTestId("englishName")).toHaveValue("Sector");
    expect(screen.getByTestId("regionalName")).toHaveValue("सेक्टर");
    expect(screen.getByTestId("hindiName")).toHaveValue("सेक्टर");
  });

  it("disables the keyName input when isEdit is true", () => {
    render(
      <FormFieldsSection
        formData={formData}
        errors={{}}
        showError={mockShowError}
        isEdit={true}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        t={t}
      />
    );

    expect(screen.getByTestId("keyName")).toBeDisabled();
  });

  it("keeps the keyName input enabled when isEdit is false", () => {
    render(
      <FormFieldsSection
        formData={formData}
        errors={{}}
        showError={mockShowError}
        isEdit={false}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        t={t}
      />
    );

    expect(screen.getByTestId("keyName")).not.toBeDisabled();
  });

  it("calls onChange and onBlur when a field is edited", () => {
    render(
      <FormFieldsSection
        formData={formData}
        errors={{}}
        showError={mockShowError}
        isEdit={false}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        t={t}
      />
    );

    fireEvent.change(screen.getByTestId("labelName"), { target: { value: "Sector No" } });
    expect(mockOnChange).toHaveBeenCalled();

    fireEvent.blur(screen.getByTestId("labelName"));
    expect(mockOnBlur).toHaveBeenCalled();
  });

  it("shows a validation message only when showError returns true for that field", () => {
    render(
      <FormFieldsSection
        formData={formData}
        errors={{ labelName: "Label name is required" }}
        showError={(field) => field === "labelName"}
        isEdit={false}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        t={t}
      />
    );

    expect(screen.getByTestId("validation-message")).toHaveTextContent("Label name is required");
  });

  it("exposes keyNameRef via the imperative handle", () => {
    const ref = React.createRef<FormFieldsSectionRef>();
    render(
      <FormFieldsSection
        ref={ref}
        formData={formData}
        errors={{}}
        showError={mockShowError}
        isEdit={false}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        t={t}
      />
    );

    expect(ref.current?.keyNameRef.current).toBe(screen.getByTestId("keyName"));
  });
});
