import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import CategoryListDrawer from "@/components/modules/property-tax/typeofusemaster/CategoryListDrawer";
import type { TypeOfUseCategory } from "@/types/typeOfUse.types";
import { deleteTypeOfUseCategory } from "@/app/[locale]/property-tax/typeofusemaster/actions";
import { toast } from "sonner";

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
  usePathname: () => "/hi/property-tax/typeofusemaster/category",
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === "q") return "";
      return null;
    }),
    toString: () => "",
  }),
}));

// Mock useLocale
vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  return {
    ...actual,
    useLocale: () => "hi",
  };
});

// Mock confirm provider
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn((config) => {
      if (config?.onConfirm) {
        config.onConfirm();
      }
      return Promise.resolve(true);
    }),
  }),
}));

// Mock delete actions
vi.mock("@/app/[locale]/property-tax/typeofusemaster/actions", () => ({
  deleteTypeOfUseCategory: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
    category: {
      title: "Use Category",
      searchPlaceholder: "Search category...",
      addNew: "Add Category",
      noCategories: "No categories found.",
      fields: {
        categoryCode: "Category Code",
        categoryName: "Category Name",
        status: "Status",
      },
      messages: {
        categoryDeleted: "Category Deleted successfully",
        inUseError: "The category \"{name}\" cannot be deleted because types are currently associated with it.",
        deleteFailed: "Failed to delete category.",
      },
    },
    buttons: {
      edit: "Edit",
      delete: "Delete",
    },
    messages: {
      deleteConfirmation: "Are you sure you want to delete this?",
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
    table: {
      showingEntries: "Showing {start} to {end} of {total} entries",
      page: "Page",
      columns: {
        actions: "Actions",
      },
    },
  },
};

const mockCategories: TypeOfUseCategory[] = [
  {
    id: 1,
    typeOfUseCategoryCode: "CAT01",
    typeOfUseCategoryName: "Residential",
    isActive: true,
  },
];

describe("CategoryListDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithIntl = (ui: React.ReactElement) => {
    return render(
      <NextIntlClientProvider locale="hi" messages={mockMessages}>
        {ui}
      </NextIntlClientProvider>
    );
  };

  it("should render categories list drawer correctly", () => {
    renderWithIntl(<CategoryListDrawer categories={mockCategories} />);
    expect(screen.getByText("Use Category")).toBeInTheDocument();
    expect(screen.getByText("CAT01")).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
  });

  it("should navigate to main page with Hindi locale on close", () => {
    renderWithIntl(<CategoryListDrawer categories={mockCategories} />);
    
    // Find close button by close icon/text/role
    // Drawer onClose is triggered by Close button
    const closeIcon = screen.getByTestId("x-icon");
    const closeBtn = closeIcon.closest("button");
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(mockRouterPush).toHaveBeenCalledWith("/hi/property-tax/typeofusemaster");
    }
  });

  it("should navigate to add category page with Hindi locale on Add click", () => {
    renderWithIntl(<CategoryListDrawer categories={mockCategories} />);
    
    const addButton = screen.getByRole("button", { name: /Add Category/i });
    fireEvent.click(addButton);
    
    expect(mockRouterPush).toHaveBeenCalledWith("/hi/property-tax/typeofusemaster/category/add");
  });

  it("should navigate to edit category page with Hindi locale on Edit click", () => {
    renderWithIntl(<CategoryListDrawer categories={mockCategories} />);
    
    const editButton = screen.getAllByRole("button", { name: /Edit/i })[0];
    fireEvent.click(editButton);
    
    expect(mockRouterPush).toHaveBeenCalledWith("/hi/property-tax/typeofusemaster/category/edit/1");
  });

  it("should display localized inUseError error toast when delete category fails with 409 Conflict", async () => {
    vi.mocked(deleteTypeOfUseCategory).mockResolvedValueOnce({
      success: false,
      statusCode: 409,
      message: "Cannot delete this record because it is still referenced",
    });
    
    renderWithIntl(<CategoryListDrawer categories={mockCategories} />);
    
    const deleteButton = screen.getAllByRole("button", { name: /Delete/i })[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(deleteTypeOfUseCategory).toHaveBeenCalledWith(1);
      expect(toast.error).toHaveBeenCalledWith("The category \"Residential\" cannot be deleted because types are currently associated with it.");
    });
  });

  it("should display success toast when delete category succeeds", async () => {
    vi.mocked(deleteTypeOfUseCategory).mockResolvedValueOnce({
      success: true,
    });
    
    renderWithIntl(<CategoryListDrawer categories={mockCategories} />);
    
    const deleteButton = screen.getAllByRole("button", { name: /Delete/i })[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(deleteTypeOfUseCategory).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith("Category Deleted successfully");
    });
  });
});
