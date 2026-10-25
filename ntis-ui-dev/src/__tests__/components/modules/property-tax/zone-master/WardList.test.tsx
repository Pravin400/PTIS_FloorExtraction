import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WardList from "@/components/modules/property-tax/zone-master/wards/WardList";
import { WardItem } from "@/types/wardMaster.types";
import { ZoneItem } from "@/types/zoneMaster.types";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    toString: () => "zoneId=1&wardPage=1",
    get: (key: string) => key === "zoneId" ? "1" : null,
  }),
  usePathname: () => "/en/property-tax/zone-master",
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) {
      return `${key}: ${JSON.stringify(values)}`;
    }
    return key;
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock actions
const mockDeleteWardAction = vi.fn();

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  deleteWardAction: (id: number) => mockDeleteWardAction(id),
}));

// Mock common components
vi.mock("@/components/common", () => ({
  AddButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button data-testid="add-button" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  EditButton: ({ onClick, "aria-label": ariaLabel }: { onClick: () => void; "aria-label"?: string }) => (
    <button data-testid="edit-button" onClick={onClick} aria-label={ariaLabel}>Edit</button>
  ),
  DeleteButton: ({ onClick, "aria-label": ariaLabel }: { onClick: () => void; "aria-label"?: string }) => (
    <button data-testid="delete-button" onClick={onClick} aria-label={ariaLabel}>Delete</button>
  ),
  SearchInput: ({ value, onChange, placeholder, className: _className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  StatusBadge: ({ label, variant: _variant }: { label: string; variant?: string }) => (
    <span data-testid="status-badge">{label}</span>
  ),
  useConfirm: () => ({
    confirm: ({ onConfirm }: { onConfirm: () => void }) => onConfirm(),
  }),
}));

vi.mock("@/components/common/MasterTable", () => ({
  MasterTable: ({ columns, data, emptyText, renderActions }: {
    columns: Array<{ key: string; header: string }>;
    data: Record<string, unknown>[];
    emptyText: string;
    renderActions?: (row: Record<string, unknown>) => React.ReactNode;
  }) => (
    <div data-testid="master-table">
      {data.length === 0 ? (
        <div data-testid="empty-text">{emptyText}</div>
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} data-testid="ward-row">
                {columns.map((col) => (
                  <td key={col.key}>{String(row[col.key] ?? "")}</td>
                ))}
                {renderActions && (
                  <td>{renderActions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ),
}));

vi.mock("@/components/modules/property-tax/zone-master/wards/wardColumns", () => ({
  getWardColumns: () => [
    { key: "srNo", header: "Sr. No." },
    { key: "wardNo", header: "Ward No" },
    { key: "description", header: "Description" },
    { key: "isActive", header: "Status" },
  ],
}));

describe("WardList", () => {
  const mockZones: ZoneItem[] = [
    { id: 1, zoneNo: "UT", description: "उथळसर", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null },
    { id: 2, zoneNo: "NK", description: "नौपाडा", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null },
  ];

  const mockCurrentZone: ZoneItem = {
    id: 1,
    zoneNo: "UT",
    description: "उथळसर",
    isActive: true,
    createdDate: "2026-04-09",
    updatedDate: null,
    sequenceNo: null,
    wardCount: 5,
  };

  const mockWards: WardItem[] = [
    { id: 1, wardNo: "UT1", zoneId: 1, description: "UT1", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null },
    { id: 2, wardNo: "UT2", zoneId: 1, description: "UT2", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null },
    { id: 3, wardNo: "UT3", zoneId: 1, description: "UT3", isActive: false, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ward list when zone is selected", () => {
    render(
      <WardList
        wards={mockWards}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        zones={mockZones}
        currentZone={mockCurrentZone}
      />
    );

    expect(screen.getByTestId("master-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("ward-row")).toHaveLength(3);
  });

  it("renders empty state when no wards", () => {
    render(
      <WardList
        wards={[]}
        pageNumber={1}
        pageSize={10}
        totalCount={0}
        totalPages={0}
        selectedZoneId={1}
        zones={mockZones}
        currentZone={mockCurrentZone}
      />
    );

    expect(screen.getByTestId("empty-text")).toBeInTheDocument();
  });

  it("renders select zone prompt when no zone selected", () => {
    render(
      <WardList
        wards={[]}
        pageNumber={1}
        pageSize={10}
        totalCount={0}
        totalPages={0}
        selectedZoneId={null}
        zones={mockZones}
      />
    );

    expect(screen.getByText(/wardList\.selectZonePrompt/)).toBeInTheDocument();
  });

  it("renders link ward button", () => {
    render(
      <WardList
        wards={mockWards}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        zones={mockZones}
        currentZone={mockCurrentZone}
      />
    );

    const addButtons = screen.getAllByTestId("add-button");
    expect(addButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders search input when zone is selected", () => {
    render(
      <WardList
        wards={mockWards}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        zones={mockZones}
        currentZone={mockCurrentZone}
      />
    );

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("disables link ward button when no zone selected", () => {
    render(
      <WardList
        wards={[]}
        pageNumber={1}
        pageSize={10}
        totalCount={0}
        totalPages={0}
        selectedZoneId={null}
        zones={mockZones}
      />
    );

    const addButtons = screen.getAllByTestId("add-button");
    expect(addButtons[0]).toBeDisabled();
  });

  it("handles delete action for ward", async () => {
    mockDeleteWardAction.mockResolvedValueOnce({ success: true });

    render(
      <WardList
        wards={mockWards}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        zones={mockZones}
        currentZone={mockCurrentZone}
      />
    );

    const deleteButtons = screen.getAllByTestId("delete-button");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteWardAction).toHaveBeenCalled();
    });
  });

  it("shows zone info in status badge", () => {
    render(
      <WardList
        wards={mockWards}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        zones={mockZones}
        currentZone={mockCurrentZone}
      />
    );

    const statusBadges = screen.getAllByTestId("status-badge");
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it("updates search on input change", async () => {
    render(
      <WardList
        wards={mockWards}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        searchTerm=""
        selectedZoneId={1}
        zones={mockZones}
        currentZone={mockCurrentZone}
      />
    );

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "UT1" } });

    await waitFor(() => {
      expect(searchInput).toHaveValue("UT1");
    });
  });
});
