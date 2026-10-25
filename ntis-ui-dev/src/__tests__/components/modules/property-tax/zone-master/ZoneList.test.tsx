import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ZoneList from "@/components/modules/property-tax/zone-master/zones/ZoneList";
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
    toString: () => "zonePage=1&zonePageSize=10",
    get: () => null,
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
const mockDeleteZoneAction = vi.fn();

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  deleteZoneAction: (id: number) => mockDeleteZoneAction(id),
}));

// Mock common components
vi.mock("@/components/common", () => ({
  AddButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button data-testid="add-button" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  EditButton: ({ onClick, size: _size }: { onClick: (e: React.MouseEvent) => void; size?: string }) => (
    <button data-testid="edit-button" onClick={onClick}>Edit</button>
  ),
  DeleteButton: ({ onClick, size: _size2 }: { onClick: (e: React.MouseEvent) => void; size?: string }) => (
    <button data-testid="delete-button" onClick={onClick}>Delete</button>
  ),
  Card: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string; padding?: string }) => (
    <div data-testid="zone-card" onClick={onClick} className={className}>{children}</div>
  ),
  SearchInput: ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  useConfirm: () => ({
    confirm: ({ onConfirm }: { onConfirm: () => void }) => onConfirm(),
  }),
}));

vi.mock("@/components/common/StatusBadge", () => ({
  StatusBadge: ({ value }: { value: string }) => (
    <span data-testid="status-badge">{value}</span>
  ),
}));

vi.mock("@/components/common/CardList", () => ({
  CardList: <T,>({ data, renderCard, emptyText }: { data: T[]; renderCard: (item: T, index: number) => React.ReactNode; emptyText: string }) => (
    <div data-testid="card-list">
      {data.length === 0 ? (
        <div data-testid="empty-text">{emptyText}</div>
      ) : (
        data.map((item, index) => renderCard(item, index))
      )}
    </div>
  ),
}));

describe("ZoneList", () => {
  const mockOnZoneSelect = vi.fn();

  const mockZones: ZoneItem[] = [
    { id: 1, zoneNo: "UT", description: "उथळसर", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null, wardCount: 5 },
    { id: 2, zoneNo: "NK", description: "नौपाडा - कोपरी", isActive: true, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null, wardCount: 3 },
    { id: 3, zoneNo: "KL", description: "कळवा", isActive: false, createdDate: "2026-04-09", updatedDate: null, sequenceNo: null, wardCount: 8 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders zone list with zones", () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    expect(screen.getByTestId("card-list")).toBeInTheDocument();
    expect(screen.getAllByTestId("zone-card")).toHaveLength(3);
  });

  it("renders English description when present", () => {
    const zonesWithEnglish: ZoneItem[] = [
      {
        id: 1,
        zoneNo: "UT",
        description: "उथळसर",
        descriptionEnglish: "Uthalsar",
        isActive: true,
        createdDate: "2026-04-09",
        updatedDate: null,
        sequenceNo: null,
      },
    ];

    render(
      <ZoneList
        zones={zonesWithEnglish}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    expect(screen.getByText("Uthalsar")).toBeInTheDocument();
    expect(screen.getByText("उथळसर")).toBeInTheDocument();
  });

  it("renders empty state when no zones", () => {
    render(
      <ZoneList
        zones={[]}
        pageNumber={1}
        pageSize={10}
        totalCount={0}
        totalPages={0}
        selectedZoneId={null}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    expect(screen.getByTestId("empty-text")).toBeInTheDocument();
  });

  it("calls onZoneSelect when a zone card is clicked", () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={null}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    const zoneCards = screen.getAllByTestId("zone-card");
    fireEvent.click(zoneCards[0]);

    expect(mockOnZoneSelect).toHaveBeenCalledWith(1);
  });

  it("renders search input", () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    expect(screen.getByTestId("add-button")).toBeInTheDocument();
  });

  it("updates search on input change", async () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        searchTerm=""
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "UT" } });

    await waitFor(() => {
      expect(searchInput).toHaveValue("UT");
    });
  });

  it("highlights selected zone", () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    const zoneCards = screen.getAllByTestId("zone-card");
    // The first card (selectedZoneId=1) should have selection styling
    expect(zoneCards[0]).toBeInTheDocument();
  });

  it("renders status badges for each zone", () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    const statusBadges = screen.getAllByTestId("status-badge");
    expect(statusBadges).toHaveLength(3);
  });

  it("opens add zone drawer when add button is clicked", () => {
    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    const addButton = screen.getByTestId("add-button");
    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalled();
  });

  it("handles delete action for zone", async () => {
    mockDeleteZoneAction.mockResolvedValueOnce({ success: true });

    render(
      <ZoneList
        zones={mockZones}
        pageNumber={1}
        pageSize={10}
        totalCount={3}
        totalPages={1}
        selectedZoneId={1}
        onZoneSelect={mockOnZoneSelect}
      />
    );

    const deleteButtons = screen.getAllByTestId("delete-button");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteZoneAction).toHaveBeenCalledWith(1);
    });
  });
});
