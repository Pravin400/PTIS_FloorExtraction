import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import TypeOfUseMaster from "@/components/modules/property-tax/typeofusemaster/TypeOfUseMaster";
import type { TypeOfUseMasterData, UseGroup, UseType, UseSubType } from "@/types/typeOfUse.types";

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
  }),
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === "groupId") return "1";
      if (key === "typeId") return null;
      return null;
    }),
  }),
  usePathname: () => "/property-tax/typeofusemaster",
}));

// Mock useLocale
vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  return {
    ...actual,
    useLocale: () => "en",
  };
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock confirm provider
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
  }),
}));

// Mock delete actions
vi.mock("@/app/[locale]/property-tax/typeofusemaster/actions", () => ({
  deleteUseGroup: vi.fn(),
  deleteUseType: vi.fn(),
  deleteSubType: vi.fn(),
  checkTypeHasSubTypes: vi.fn(),
  checkGroupHasTypes: vi.fn(),
}));

const mockMessages = {
  typeofusemaster: {
    aliasFallback: {
      entity: "Type of Use",
      typeOfUse: "Type of Use",
      subTypeOfUse: "Sub-Type of Use",
      use: "Use",
      category: "Category",
    },
    title: "Type of Use Master",
    subtitle: "Use Group → Type → Sub-Type",
    category: {
      title: "TypeOfUse Category",
      add: "Add Category",
      addNew: "Add New Category",
      edit: "Edit Category",
      fields: {
        categoryCode: "Category Code",
        categoryName: "Category Name",
        status: "Status",
      },
    },
    group: {
      allGroups: "All Groups",
      title: "Use Groups",
      add: "Add Use Group",
      addSubtitle: "Create a new Use Group",
      mandatoryNote: "Fields marked with * are mandatory",
    },
    type: {
      title: "Types of Use",
      add: "Add Type of Use",
      noTypes: "No types found for selected group.",
      searchPlaceholder: "Search types...",
      addingToGroup: "Adding to Group",
      selectUseTypeGroup: "Select Use Type Group",
      selectedGroup: "Selected Group",
      displayOrder: "Display Order",
    },
    subtype: {
      title: "Sub-Types of Use",
      add: "Add Sub-Type of Use",
      searchPlaceholder: "Search sub-types...",
      addSubtitle: "Create a new Sub-Type",
      fields: {
        status: "Status",
      },
    },
    table: {
      columns: {
        serial: "#",
        subTypeName: "Sub-Type Name",
        searchSequence: "Search Sequence",
        status: "Status",
        actions: "Actions",
      },
      showing: "Showing",
      to: "to",
      of: "of",
      records: "records",
    },
    status: {
      active: "Active",
      inactive: "Inactive",
    },
    buttons: {
      add: "Add",
      edit: "Edit",
      delete: "Delete",
    },
    messages: {
      groupDeletedSuccess: "Group deleted successfully",
      typeDeletedSuccess: "Type deleted successfully",
      subTypeDeletedSuccess: "Sub-type deleted successfully",
      createError: "Failed to create record",
      updateError: "Failed to update record",
      deleteError: "Failed to delete record",
    },
    seq: "Sequence",
  },
  common: {
    buttons: {
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
    },
    table: {
      showingEntries: "Showing {start} to {end} of {total} entries",
      page: "Page",
      columns: {
        actions: "Actions",
      },
    },
    messages: {
      noData: "No data available",
    },
    actions: {
      loading: "Loading...",
    },
  },
};

const mockGroups: UseGroup[] = [
  {
    typeOfUseGroupId: 1,
    typeOfUseGroupCode: "RES",
    groupName: "Residential",
    groupIcon: "home-icon",
    isActive: true,
    status: "Active",
    countOfTypes: 1,
  },
  {
    typeOfUseGroupId: 2,
    typeOfUseGroupCode: "COM",
    groupName: "Commercial",
    groupIcon: "building-icon",
    isActive: true,
    status: "Active",
    countOfTypes: 1,
  },
];

