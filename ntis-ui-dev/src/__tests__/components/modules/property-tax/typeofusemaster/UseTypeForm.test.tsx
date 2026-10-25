import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import UseTypeForm from "@/components/modules/property-tax/typeofusemaster/UseTypeForm";
import type { UseGroup, UseType, TypeOfUseCategory } from "@/types/typeOfUse.types";
import { toast } from "sonner";

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
  }),
  useSearchParams: () => ({
    get: vi.fn((key) => (key === "groupId" ? "1" : null)),
  }),
  usePathname: () => "/property-tax/typeofusemaster/type/add",
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the actions
vi.mock("@/app/[locale]/property-tax/typeofusemaster/actions", () => ({
  createUseType: vi.fn(),
  updateUseType: vi.fn(),
}));

import { createUseType, updateUseType } from "@/app/[locale]/property-tax/typeofusemaster/actions";
const mockCreateUseType = vi.mocked(createUseType);
const mockUpdateUseType = vi.mocked(updateUseType);

const mockMessages = {
  typeofusemaster: {
    aliasFallback: {
      entity: "Type of Use",
      typeOfUse: "Type of Use",
      subTypeOfUse: "Sub-Type of Use",
      use: "Use",
      category: "Category",
    },
    group: {
      mandatoryNote: "Fields marked with * are mandatory",
    },
    category: {
      fields: {
        categoryName: "Category Name",
      },
    },
    type: {
      add: "Add Type of Use",
      edit: "Edit Type of Use",
      selectGroup: "Select group",
      selectType: "Select Type",
      selectCategory: "Select Category",
      addingToGroup: "Adding to Group",
      selectUseTypeGroup: "Select Use Type Group",
      selectedGroup: "Selected Group",
      displayOrder: "Display Order",
      mandatoryNote: "Fields marked with * are mandatory",
      searchPlaceholder: "Search types...",
      statusMessage: "{status}",
      fields: {
        typeId: "Type Of Use Code",
        type: "Type",
        useTypeGroup: "Use Type Group",
        description: "Description",
        sequence: "Key Wise Sequence",
        status: "Active Status",
      },
      placeholders: {
        typeId: "e.g., RES, COM01, IND",
        description: "Enter description",
        sequence: "0",
      },
      options: {
        residential: "R - Residential",
        commercial: "C - Commercial",
        industrial: "I - Industrial",
        nontaxable: "N - Non-taxable",
      },
    },
    messages: {
      typeCreated: "Type Created",
      typeUpdated: "Type Updated",
      duplicateTypeId: "Duplicate Type Of Use Code is not allowed.",
      duplicateDescription: "Duplicate Description is not allowed.",
      groupRequired: "Type Of Use Group is required.",
      typeRequired: "Type is required.",
      categoryRequired: "Category is required.",
      saveFailed: "Failed to save. Please try again.",
      maxLength: "must be maximum {count} characters.",
      onlyAlphanumeric: "must contain only letters and numbers (no special characters).",
      allowedChars: "can contain letters (any language), numbers, spaces and (. - ,).",
      sequenceNonNegative: "must be 0 or greater.",
      maxThreeDigits: "must be maximum 3 digits (0-999).",
      searchSequenceLabel: "Key Wise Sequence",
      createError: "Failed to create record",
      updateError: "Failed to update record",
      descriptionRequired: "Description is required.",
      cannotBeAllZeros: "cannot contain only zeros.",
    },
    status: {
      active: "Active",
      inactive: "Inactive",
      is: "is currently",
      isCurrently: "is currently",
    },
    buttons: {
      save: "Save",
      cancel: "Cancel",
      edit: "Update",
    },
  },
  common: {
    buttons: {
      cancel: "Cancel",
      save: "Save",
    },
    actions: {
      loading: "Loading...",
    },
  },
};

const allGroups: UseGroup[] = [
  {
    typeOfUseGroupId: 1,
    typeOfUseGroupCode: "RES",
    groupName: "Residential",
    groupIcon: "home-icon",
    isActive: true,
    status: "Active",
  },
  {
    typeOfUseGroupId: 2,
    typeOfUseGroupCode: "COM",
    groupName: "Commercial",
    groupIcon: "building-icon",
    isActive: true,
    status: "Active",
  },
];

