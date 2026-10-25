import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import TypeOfUseMaster from "@/components/modules/property-tax/typeofusemaster/TypeOfUseMaster";
import type { TypeOfUseMasterData, UseGroup, UseType, UseSubType } from "@/types/typeOfUse.types";

// Mocks (reuse from main test file)
const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack }),
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === "groupId") return "1";
      if (key === "typeId") return null;
      if (key === "pn") return "1";
      if (key === "ps") return "2";
      return null;
    }),
  }),
  usePathname: () => "/property-tax/typeofusemaster",
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  return { ...actual, useLocale: () => "en" };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
  }),
}));
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
    group: { title: "Use Groups", add: "Add Use Group", allGroups: "All Groups" },
    type: { title: "Types of Use", add: "Add Type of Use", noTypes: "No types found for selected group.", searchPlaceholder: "Search types..." },
    subtype: { title: "Sub-Types of Use", add: "Add Sub-Type of Use", searchPlaceholder: "Search sub-types...", fields: { status: "Status" } },
    table: { columns: { serial: "#", subTypeName: "Sub-Type Name", searchSequence: "Search Sequence", status: "Status", actions: "Actions" }, showing: "Showing", to: "to", of: "of", records: "records" },
    status: { active: "Active", inactive: "Inactive" },
    buttons: { add: "Add", edit: "Edit", delete: "Delete" },
    messages: { groupDeletedSuccess: "Group deleted successfully", typeDeletedSuccess: "Type deleted successfully", subTypeDeletedSuccess: "Sub-type deleted successfully", duplicateTypeId: "Duplicate Type Of Use Code is not allowed.", duplicateDescription: "Duplicate Description is not allowed." },
    seq: "Sequence",
  },
  common: {
    buttons: { add: "Add", edit: "Edit", delete: "Delete" },
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
  { typeOfUseGroupId: 1, typeOfUseGroupCode: "RES", groupName: "Residential", groupIcon: "home-icon", isActive: true, status: "Active" },
  { typeOfUseGroupId: 2, typeOfUseGroupCode: "COM", groupName: "Commercial", groupIcon: "building-icon", isActive: true, status: "Active" },
];
const mockTypes: UseType[] = [
  { typeOfUseId: 1, typeOfUseCode: "RES01", description: "Residential Building", type: "R", typeOfUseGroupId: 1, searchSequence: 1, isActive: true, status: "Active" },
  { typeOfUseId: 2, typeOfUseCode: "COM01", description: "Commercial Shop", type: "C", typeOfUseGroupId: 2, searchSequence: 1, isActive: true, status: "Active" },
];
const mockSubTypes: UseSubType[] = [
  { subTypeOfUseId: 1, description: "Ground Floor", typeOfUseId: 1, searchSequence: 1, isActive: true, status: "Active" },
  { subTypeOfUseId: 2, description: "First Floor", typeOfUseId: 1, searchSequence: 2, isActive: true, status: "Active" },
];
const mockInitialData: TypeOfUseMasterData = { groups: mockGroups, types: mockTypes, subTypes: [] };

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

describe("TypeOfUseMaster - Paging & URL", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should update page when pagination is used", () => {
    renderWithIntl(
      <TypeOfUseMaster {...createMockProps({
        subTotalPages: 2,
        pageSize: 1,
      })} />
    );
    // Simulate clicking next page (assume a button with label 'Next page' exists)
    const nextBtns = screen.getAllByLabelText(/next page/i);
    const nextBtn = nextBtns.find(btn => !btn.hasAttribute('disabled')) || nextBtns[0];
    fireEvent.click(nextBtn);
    expect(mockRouterPush).toHaveBeenCalled();
  });

  it("should reflect group/type selection in URL", () => {
    renderWithIntl(
      <TypeOfUseMaster {...createMockProps()} />
    );
    // Simulate group selection (assume a button with group name exists)
    const groupBtn = screen.getByText("Commercial");
    fireEvent.click(groupBtn);
    expect(mockRouterPush).toHaveBeenCalled();
  });

  it("should prevent duplicate type codes and descriptions", () => {
    renderWithIntl(
      <TypeOfUseMaster {...createMockProps()} />
    );
    // Simulate trying to add a duplicate type (assume a form/input exists)
    // This is a placeholder: actual implementation depends on your form structure
    // expect(screen.getByText(/duplicate type/i)).toBeInTheDocument();
  });
});