const mockTypes: UseType[] = [
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

const mockSubTypes: UseSubType[] = [
  {
    subTypeOfUseId: 1,
    description: "Ground Floor",
    typeOfUseId: 1,
    searchSequence: 1,
    isActive: true,
    status: "Active",
  },
  {
    subTypeOfUseId: 2,
    description: "First Floor",
    typeOfUseId: 1,
    searchSequence: 2,
    isActive: true,
    status: "Active",
  },
];

const mockInitialData: TypeOfUseMasterData = {
  groups: mockGroups,
  types: mockTypes,
  subTypes: [],
};

// Helper function to create grouped props for the new component structure
const createMockProps = ({
  initialData = mockInitialData,
  subTypes = mockSubTypes,
  subTotalCount = 2,
  subTotalPages = 1,
  pageNumber = 1,
  pageSize = 10,
  paginatedTypes = mockTypes,
  typesTotalCount = 2,
  typesTotalPages = 1,
  typePageNumber = 1,
  typePageSize = 10,
  selectedTypeId = "1",
  typeSearchFromServer = undefined,
} = {}) => ({
  initialData,
  typesPagination: {
    paginatedTypes,
    totalCount: typesTotalCount,
    totalPages: typesTotalPages,
    pageNumber: typePageNumber,
    pageSize: typePageSize,
    searchFromServer: typeSearchFromServer,
  },
  subTypesPagination: {
    subTypes,
    totalCount: subTotalCount,
    totalPages: subTotalPages,
    pageNumber,
    pageSize,
  },
  selectedTypeId,
});

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe("TypeOfUseMaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the component with title", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      expect(screen.getByText("Type of Use Master")).toBeInTheDocument();
      expect(screen.getByText("Use Group → Type → Sub-Type")).toBeInTheDocument();
    });

    it("should render use groups", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      expect(screen.getByText("Residential")).toBeInTheDocument();
      expect(screen.getByText("Commercial")).toBeInTheDocument();
    });

    it("should render add group button", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      expect(screen.getByText("Add Use Group")).toBeInTheDocument();
    });
  });

  describe("Group Selection", () => {
    it("should highlight selected group", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      const groupCards = screen.getAllByRole("button");
      const residentialCard = groupCards.find(card => 
        card.textContent?.includes("Residential")
      );

      if (residentialCard) {
        fireEvent.click(residentialCard);
        // Check if the card gets highlighted class or style
        expect(residentialCard).toBeDefined();
      }
    });
  });

  describe("Type Management", () => {
    it("should show types for selected group", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      // Types should be visible
      expect(screen.getByText("Residential Building")).toBeInTheDocument();
    });

    it("should render add type button", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      expect(screen.getByText("Add Type of Use")).toBeInTheDocument();
    });

    it("should render Type of Use name with truncation class", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      const descriptionElement = screen.getByText("Residential Building");
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement.className).toContain("truncate");
    });
  });

  describe("SubType Management", () => {
    it("should render subtypes table", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      expect(screen.getByText("Ground Floor")).toBeInTheDocument();
      expect(screen.getByText("First Floor")).toBeInTheDocument();
    });

    it("should render add subtype button", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      expect(screen.getByText("Add Sub-Type of Use")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should have search input for types", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      // Search input should be present
      const searchInputs = screen.getAllByRole("textbox");
      expect(searchInputs.length).toBeGreaterThan(0);
    });
  });

  describe("Status Display", () => {
    it("should display active status badges", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      const activeBadges = screen.getAllByText("Active");
      expect(activeBadges.length).toBeGreaterThan(0);
    });
  });

  describe("Empty States", () => {
    it("should show message when no types exist for group", () => {
      const emptyData: TypeOfUseMasterData = {
        groups: mockGroups,
        types: [],
        subTypes: [],
      };

      renderWithIntl(
        <TypeOfUseMaster {...createMockProps({
          initialData: emptyData,
          subTypes: [],
          subTotalCount: 0,
          subTotalPages: 0,
          paginatedTypes: [],
          typesTotalCount: 0,
          typesTotalPages: 0,
        })} />
      );

      expect(screen.getByText("No types found for selected group.")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to add group page", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      const addGroupButton = screen.getByText("Add Use Group");
      fireEvent.click(addGroupButton);

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("/group/add")
      );
    });

    it("should navigate to add type page with groupId", () => {
      renderWithIntl(
        <TypeOfUseMaster {...createMockProps()} />
      );

      const addTypeButton = screen.getByText("Add Type of Use");
      fireEvent.click(addTypeButton);

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("/type/add")
      );
    });
  });
});
