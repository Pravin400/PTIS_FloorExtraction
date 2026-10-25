import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import PropertyList from "@/components/modules/property-tax/zone-master/properties/PropertyList";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock custom hook
vi.mock("./usePropertyListHandlers", () => ({
  usePropertyListHandlers: vi.fn(() => ({
    localSearch: "",
    handleSearchChange: vi.fn(),
    handlePageChange: vi.fn(),
    handlePageSizeChange: vi.fn(),
    handleWardChange: vi.fn(),
  })),
}));

vi.mock("@/hooks/zoneMaster/usePropertyDelete", () => ({
  usePropertyDelete: vi.fn(() => ({
    isDeleting: false,
    handleBulkDelete: vi.fn(),
  })),
}));

// Mock components
vi.mock("@/components/common/MasterTable", () => ({
  MasterTable: ({ emptyText, data }: { emptyText: string; data: unknown[] }) => (
    <div data-testid="master-table">
      {data.length === 0 ? <div>{emptyText}</div> : <div>Table with {data.length} rows</div>}
    </div>
  ),
}));

type Option = { value: string; label: string };

vi.mock("@/components/common", () => ({
  SearchInput: ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => (
    <input 
      data-testid="search-input" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
    />
  ),
  StatusBadge: ({ label }: { label: string }) => <span>{label}</span>,
  AddButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{label}</button>
  ),
  Select: ({ value, onChange, options, placeholder }: { value: string; onChange: (option: Option, value: string) => void; options: Option[]; placeholder: string }) => (
    <select data-testid="ward-select" value={value} onChange={(e) => onChange(options.find((o) => o.value === e.target.value)!, e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
  SearchSelect: ({ value, onChange, options, placeholder, label }: { value: string; onChange: (name: string, value: string) => void; options: Option[]; placeholder: string; label?: string }) => (
    <div>
      {label && <label>{label}</label>}
      <select 
        data-testid="ward-select" 
        value={value} 
        onChange={(e) => onChange("ward", e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  ),
  Label: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label className={className}>{children}</label>
  ),
}));

describe("PropertyList", () => {
  const mockPush = vi.fn();
  const mockPathname = "/test";
  const mockSearchParams = { toString: () => "" };

  const defaultProps = {
    properties: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    selectedWardId: null,
    wards: [
      { 
        id: 1, 
        wardNo: "W01", 
        zoneId: 10,
        description: "Ward 1", 
        isActive: true, 
        sequenceNo: 1,
        createdDate: "2024-01-01T00:00:00Z",
        updatedDate: null
      }
    ],
    selectedZoneId: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPathname);
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams);
  });

  it("should render ward selection prompt when no ward is selected", () => {
    const { getByText } = render(<PropertyList {...defaultProps} />);
    expect(getByText("zoneMaster.propertyList.selectWardPrompt")).toBeDefined();
  });

  it("should render the table when a ward is selected", () => {
    const { getByTestId } = render(<PropertyList {...defaultProps} selectedWardId={1} />);
    expect(getByTestId("master-table")).toBeDefined();
  });

  it("should call handleCreateProperty when add property button is clicked", () => {
    const { getByText } = render(<PropertyList {...defaultProps} selectedWardId={1} />);
    const addButton = getByText("zoneMaster.propertyList.createProperty");
    fireEvent.click(addButton);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("createProperty"));
  });

  it("should call handleCreatePartition when add partition button is clicked", () => {
    const { getByText } = render(<PropertyList {...defaultProps} selectedWardId={1} />);
    const partitionButton = getByText("zoneMaster.propertyList.createPartition");
    fireEvent.click(partitionButton);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("createPartition"));
  });

  it("should disable action buttons when no ward is selected", () => {
    const { getByText } = render(<PropertyList {...defaultProps} selectedWardId={null} />);
    const addButton = getByText("zoneMaster.propertyList.createProperty");
    expect(addButton).toBeDisabled();
  });
});
