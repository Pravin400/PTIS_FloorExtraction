/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { PropertyTypeMaster } from "@/components/modules/property-tax/property-type-master/PropertyTypeMaster";
import { usePropertyTypeMasterHandlers } from "@/hooks/usePropertyTypeMasterHandlers";
import type { PropertyType } from "@/types/property-type.types";
import { deletePropertyTypeAction } from "@/app/[locale]/property-tax/propertytype/action";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { usePropertyTypeSearch } from "@/hooks/usePropertyTypeSearch";
import { usePropertyTypePagination } from "@/hooks/usePropertyTypePagination";
import * as mockRouter from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock Actions
vi.mock("@/app/[locale]/property-tax/propertytype/action", () => ({
  deletePropertyTypeAction: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock hooks
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(),
}));
vi.mock("@/hooks/usePropertyTypeSearch", () => ({
  usePropertyTypeSearch: vi.fn(),
}));
vi.mock("@/hooks/usePropertyTypePagination", () => ({
  usePropertyTypePagination: vi.fn(),
}));

// Mock MasterTable (Avoid testing MasterTable's internals here)
vi.mock("@/components/common/MasterTable", () => ({
  MasterTable: ({ data, renderActions }: any) => (
    <div data-testid="master-table">
      {data.map((row: any) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          {row.propertyDescription}
          {renderActions && (
            <div data-testid={`actions-${row.id}`}>
              {renderActions(row)}
            </div>
          )}
        </div>
      ))}
    </div>
  ),
}));

// Mock TypeOfUseModal (to isolate test)
vi.mock("@/components/modules/property-tax/property-type-master/TypeOfUseModal", () => ({
  default: ({ open, onClose }: any) => (
    open ? <div data-testid="type-of-use-modal"><button onClick={onClose}>Close Modal</button></div> : null
  )
}));

describe("PropertyTypeMaster", () => {
  const mockConfirm = vi.fn();
  const mockRouterPush = vi.fn();
  const mockRouterRefresh = vi.fn();

  const mockData = [
    { id: 1, propertyDescription: "Desc 1", type: "R", propertyTypeGroup: "G1", propertyTypeCategoryId: 1, searchSequence: 1, isActive: true },
    { id: 2, propertyDescription: "Desc 2", type: "C", propertyTypeGroup: "G2", propertyTypeCategoryId: 2, searchSequence: 2, isActive: true },
  ] as PropertyType[];

  const defaultProps = {
    data: mockData,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    categories: [],
    typeOfUseList: [],
    typeOfUseValidation: [],
  };

  const mockMessages = {
    propertyType: {
      propertyType: {
        aliasFallback: {
          category: "Category",
          typeOfUse: "Type of Use",
          ward: "Ward",
          entity: "Property Type",
        },
        list: {
          title: "Property Type Master",
          subtitle: "Manage Property Types",
          buttons: {
            add: "Add Property Type",
          },
          table: {
            descriptionEnglish: "English Description",
            propertyDescription: "Regional Description",
            type: "Type",
            propertyTypeGroup: "Group",
            category: "Category",
            searchSequence: "Sequence",
            typeOfUseValidation: "Validations",
            status: "Status",
          },
          filters: {
            search: "Search Property Type...",
          },
        },
        delete: {
          confirmDescription: "Are you sure you want to delete this?",
        },
        success: {
          deleted: "Successfully deleted",
        },
        apiErrors: {
          inUse: "In use",
          validationError: "Validation error",
          notFound: "Not found",
          referredInAutoWardEntry: "Cannot delete this record as it is referred in Auto {ward} Entry",
        },
      },
    },
    common: {
      buttons: {
        add: "Add",
      },
      table: {
        actions: {
          edit: "Edit",
          delete: "Delete",
        },
        showing: "Showing",
        to: "to",
        of: "of",
        entries: "entries",
        rowsPerPage: "Rows per page",
        columns: {
          actions: "Actions",
        },
      },
      errors: {
        deleteError: "Delete error",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(mockRouter.useRouter).mockReturnValue({
      push: mockRouterPush,
      refresh: mockRouterRefresh,
    } as any);

    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm } as any);
    
    vi.mocked(usePropertyTypeSearch).mockReturnValue({
      search: "",
      currentSearchTerm: "",
      handleSearchChange: vi.fn(),
    } as any);

    vi.mocked(usePropertyTypePagination).mockReturnValue({
      buildUrl: vi.fn().mockReturnValue("/mock-url"),
      changePage: vi.fn(),
      handlePageSizeChange: vi.fn(),
      paginationInfo: { start: 1, end: 2, total: 2 },
    } as any);
  });

  const setup = (props = {}) => {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <PropertyTypeMaster {...defaultProps} {...props} />
      </NextIntlClientProvider>
    );
  };

  it("renders page title and subtitle", () => {
    setup();
    expect(screen.getByText("Property Type Master")).toBeInTheDocument();
    expect(screen.getByText("Manage Property Types")).toBeInTheDocument();
  });

  it("navigates to add page on add button click", () => {
    setup();
    const addBtn = screen.getByText("Add Property Type");
    fireEvent.click(addBtn);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/property-tax/propertytype/add");
  });

  it("renders MasterTable with data", () => {
    setup();
    expect(screen.getByTestId("master-table")).toBeInTheDocument();
    expect(screen.getByText("Desc 1")).toBeInTheDocument();
    expect(screen.getByText("Desc 2")).toBeInTheDocument();
  });

  it("navigates to edit page on edit button click", () => {
    setup();
    const actions1 = screen.getByTestId("actions-1");
    // Assume edit button is the first action (or we can query by aria-label)
    const editBtn = actions1.querySelector('[aria-label="Edit"]');
    fireEvent.click(editBtn!);
    
    expect(mockRouterPush).toHaveBeenCalledWith("/en/property-tax/propertytype/edit/1");
  });

  it("does not render a delete button on this screen", () => {
    setup();

    const actions1 = screen.getByTestId("actions-1");
    const deleteBtn = actions1.querySelector('[aria-label="Delete"]');

    expect(deleteBtn).not.toBeInTheDocument();
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(deletePropertyTypeAction).not.toHaveBeenCalled();
  });

  describe("usePropertyTypeMasterHandlers handleDelete label matching", () => {
    const mockT = vi.fn((key: string) => key) as any;
    const mockTCommon = vi.fn((key: string) => key) as any;

    it("sets English description label when descriptionEnglish is present", () => {
      const { result } = renderHook(() =>
        usePropertyTypeMasterHandlers({
          locale: "en",
          t: mockT,
          tCommon: mockTCommon,
          confirm: mockConfirm,
          startTransition: (fn) => fn(),
        })
      );

      const rowWithEng = {
        id: 1,
        propertyDescription: "Regional Text",
        descriptionEnglish: "English Text",
      } as unknown as PropertyType;

      result.current.handleDelete(rowWithEng);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "delete",
          title: "list.table.descriptionEnglish: English Text",
          meta: { name: "English Text" },
        })
      );
    });

    it("sets Regional description label when only propertyDescription is present", () => {
      const { result } = renderHook(() =>
        usePropertyTypeMasterHandlers({
          locale: "en",
          t: mockT,
          tCommon: mockTCommon,
          confirm: mockConfirm,
          startTransition: (fn) => fn(),
        })
      );

      const rowRegionalOnly = {
        id: 2,
        propertyDescription: "Regional Text",
      } as unknown as PropertyType;

      result.current.handleDelete(rowRegionalOnly);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "delete",
          title: "list.table.propertyDescription: Regional Text",
          meta: { name: "Regional Text" },
        })
      );
    });
  });
});
