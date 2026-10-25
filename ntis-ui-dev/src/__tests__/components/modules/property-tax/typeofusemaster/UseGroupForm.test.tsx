import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import UseGroupForm from "@/components/modules/property-tax/typeofusemaster/UseGroupForm";
import type { UseGroup } from "@/types/typeOfUse.types";
import { toast } from "sonner";

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
  }),
  usePathname: () => "/property-tax/typeofusemaster/group/add",
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
  createUseGroup: vi.fn(),
  updateUseGroup: vi.fn(),
}));

import { createUseGroup, updateUseGroup } from "@/app/[locale]/property-tax/typeofusemaster/actions";
const mockCreateUseGroup = vi.mocked(createUseGroup);
const mockUpdateUseGroup = vi.mocked(updateUseGroup);

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
      add: "Add Use Group",
      addSubtitle: "Create a new Use Group",
      edit: "Edit Use Group",
      editSubtitle: "Update existing Use Group",
      mandatoryNote: "Fields marked with * are mandatory",
      title: "Use Groups",
      fields: {
        groupId: "Group ID Code",
        groupName: "Group Name",
        iconType: "Icon Type",
        status: "Active Status",
      },
      placeholders: {
        groupId: "e.g., RES, COM, IND01",
        groupName: "e.g., Residential, Local",
      },
    },
    messages: {
      groupCreated: "Use Group Created",
      groupUpdated: "Use Group Updated",
      duplicateGroupId: "Duplicate group id is not allowed.",
      duplicateGroupName: "Duplicate group name is not allowed.",
      saveFailed: "Failed to save. Please try again.",
      maxLength: "must be maximum {count} characters.",
      onlyAlphanumeric: "must contain only letters and numbers (no special characters).",
      allowedChars: "can contain letters (any language), numbers, spaces and (. - ,).",
      atLeastOneLetter: "must contain at least one letter.",
      cannotBeAllZeros: "cannot contain only zeros.",
      createError: "Failed to create record",
      updateError: "Failed to update record",
      createGroupFailed: "Failed to create group",
    },
    status: {
      active: "Active",
      inactive: "Inactive",
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

const existingGroups: UseGroup[] = [
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

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe("UseGroupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Add Mode", () => {
    it("should render form in add mode", () => {
      renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      expect(screen.getByText("Add Use Group")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., RES, COM, IND01")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., Residential, Local")).toBeInTheDocument();
    });

    it("should validate required fields", async () => {
      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateUseGroup).not.toHaveBeenCalled();
      });
    });

    it("should validate code format (alphanumeric only)", async () => {
      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM, IND01");
      // Use an input that passes sanitization (allows underscore) but fails regex (must end with alphanumeric)
      fireEvent.change(codeInput, { target: { value: "RES_" } });
      
      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/must contain only letters and numbers/i)).toBeInTheDocument();
      });
    });

    it("should reject group code with only zeros", async () => {
      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM, IND01");
      fireEvent.change(codeInput, { target: { value: "000" } });
      
      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("cannot contain only zeros"))).toBeInTheDocument();
      });
    });

    it("should reject group name with only zeros", async () => {
      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM, IND01");
      const nameInput = screen.getByPlaceholderText("e.g., Residential, Local");

      fireEvent.change(codeInput, { target: { value: "IND" } });
      fireEvent.change(nameInput, { target: { value: "000" } });
      
      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText((content) => content.includes("cannot contain only zeros"))).toBeInTheDocument();
      });
    });

    it("should detect duplicate group code", async () => {
      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM, IND01");
      const nameInput = screen.getByPlaceholderText("e.g., Residential, Local");

      fireEvent.change(codeInput, { target: { value: "RES" } });
      fireEvent.change(nameInput, { target: { value: "New Residential" } });
      
      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/Duplicate group id is not allowed/i)).toBeInTheDocument();
      });
    });

    it("should detect duplicate group name", async () => {
      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM, IND01");
      const nameInput = screen.getByPlaceholderText("e.g., Residential, Local");

      fireEvent.change(codeInput, { target: { value: "RES01" } });
      fireEvent.change(nameInput, { target: { value: "Residential" } });
      
      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/Duplicate group name is not allowed/i)).toBeInTheDocument();
      });
    });

    it("should create group successfully with valid data", async () => {
      mockCreateUseGroup.mockResolvedValue({ success: true });

      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM, IND01");
      const nameInput = screen.getByPlaceholderText("e.g., Residential, Local");

      fireEvent.change(codeInput, { target: { value: "IND" } });
      fireEvent.change(nameInput, { target: { value: "Industrial" } });

      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateUseGroup).toHaveBeenCalledWith({
          code: "IND",
          name: "Industrial",
          icon: "home",
          status: "Active",
        });
        expect(toast.success).toHaveBeenCalledWith("Use Group Created");
        expect(mockRouterBack).toHaveBeenCalled();
      });
    });

    it("should handle create error", async () => {
      mockCreateUseGroup.mockResolvedValue({ success: false, message: "Create failed" });

      const { container } = renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const codeInput = screen.getByPlaceholderText("e.g., RES, COM, IND01");
      const nameInput = screen.getByPlaceholderText("e.g., Residential, Local");

      fireEvent.change(codeInput, { target: { value: "IND" } });
      fireEvent.change(nameInput, { target: { value: "Industrial" } });

      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should cancel and go back", () => {
      renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  describe("Edit Mode", () => {
    const initialData: UseGroup = {
      typeOfUseGroupId: 1,
      typeOfUseGroupCode: "RES",
      groupName: "Residential",
      groupIcon: "home-icon",
      isActive: true,
      status: "Active",
    };

    it("should render form in edit mode with initial data", () => {
      renderWithIntl(
        <UseGroupForm id="1" initialData={initialData} allGroups={existingGroups} />
      );

      expect(screen.getByText("Edit Use Group")).toBeInTheDocument();
      expect(screen.getByDisplayValue("RES")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Residential")).toBeInTheDocument();
    });

    it("should update group successfully", async () => {
      mockUpdateUseGroup.mockResolvedValue({ success: true });

      const { container } = renderWithIntl(
        <UseGroupForm id="1" initialData={initialData} allGroups={existingGroups} />
      );

      const nameInput = screen.getByDisplayValue("Residential");
      fireEvent.change(nameInput, { target: { value: "Residential Updated" } });

      const form = container.querySelector("#use-group-form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockUpdateUseGroup).toHaveBeenCalledWith({
          id: 1,
          code: "RES",
          name: "Residential Updated",
          icon: "home",
          status: "Active",
        });
        expect(toast.success).toHaveBeenCalledWith("Use Group Updated");
        expect(mockRouterBack).toHaveBeenCalled();
      });
    });

    it("should toggle status", () => {
      renderWithIntl(
        <UseGroupForm id="1" initialData={initialData} allGroups={existingGroups} />
      );

      const toggleSwitch = screen.getByRole("switch");
      expect(toggleSwitch).toBeChecked();

      fireEvent.click(toggleSwitch);
      expect(toggleSwitch).not.toBeChecked();
    });
  });

  describe("Icon Selection", () => {
    it("should allow icon selection", async () => {
      renderWithIntl(<UseGroupForm id={null} allGroups={existingGroups} />);

      // The icon dropdown should be present
      const iconButtons = screen.getAllByRole("button");
      const iconDropdown = iconButtons.find(btn => btn.getAttribute('aria-haspopup') === 'true');
      
      if (iconDropdown) {
        fireEvent.click(iconDropdown);
        // Icon options should appear
        await waitFor(() => {
          expect(screen.getByText(/home/i)).toBeInTheDocument();
        });
      }
    });
  });
});
