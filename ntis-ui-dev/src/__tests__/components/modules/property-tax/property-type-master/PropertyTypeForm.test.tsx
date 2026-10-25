/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PropertyTypeForm from "@/components/modules/property-tax/property-type-master/PropertyTypeForm";
import { usePropertyTypeForm } from "@/hooks/usePropertyTypeForm";
import type { PropertyTypeCategory } from "@/types/property-type-category.types";
import type { UseType } from "@/types/typeOfUse.types";

// Mock hooks
vi.mock("@/hooks/usePropertyTypeForm");

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Actions
vi.mock("@/app/[locale]/property-tax/propertytype/action", () => ({
  updatePropertyTypeValidationsAction: vi.fn(),
}));

import { updatePropertyTypeValidationsAction } from "@/app/[locale]/property-tax/propertytype/action";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

describe("PropertyTypeForm", () => {
  const mockCategories = [{ id: 1, propertyTypeCategory: "Category 1", isActive: true }] as PropertyTypeCategory[];
  const mockTypeOfUseList = [
    { typeOfUseId: 1, typeOfUseCode: "R1", description: "Residential", type: "R" },
  ] as UseType[];

  const defaultHookValues = {
    formData: {
      id: 0,
      propertyDescription: "",
      type: "",
      propertyTypeGroup: "",
      propertyTypeCategoryId: 0,
      searchSequence: 0,
      isActive: true,
    },
    searchSequenceValue: "0",
    errors: {},
    isSubmitting: false,
    isActive: true,
    open: true,
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    handleCategoryChange: vi.fn(),
    handleSubmit: vi.fn().mockResolvedValue({ success: true }),
    handleToggleStatus: vi.fn(),
    handleCancel: vi.fn(),
    refreshAndClose: vi.fn(),
    showError: vi.fn().mockReturnValue(false),
    t: (key: string) => key,
    tCommon: (key: string) => key,
    isEdit: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePropertyTypeForm).mockReturnValue(defaultHookValues as any);
  });

  const setup = (props = {}) => {
    return render(
      <PropertyTypeForm
        id={null}
        categories={mockCategories}
        typeOfUseList={mockTypeOfUseList}
        {...props}
      />
    );
  };

  it("renders Add Mode form correctly", () => {
    setup();

    expect(screen.getByText("form.addTitle")).toBeInTheDocument();
    expect(screen.getByText("form.subtitle")).toBeInTheDocument();
    expect(screen.getByText("form.actions.save")).toBeInTheDocument();
  });

  it("renders Edit Mode form correctly", () => {
    vi.mocked(usePropertyTypeForm).mockReturnValue({
      ...defaultHookValues,
      isEdit: true,
    } as any);

    setup({ id: 1 });

    expect(screen.getByText("form.editTitle")).toBeInTheDocument();
    expect(screen.getByText("form.editSubtitle")).toBeInTheDocument();
    expect(screen.getByText("form.actions.update")).toBeInTheDocument();
  });

  it("handles form submission in Add Mode with type of use validations", async () => {
    // Setup mocks for Add Mode - return createdId so form can save validations
    const mockHandleSubmit = vi.fn().mockResolvedValue({ success: true, createdId: 99 });
    vi.mocked(usePropertyTypeForm).mockReturnValue({
      ...defaultHookValues,
      handleSubmit: mockHandleSubmit,
      formData: { ...defaultHookValues.formData, propertyDescription: "TestDesc", type: "TestType" }
    } as any);

    vi.mocked(updatePropertyTypeValidationsAction).mockResolvedValue({ success: true });

    const { container } = setup({ initialTypeOfUseIds: [1] });

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      // When createdId is returned, validations are saved with that ID
      expect(updatePropertyTypeValidationsAction).toHaveBeenCalledWith(99, [1]);
      expect(defaultHookValues.refreshAndClose).toHaveBeenCalled();
    });
  });

  it("handles form submission in Edit Mode with type of use validations", async () => {
    const mockHandleSubmit = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(usePropertyTypeForm).mockReturnValue({
      ...defaultHookValues,
      isEdit: true,
      handleSubmit: mockHandleSubmit,
    } as any);

    vi.mocked(updatePropertyTypeValidationsAction).mockResolvedValue({ success: true });

    const { container } = setup({ id: 1, initialTypeOfUseIds: [1] });

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(updatePropertyTypeValidationsAction).toHaveBeenCalledWith(1, [1]);
      expect(defaultHookValues.refreshAndClose).toHaveBeenCalled();
    });
  });

  it("stops submission if the original handler fails", async () => {
    const mockHandleSubmit = vi.fn().mockResolvedValue({ success: false });
    vi.mocked(usePropertyTypeForm).mockReturnValue({
      ...defaultHookValues,
      handleSubmit: mockHandleSubmit,
    } as any);

    const { container } = setup();

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(updatePropertyTypeValidationsAction).not.toHaveBeenCalled();
      expect(defaultHookValues.refreshAndClose).not.toHaveBeenCalled();
    });
  });

  it("allows selecting and clearing all type of uses", () => {
    setup();

    const selectAllBtn = screen.getByText("form.typeOfUseSection.selectAll");
    fireEvent.click(selectAllBtn);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    const clearAllBtn = screen.getByText("form.typeOfUseSection.clear");
    fireEvent.click(clearAllBtn);

    expect(checkbox).not.toBeChecked();
  });
});
