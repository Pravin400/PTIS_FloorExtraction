import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditTrailContainer } from "@/components/modules/property-tax/PropertyMedia/AuditTrail/AuditTrailContainer";
import { useAuditTrail } from "@/hooks/PropertyMedia/useAuditTrail";
import { ActivityLog } from "@/types/PropertyMedia/PropertyMedia.types";

const mockHandleDrawerClose = vi.fn();
const mockHandlePageChange = vi.fn();
const mockHandlePageSizeChange = vi.fn();
const mockHandleExport = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/PropertyMedia/useAuditTrail", () => ({
  useAuditTrail: vi.fn(),
}));

describe("AuditTrailContainer", () => {
  const mockLogs: ActivityLog[] = [
    {
      dateTime: "2026-05-01 09:00",
      user: "Surveyor1",
      action: "Local Upload",
      category: "Building Photo",
      result: 15,
    },
    {
      dateTime: "2026-05-01 10:30",
      user: "Admin",
      action: "Bulk Import",
      category: "Building Plan",
      result: 25,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuditTrail as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isDrawerOpen: true,
      handleDrawerClose: mockHandleDrawerClose,
      paginatedData: mockLogs,
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
      handlePageChange: mockHandlePageChange,
      handlePageSizeChange: mockHandlePageSizeChange,
      handleExport: mockHandleExport,
      isExporting: false,
      t: (key: string, values?: Record<string, string | number>) =>
        values?.count !== undefined ? `${values.count} ${key}` : key,
    });
  });

  it("renders drawer title, export buttons, and activity logs in table", () => {
    render(<AuditTrailContainer />);

    expect(screen.getByText("auditTrailDrawer.title")).toBeInTheDocument();
    expect(screen.getByText("auditTrailDrawer.excel")).toBeInTheDocument();
    expect(screen.getByText("auditTrailDrawer.pdf")).toBeInTheDocument();

    expect(screen.getByText("Surveyor1")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("15 auditTrailDrawer.table.uploadedCount")).toBeInTheDocument();
    expect(screen.getByText("25 auditTrailDrawer.table.uploadedCount")).toBeInTheDocument();
  });

  it("calls handleExport(0) when Excel export button is clicked", () => {
    render(<AuditTrailContainer />);

    const excelBtn = screen.getByText("auditTrailDrawer.excel");
    fireEvent.click(excelBtn);

    expect(mockHandleExport).toHaveBeenCalledWith(0);
  });

  it("calls handleExport(1) when PDF export button is clicked", () => {
    render(<AuditTrailContainer />);

    const pdfBtn = screen.getByText("auditTrailDrawer.pdf");
    fireEvent.click(pdfBtn);

    expect(mockHandleExport).toHaveBeenCalledWith(1);
  });

  it("disables export buttons when isExporting is true", () => {
    (useAuditTrail as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isDrawerOpen: true,
      handleDrawerClose: mockHandleDrawerClose,
      paginatedData: mockLogs,
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
      handlePageChange: mockHandlePageChange,
      handlePageSizeChange: mockHandlePageSizeChange,
      handleExport: mockHandleExport,
      isExporting: true,
      t: (key: string) => key,
    });

    render(<AuditTrailContainer />);

    expect(screen.getByText("auditTrailDrawer.excel").closest("button")).toBeDisabled();
    expect(screen.getByText("auditTrailDrawer.pdf").closest("button")).toBeDisabled();
  });
});
