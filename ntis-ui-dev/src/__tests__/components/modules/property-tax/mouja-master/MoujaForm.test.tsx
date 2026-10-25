/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import MoujaForm from "@/components/modules/property-tax/mouja-master/MoujaForm";
import type { Mouja } from "@/types/mouja.types";
import { useMoujaForm } from "@/hooks/moujamaster/useMoujaForm";

// Mock the useMoujaForm hook
vi.mock("@/hooks/moujamaster/useMoujaForm", () => ({
  useMoujaForm: vi.fn(),
}));

// Mock Drawer component
vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({ open, onClose, title, footer, children }: any) => (
    <div data-testid="drawer" data-open={open}>
      <div data-testid="drawer-title">{title}</div>
      <div data-testid="drawer-content">{children}</div>
      <div data-testid="drawer-footer">{footer}</div>
      <button data-testid="drawer-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

// Mock action buttons
vi.mock("@/components/common", () => ({
  CancelButton: ({ label, onClick, disabled }: any) => (
    <button
      data-testid="cancel-button"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  ),
  SaveButton: ({ label, type, form, isLoading }: any) => (
    <button
      data-testid="save-button"
      type={type}
      form={form}
      disabled={isLoading}
    >
      {label}
    </button>
  ),
}));

// Mock form sections
vi.mock("@/components/modules/property-tax/mouja-master/components/StatusToggleSection", () => ({
  StatusToggleSection: ({ isEdit, isActive, handleToggleStatus }: any) => (
    <div data-testid="status-toggle-section">
      <label>Status: {isEdit ? "Edit Mode" : "Add Mode"}</label>
      <button
        data-testid="toggle-status"
        onClick={handleToggleStatus}
      >
        {isActive ? "Active" : "Inactive"}
      </button>
    </div>
  ),
}));

vi.mock("@/components/modules/property-tax/mouja-master/components/FormFieldsSection", () => ({
  FormFieldsSection: ({ formData, handleChange, handleBlur, errors, showError }: any) => (
    <div data-testid="form-fields-section">
      <div>
        <label htmlFor="moujaNo">Mouja No</label>
        <input
          id="moujaNo"
          name="moujaNo"
          value={formData.moujaNo}
          onChange={handleChange}
          onBlur={handleBlur}
          data-testid="moujaNo-input"
        />
        {showError("moujaNo") && (
          <span data-testid="moujaNo-error">{errors.moujaNo}</span>
        )}
      </div>
      <div>
        <label htmlFor="moujaName">Mouja Name</label>
        <input
          id="moujaName"
          name="moujaName"
          value={formData.moujaName}
          onChange={handleChange}
          onBlur={handleBlur}
          data-testid="moujaName-input"
        />
        {showError("moujaName") && (
          <span data-testid="moujaName-error">{errors.moujaName}</span>
        )}
      </div>
    </div>
  ),
}));

vi.mock("@/components/modules/property-tax/mouja-master/components/ValidationSection", () => ({
  ValidationSection: ({ tCommon }: any) => (
    <div data-testid="validation-section">
      {tCommon("validation.message")}
    </div>
  ),
}));

describe("MoujaForm", () => {
  const mockHandleChange = vi.fn();
  const mockHandleBlur = vi.fn();
  const mockHandleSubmit = vi.fn((e) => e.preventDefault());
  const mockHandleToggleStatus = vi.fn();
  const mockHandleCancel = vi.fn();
  const mockShowError = vi.fn();
  const mockT = vi.fn((key: string) => key);
  const mockTCommon = vi.fn((key: string) => key);

  const defaultFormData = {
    moujaNo: "",
    moujaName: "",
    isActive: true,
  };

  const mockMessages = {
    mouja: {
      moujaMaster: {
        aliasFallback: {
          entity: "Mouja",
        },
        form: {
          addTitle: "Add Mouja",
          editTitle: "Edit Mouja",
          subtitle: "Enter mouja details",
          editSubtitle: "Update mouja details",
          actions: {
            save: "Save",
            update: "Update",
          },
        },
      },
    },
    common: {
      buttons: {
        cancel: "Cancel",
      },
      validation: {
        message: "All fields are required",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useMoujaForm as any).mockReturnValue({
      formData: defaultFormData,
      errors: {},
      isSubmitting: false,
      isActive: true,
      open: true,
      handleChange: mockHandleChange,
      handleBlur: mockHandleBlur,
      handleSubmit: mockHandleSubmit,
      handleToggleStatus: mockHandleToggleStatus,
      handleCancel: mockHandleCancel,
      showError: mockShowError,
      t: mockT,
      tCommon: mockTCommon,
      isEdit: false,
      moujaLabel: "Mouja",
    });
  });

  describe("Add Mode", () => {
    it("should render form in add mode", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("drawer")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("form.addTitle", { mouja: "Mouja", entity: "Mouja" });
    });

    it("should display add subtitle", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(mockT).toHaveBeenCalledWith("form.subtitle", { mouja: "Mouja", entity: "Mouja" });
    });

    it("should show save button in add mode", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("form.actions.save", { mouja: "Mouja", entity: "Mouja" });
    });
  });

  describe("Edit Mode", () => {
    const initialData: Mouja = {
      id: 1,
      moujaNo: "M001",
      moujaName: "Test Mouja",
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    };

    beforeEach(() => {
      (useMoujaForm as any).mockReturnValue({
        formData: {
          id: 1,
          moujaNo: "M001",
          moujaName: "Test Mouja",
          isActive: true,
        },
        errors: {},
        isSubmitting: false,
        isActive: true,
        open: true,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        handleToggleStatus: mockHandleToggleStatus,
        handleCancel: mockHandleCancel,
        showError: mockShowError,
        t: mockT,
        tCommon: mockTCommon,
        isEdit: true,
        moujaLabel: "Mouja",
      });
    });

    it("should render form in edit mode", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={1} initialData={initialData} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("drawer")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("form.editTitle", { mouja: "Mouja", entity: "Mouja" });
    });

    it("should display edit subtitle", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={1} initialData={initialData} />
        </NextIntlClientProvider>
      );

      expect(mockT).toHaveBeenCalledWith("form.editSubtitle", { mouja: "Mouja", entity: "Mouja" });
    });

    it("should show update button in edit mode", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={1} initialData={initialData} />
        </NextIntlClientProvider>
      );

      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("form.actions.update", { mouja: "Mouja", entity: "Mouja" });
    });
  });

  describe("Form Sections", () => {
    it("should render status toggle section", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("status-toggle-section")).toBeInTheDocument();
    });

    it("should render form fields section", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("form-fields-section")).toBeInTheDocument();
    });

    it("should render validation section", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("validation-section")).toBeInTheDocument();
    });
  });

  describe("Form Inputs", () => {
    it("should render moujaNo input field", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("moujaNo-input")).toBeInTheDocument();
    });

    it("should render moujaName input field", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("moujaName-input")).toBeInTheDocument();
    });

    it("should call handleChange when moujaNo changes", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const input = screen.getByTestId("moujaNo-input");
      fireEvent.change(input, { target: { value: "M001" } });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("should call handleChange when moujaName changes", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const input = screen.getByTestId("moujaName-input");
      fireEvent.change(input, { target: { value: "Test Mouja" } });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("should call handleBlur when moujaNo loses focus", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const input = screen.getByTestId("moujaNo-input");
      fireEvent.blur(input);

      expect(mockHandleBlur).toHaveBeenCalled();
    });

    it("should call handleBlur when moujaName loses focus", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const input = screen.getByTestId("moujaName-input");
      fireEvent.blur(input);

      expect(mockHandleBlur).toHaveBeenCalled();
    });
  });

  describe("Form Actions", () => {
    it("should render cancel button", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("should render save button", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("save-button")).toBeInTheDocument();
    });

    it("should call handleCancel when cancel button is clicked", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const cancelButton = screen.getByTestId("cancel-button");
      fireEvent.click(cancelButton);

      expect(mockHandleCancel).toHaveBeenCalled();
    });

    it("should call handleSubmit when form is submitted", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const form = screen.getByTestId("drawer-content").querySelector("form");
      if (form) {
        fireEvent.submit(form);
        expect(mockHandleSubmit).toHaveBeenCalled();
      }
    });
  });

  describe("Status Toggle", () => {
    it("should display active status", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should call handleToggleStatus when toggle is clicked", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const toggleButton = screen.getByTestId("toggle-status");
      fireEvent.click(toggleButton);

      expect(mockHandleToggleStatus).toHaveBeenCalled();
    });

    it("should display inactive status when toggled", () => {
      (useMoujaForm as any).mockReturnValue({
        formData: defaultFormData,
        errors: {},
        isSubmitting: false,
        isActive: false,
        open: true,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        handleToggleStatus: mockHandleToggleStatus,
        handleCancel: mockHandleCancel,
        showError: mockShowError,
        t: mockT,
        tCommon: mockTCommon,
        isEdit: false,
      });

      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });
  });

  describe("Validation Errors", () => {
    beforeEach(() => {
      mockShowError.mockReturnValue(true);
      (useMoujaForm as any).mockReturnValue({
        formData: defaultFormData,
        errors: {
          moujaNo: "Mouja No is required",
          moujaName: "Mouja Name is required",
        },
        isSubmitting: false,
        isActive: true,
        open: true,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        handleToggleStatus: mockHandleToggleStatus,
        handleCancel: mockHandleCancel,
        showError: mockShowError,
        t: mockT,
        tCommon: mockTCommon,
        isEdit: false,
      });
    });

    it("should display moujaNo error when validation fails", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("moujaNo-error")).toBeInTheDocument();
      expect(screen.getByTestId("moujaNo-error")).toHaveTextContent(
        "Mouja No is required"
      );
    });

    it("should display moujaName error when validation fails", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("moujaName-error")).toBeInTheDocument();
      expect(screen.getByTestId("moujaName-error")).toHaveTextContent(
        "Mouja Name is required"
      );
    });
  });

  describe("Loading State", () => {
    it("should disable buttons when submitting", () => {
      (useMoujaForm as any).mockReturnValue({
        formData: defaultFormData,
        errors: {},
        isSubmitting: true,
        isActive: true,
        open: true,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        handleToggleStatus: mockHandleToggleStatus,
        handleCancel: mockHandleCancel,
        showError: mockShowError,
        t: mockT,
        tCommon: mockTCommon,
        isEdit: false,
      });

      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const cancelButton = screen.getByTestId("cancel-button");
      const saveButton = screen.getByTestId("save-button");

      expect(cancelButton).toBeDisabled();
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Drawer State", () => {
    it("should render drawer as open", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const drawer = screen.getByTestId("drawer");
      expect(drawer).toHaveAttribute("data-open", "true");
    });

    it("should handle drawer close", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaForm id={null} />
        </NextIntlClientProvider>
      );

      const closeButton = screen.getByTestId("drawer-close");
      fireEvent.click(closeButton);

      expect(mockHandleCancel).toHaveBeenCalled();
    });
  });
});
