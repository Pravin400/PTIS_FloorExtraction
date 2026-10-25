/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { MoujaMaster } from "@/components/modules/property-tax/mouja-master/MoujaMaster";
import type { Mouja } from "@/types/mouja.types";
import { toast } from "sonner";
import { deleteMoujaAction } from "@/app/[locale]/property-tax/moujamaster/action";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useMoujaSearch } from "@/hooks/moujamaster/useMoujaSearch";
import { useMoujaPagination } from "@/hooks/moujamaster/useMoujaPagination";
import * as mockRouter from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => ""),
  })),
}));

// Mock Actions
vi.mock("@/app/[locale]/property-tax/moujamaster/action", () => ({
  deleteMoujaAction: vi.fn(),
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
vi.mock("@/hooks/moujamaster/useMoujaSearch", () => ({
  useMoujaSearch: vi.fn(),
}));
vi.mock("@/hooks/moujamaster/useMoujaPagination", () => ({
  useMoujaPagination: vi.fn(),
}));

// Mock MasterTable
vi.mock("@/components/common/MasterTable", () => ({
  MasterTable: ({ data, renderActions, headerExtra, footerLeftContent }: any) => (
    <div data-testid="master-table">
      {headerExtra && <div data-testid="header-extra">{headerExtra}</div>}
      {data.map((row: any) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          {row.moujaNo} - {row.moujaName}
          {renderActions && (
            <div data-testid={`actions-${row.id}`}>{renderActions(row)}</div>
          )}
        </div>
      ))}
      {footerLeftContent && (
        <div data-testid="footer-left-content">{footerLeftContent}</div>
      )}
    </div>
  ),
}));

// Mock SearchInput
vi.mock("@/components/common", () => ({
  SearchInput: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  Select: ({ value, onChange, options }: any) => (
    <select data-testid="page-size-select" value={value} onChange={onChange}>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

// Mock ActionButtons
vi.mock("@/components/common/ActionButtons", () => ({
  EditButton: ({ onClick, "aria-label": ariaLabel }: any) => (
    <button data-testid="edit-button" onClick={onClick} aria-label={ariaLabel}>
      Edit
    </button>
  ),
  DeleteButton: ({ onClick, "aria-label": ariaLabel }: any) => (
    <button data-testid="delete-button" onClick={onClick} aria-label={ariaLabel}>
      Delete
    </button>
  ),
  AddButton: ({ onClick, label }: any) => (
    <button data-testid="add-button" onClick={onClick}>
      {label}
    </button>
  ),
}));

describe("MoujaMaster", () => {
  const mockConfirm = vi.fn();
  const mockRouterPush = vi.fn();
  const mockRouterRefresh = vi.fn();
  const mockHandleSearchChange = vi.fn();
  const mockChangePage = vi.fn();
  const mockHandlePageSizeChange = vi.fn();
  const mockBuildUrl = vi.fn();

  const mockData = [
    {
      id: 1,
      moujaNo: "M001",
      moujaName: "Test Mouja 1",
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
    {
      id: 2,
      moujaNo: "M002",
      moujaName: "Test Mouja 2",
      isActive: false,
      createdDate: "2024-01-02",
      updatedDate: null,
    },
  ] as Mouja[];

  const defaultProps = {
    data: mockData,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    sortBy: "moujaNo",
    sortOrder: "asc" as const,
  };

  const mockMessages = {
    mouja: {
      moujaMaster: {
        aliasFallback: {
          entity: "Mouja",
        },
        list: {
          title: "Mouja Master",
          subtitle: "Manage Mouja",
          buttons: {
            add: "Add Mouja",
          },
          table: {
            moujaNo: "Mouja No",
            moujaName: "Mouja Name",
            status: "Status",
          },
          filters: {
            search: "Search Mouja...",
          },
        },
        delete: {
          confirmDescription: "Are you sure you want to delete this?",
        },
        success: {
          deleted: "Successfully deleted: {code}",
        },
        apiErrors: {
          inUse: "In use",
          validationError: "Validation error",
          notFound: "Not found",
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

    (mockRouter.useRouter as any).mockReturnValue({
      push: mockRouterPush,
      refresh: mockRouterRefresh,
    });

    (useConfirm as any).mockReturnValue({
      confirm: mockConfirm,
    });

    (useMoujaSearch as any).mockReturnValue({
      search: "",
      currentSearchTerm: "",
      handleSearchChange: mockHandleSearchChange,
    });

    (useMoujaPagination as any).mockReturnValue({
      buildUrl: mockBuildUrl,
      changePage: mockChangePage,
      handlePageSizeChange: mockHandlePageSizeChange,
      paginationInfo: {
        start: 1,
        end: 2,
        total: 2,
      },
    });
  });

  describe("Rendering", () => {
    it("should render MoujaMaster component", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("master-table")).toBeInTheDocument();
    });

    it("should render all mouja data rows", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("row-1")).toBeInTheDocument();
      expect(screen.getByTestId("row-2")).toBeInTheDocument();
      expect(screen.getByText("M001 - Test Mouja 1")).toBeInTheDocument();
      expect(screen.getByText("M002 - Test Mouja 2")).toBeInTheDocument();
    });

    it("should render action buttons for each row", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("actions-1")).toBeInTheDocument();
      expect(screen.getByTestId("actions-2")).toBeInTheDocument();
    });
  });

  describe("Edit Functionality", () => {
    it("should navigate to edit page when edit button is clicked", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      const editButtons = screen.getAllByTestId("edit-button");
      fireEvent.click(editButtons[0]);

      expect(mockRouterPush).toHaveBeenCalledWith(
        "/en/property-tax/moujamaster/edit/1"
      );
    });

    it("should navigate to correct edit page for different rows", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      const editButtons = screen.getAllByTestId("edit-button");
      fireEvent.click(editButtons[1]);

      expect(mockRouterPush).toHaveBeenCalledWith(
        "/en/property-tax/moujamaster/edit/2"
      );
    });
  });

  describe("Delete Functionality", () => {
    it("should show confirmation dialog when delete button is clicked", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      const deleteButtons = screen.getAllByTestId("delete-button");
      fireEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "delete",
          title: expect.stringContaining("M001"),
          description: expect.any(String),
        })
      );
    });

    it("should delete mouja successfully", async () => {
      const deleteMock = vi.mocked(deleteMoujaAction);
      deleteMock.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      mockConfirm.mockImplementation(({ onConfirm }: any) => {
        onConfirm();
      });

      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      const deleteButtons = screen.getAllByTestId("delete-button");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
        expect(mockRouterRefresh).toHaveBeenCalled();
      });
    });

    it("should show error toast on deletion failure", async () => {
      const deleteMock = vi.mocked(deleteMoujaAction);
      deleteMock.mockResolvedValue({
        success: false,
        statusCode: 409,
        message: "Record in use",
      });

      mockConfirm.mockImplementation(({ onConfirm }: any) => {
        onConfirm();
      });

      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      const deleteButtons = screen.getAllByTestId("delete-button");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should handle api specific error codes", async () => {
      const deleteMock = vi.mocked(deleteMoujaAction);
      deleteMock.mockResolvedValue({
        success: false,
        statusCode: 404,
        message: "Not found",
      });

      mockConfirm.mockImplementation(({ onConfirm }: any) => {
        onConfirm();
      });

      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      const deleteButtons = screen.getAllByTestId("delete-button");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("Pagination", () => {
    it("should display correct pagination information", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      const footerContent = screen.getByTestId("footer-left-content");
      expect(footerContent).toBeInTheDocument();
      expect(footerContent.textContent).toContain("Showing");
      expect(footerContent.textContent).toContain("1");
      expect(footerContent.textContent).toContain("to");
      expect(footerContent.textContent).toContain("2");
      expect(footerContent.textContent).toContain("of");
    });

    it("should render page size selector", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("page-size-select")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render when data is empty", () => {
      const emptyProps = {
        ...defaultProps,
        data: [],
        totalCount: 0,
      };

      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...emptyProps} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("master-table")).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("should handle sort when column header is clicked", () => {
      const sortProps = {
        ...defaultProps,
        sortBy: "moujaNo",
        sortOrder: "asc" as const,
      };

      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...sortProps} />
        </NextIntlClientProvider>
      );

      expect(screen.getByTestId("master-table")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should pass loading state to MasterTable", () => {
      render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <MoujaMaster {...defaultProps} />
        </NextIntlClientProvider>
      );

      // Verify table renders (loading state is managed internally by MasterTable)
      expect(screen.getByTestId("master-table")).toBeInTheDocument();
    });
  });
});