const allTypes: UseType[] = [
  {
    typeOfUseId: 1,
    typeOfUseCode: "RES01",
    description: "Residential Building",
    type: "R",
    typeOfUseGroupId: 1,
    searchSequence: 1,
    isActive: true,
    status: "Active",
  },
  {
    typeOfUseId: 2,
    typeOfUseCode: "COM01",
    description: "Commercial Shop",
    type: "C",
    typeOfUseGroupId: 2,
    searchSequence: 1,
    isActive: true,
    status: "Active",
  },
];

const allCategories: TypeOfUseCategory[] = [
  { id: 1, typeOfUseCategoryCode: 'C01', typeOfUseCategoryName: 'Residential', isActive: true } as TypeOfUseCategory,
];

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe("UseTypeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Add Mode", () => {
    it("should render form in add mode", () => {
      renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      expect(screen.getByText("Add Type of Use")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., RES, COM01, IND")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter description")).toBeInTheDocument();
    });

    it("should validate required fields", async () => {
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateUseType).not.toHaveBeenCalled();
      });
    });

    it("should validate code format (alphanumeric only)", async () => {
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM01, IND");
      // Use an input that passes sanitization (allows underscore) but fails regex (must end with alphanumeric)
      fireEvent.change(codeInput, { target: { value: "RES_" } });
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("only letters and numbers"))).toBeInTheDocument();
      });
    });

    it("should reject code with only zeros", async () => {
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM01, IND");
      fireEvent.change(codeInput, { target: { value: "000" } });
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("cannot contain only zeros"))).toBeInTheDocument();
      });
    });

    it("should validate description format", async () => {
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      const descInput = screen.getByPlaceholderText("Enter description");
      // Use an input that passes sanitization (allows spaces) but fails regex (no double spaces)
      fireEvent.change(descInput, { target: { value: "Test  Description" } });
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("can contain letters"))).toBeInTheDocument();
      });
    });

    it("should detect duplicate type code", async () => {
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM01, IND");
      fireEvent.change(codeInput, { target: { value: "RES01" } });
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("Duplicate Type Of Use Code"))).toBeInTheDocument();
      });
    });

    it("should detect duplicate description", async () => {
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      const descInput = screen.getByPlaceholderText("Enter description");
      fireEvent.change(descInput, { target: { value: "Residential Building" } });
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("Duplicate Description"))).toBeInTheDocument();
      });
    });

    it("should validate sequence is non-negative", async () => {
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      // Fill required fields to bypass HTML5 validation
      fireEvent.change(screen.getByPlaceholderText("e.g., RES, COM01, IND"), { target: { value: "IND01" } });
      fireEvent.change(screen.getByPlaceholderText("Enter description"), { target: { value: "Some description" } });
      { const cb = screen.getByRole("combobox", { name: /use type group.*required/i }); fireEvent.change(cb, { target: { value: "Residential" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }
      { const cb = screen.getByRole("combobox", { name: /^type\s+required$/i }); fireEvent.change(cb, { target: { value: "Industrial" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }
      { const cb = screen.getByRole("combobox", { name: /category/i }); fireEvent.change(cb, { target: { value: "C01 - Residential" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }

      // Now test the sequence field
      const seqInput = screen.getByPlaceholderText("0");
      fireEvent.change(seqInput, { target: { value: "-1" } });
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("must be 0 or greater"))).toBeInTheDocument();
      });
    });

    it("should accept sequence at maximum value (999)", async () => {
      mockCreateUseType.mockResolvedValue({ success: true });

      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText("e.g., RES, COM01, IND"), { target: { value: "IND99" } });
      fireEvent.change(screen.getByPlaceholderText("Enter description"), { target: { value: "Industrial Max Sequence" } });
      { const cb = screen.getByRole("combobox", { name: /use type group.*required/i }); fireEvent.change(cb, { target: { value: "Residential" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }
      { const cb = screen.getByRole("combobox", { name: /^type\s+required$/i }); fireEvent.change(cb, { target: { value: "Industrial" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }
      { const cb = screen.getByRole("combobox", { name: /category/i }); fireEvent.change(cb, { target: { value: "C01 - Residential" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }

      // Test with sequence = 999 (maximum valid)
      const seqInput = screen.getByPlaceholderText("0");
      fireEvent.change(seqInput, { target: { value: "999" } });
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateUseType).toHaveBeenCalledWith({
          groupId: 1,
          code: "IND99",
          description: "Industrial Max Sequence",
          type: "I",
          searchSequence: 999,
          status: "Active",
          typeOfUseCategoryId: 1,
        });
        expect(toast.success).toHaveBeenCalledWith("Type Created");
      });
    });

    it("should reject sequence above maximum (1000) by input restriction", async () => {
      mockCreateUseType.mockResolvedValue({ success: true });
      
      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText("e.g., RES, COM01, IND"), { target: { value: "IND01" } });
      fireEvent.change(screen.getByPlaceholderText("Enter description"), { target: { value: "Some description" } });
      { const cb = screen.getByRole("combobox", { name: /use type group.*required/i }); fireEvent.change(cb, { target: { value: "Residential" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }
      { const cb = screen.getByRole("combobox", { name: /^type\s+required$/i }); fireEvent.change(cb, { target: { value: "Industrial" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }
      { const cb = screen.getByRole("combobox", { name: /category/i }); fireEvent.change(cb, { target: { value: "C01 - Residential" } }); fireEvent.keyDown(cb, { key: "Enter", code: "Enter" }); }

      // Try to set value to 1000 (4 digits) - should be rejected by input restriction
      const seqInput = screen.getByPlaceholderText("0") as HTMLInputElement;
      fireEvent.change(seqInput, { target: { value: "1000" } });
      
      // The input should reject values with more than 3 digits, keeping the original value (0)
      expect(seqInput.value).toBe("0");
      
      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      // Since the value stayed at 0, form should submit successfully (no validation error)
      await waitFor(() => {
        expect(mockCreateUseType).toHaveBeenCalledWith({
          code: "IND01",
          description: "Some description",
          groupId: 1,
          type: "I",
          searchSequence: 0,
          status: "Active",
          typeOfUseCategoryId: 1,
        });
      });
    });

    it("should create type successfully with valid data", async () => {
      mockCreateUseType.mockResolvedValue({ success: true });

      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      // Select group
      const groupSelect = screen.getByRole("combobox", { name: /use type group/i });
      fireEvent.change(groupSelect, { target: { value: "Residential" } }); fireEvent.keyDown(groupSelect, { key: "Enter", code: "Enter" });

      // Fill in type code
      const codeInput = screen.getByPlaceholderText("e.g., RES, COM01, IND");
      fireEvent.change(codeInput, { target: { value: "IND01" } });

      // Fill in description
      const descInput = screen.getByPlaceholderText("Enter description");
      fireEvent.change(descInput, { target: { value: "Industrial Building" } });

      // Select type
      const typeSelect = screen.getByRole("combobox", { name: /^type\s+required$/i });
      fireEvent.change(typeSelect, { target: { value: "Industrial" } }); fireEvent.keyDown(typeSelect, { key: "Enter", code: "Enter" });

      // Select category
      const categorySelect = screen.getByRole("combobox", { name: /category/i });
      fireEvent.change(categorySelect, { target: { value: "C01 - Residential" } }); fireEvent.keyDown(categorySelect, { key: "Enter", code: "Enter" });

      // Fill in sequence
      const seqInput = screen.getByPlaceholderText("0");
      fireEvent.change(seqInput, { target: { value: "1" } });

      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateUseType).toHaveBeenCalledWith({
          groupId: 1,
          code: "IND01",
          description: "Industrial Building",
          type: "I",
          searchSequence: 1,
          status: "Active",
          typeOfUseCategoryId: 1,
        });
        expect(toast.success).toHaveBeenCalledWith("Type Created");
        expect(mockRouterBack).toHaveBeenCalled();
      });
    });

    it("should create type successfully without category (optional field)", async () => {
      mockCreateUseType.mockResolvedValue({ success: true });

      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      // Select group
      const groupSelect = screen.getByRole("combobox", { name: /use type group/i });
      fireEvent.change(groupSelect, { target: { value: "Residential" } }); fireEvent.keyDown(groupSelect, { key: "Enter", code: "Enter" });

      // Fill in type code
      const codeInput = screen.getByPlaceholderText("e.g., RES, COM01, IND");
      fireEvent.change(codeInput, { target: { value: "IND02" } });

      // Fill in description
      const descInput = screen.getByPlaceholderText("Enter description");
      fireEvent.change(descInput, { target: { value: "Industrial Building No Category" } });

      // Select type
      const typeSelect = screen.getByRole("combobox", { name: /^type\s+required$/i });
      fireEvent.change(typeSelect, { target: { value: "Industrial" } }); fireEvent.keyDown(typeSelect, { key: "Enter", code: "Enter" });

      // Leave category unselected

      // Fill in sequence
      const seqInput = screen.getByPlaceholderText("0");
      fireEvent.change(seqInput, { target: { value: "2" } });

      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateUseType).toHaveBeenCalledWith({
          groupId: 1,
          code: "IND02",
          description: "Industrial Building No Category",
          type: "I",
          searchSequence: 2,
          status: "Active",
          typeOfUseCategoryId: null,
        });
        expect(toast.success).toHaveBeenCalledWith("Type Created");
        expect(mockRouterBack).toHaveBeenCalled();
      });
    });

    it("should handle create error", async () => {
      mockCreateUseType.mockResolvedValue({ success: false, message: "Create failed" });

      const { container } = renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      // Fill form with valid data
      const groupSelect = screen.getByRole("combobox", { name: /use type group/i });
      fireEvent.change(groupSelect, { target: { value: "Residential" } }); fireEvent.keyDown(groupSelect, { key: "Enter", code: "Enter" });

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM01, IND");
      fireEvent.change(codeInput, { target: { value: "IND01" } });

      const descInput = screen.getByPlaceholderText("Enter description");
      fireEvent.change(descInput, { target: { value: "Industrial" } });

      const typeSelect = screen.getByRole("combobox", { name: /^type\s+required$/i });
      fireEvent.change(typeSelect, { target: { value: "Industrial" } }); fireEvent.keyDown(typeSelect, { key: "Enter", code: "Enter" });

      const categorySelect = screen.getByRole("combobox", { name: /category/i });
      fireEvent.change(categorySelect, { target: { value: "C01 - Residential" } }); fireEvent.keyDown(categorySelect, { key: "Enter", code: "Enter" });

      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should cancel and go back", () => {
      renderWithIntl(
        <UseTypeForm id={null} allGroups={allGroups} allTypes={allTypes} allCategories={allCategories} />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  describe("Edit Mode", () => {
    const initialData: UseType = {
      typeOfUseId: 1,
      typeOfUseCode: "RES01",
      description: "Residential Building",
      type: "R",
      typeOfUseGroupId: 1,
      searchSequence: 1,
      isActive: true,
      status: "Active",
      typeOfUseCategoryId: 1,
    };

    it("should render form in edit mode with initial data", () => {
      renderWithIntl(
        <UseTypeForm
          id="1"
          initialData={initialData}
          allGroups={allGroups}
          allTypes={allTypes}
          allCategories={allCategories}
        />
      );

      expect(screen.getByText("Edit Type of Use")).toBeInTheDocument();
      expect(screen.getByDisplayValue("RES01")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Residential Building")).toBeInTheDocument();
    });

    it("should update type successfully", async () => {
      mockUpdateUseType.mockResolvedValue({ success: true });

      const { container } = renderWithIntl(
        <UseTypeForm
          id="1"
          initialData={initialData}
          allGroups={allGroups}
          allTypes={allTypes}
        />
      );

      const descInput = screen.getByDisplayValue("Residential Building");
      fireEvent.change(descInput, { target: { value: "Residential Building Updated" } });

      const form = container.querySelector("#use-type-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockUpdateUseType).toHaveBeenCalledWith({
          id: 1,
          groupId: 1,
          code: "RES01",
          description: "Residential Building Updated",
          type: "R",
          searchSequence: 1,
          status: "Active",
          typeOfUseCategoryId: 1,
        });
        expect(toast.success).toHaveBeenCalledWith("Type Updated");
        expect(mockRouterBack).toHaveBeenCalled();
      });
    });

    it("should toggle status", () => {
      renderWithIntl(
        <UseTypeForm
          id="1"
          initialData={initialData}
          allGroups={allGroups}
          allTypes={allTypes}
          allCategories={allCategories}
        />
      );

      const toggleSwitch = screen.getByRole("switch");
      expect(toggleSwitch).toBeChecked();

      fireEvent.click(toggleSwitch);
      expect(toggleSwitch).not.toBeChecked();
    });
  });
});
