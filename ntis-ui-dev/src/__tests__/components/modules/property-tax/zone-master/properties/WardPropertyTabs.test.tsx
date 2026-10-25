import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import WardPropertyTabs from "@/components/modules/property-tax/zone-master/properties/WardPropertyTabs";
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

// Mock components
vi.mock("@/components/modules/property-tax/zone-master/wards/WardList", () => ({
  default: () => <div data-testid="ward-list">Ward List Component</div>,
}));

vi.mock("@/components/modules/property-tax/zone-master/properties/PropertyList", () => ({
  default: () => <div data-testid="property-list">Property List Component</div>,
}));

vi.mock("@/components/common", () => ({
  Tabs: ({ items, value, onChange }: { items: Array<{ value: string; label: string; content: React.ReactNode }>; value: string; onChange: (value: string) => void }) => (
    <div data-testid="tabs">
      <div className="tab-buttons">
        {items.map((item) => (
          <button 
            key={item.value} 
            onClick={() => onChange(item.value)}
            data-active={value === item.value}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {items.find(item => item.value === value)?.content}
      </div>
    </div>
  ),
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true),
  }),
  Select: ({ value, onChange, options }: { value: string; onChange: (option: { value: string; label: string }, value: string) => void; options: Array<{ value: string; label: string }> }) => (
    <select 
      data-testid="select"
      value={value} 
      onChange={(e) => {
        const option = options.find(o => o.value === e.target.value);
        if (option) onChange(option, e.target.value);
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
  StatusBadge: ({ label }: { label: string }) => <span>{label}</span>,
  SearchInput: ({ placeholder }: { placeholder: string }) => <input placeholder={placeholder} />,
  MasterTable: ({ data }: { data: Record<string, unknown>[] }) => <div data-testid="master-table">Table with {data.length} rows</div>,
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  AddButton: ({ label, onClick }: { label: string; onClick: () => void }) => <button onClick={onClick}>{label}</button>,
  EditButton: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Edit</button>,
  DeleteButton: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Delete</button>,
}));

describe("WardPropertyTabs", () => {
  const mockPush = vi.fn();
  const mockPathname = "/test";
  const mockSearchParams = { toString: () => "" };

  const defaultProps = {
    wards: [],
    wardPageNumber: 1,
    wardPageSize: 10,
    wardTotalCount: 0,
    wardTotalPages: 0,
    selectedZoneId: 1,
    zones: [],
    properties: [],
    propertyPageNumber: 1,
    propertyPageSize: 10,
    propertyTotalCount: 0,
    propertyTotalPages: 0,
    selectedPropertyWardId: null,
    activeTab: "wards" as "wards" | "properties",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPathname);
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams);
  });

  it("should render ward list when active tab is wards", () => {
    const { getByTestId } = render(<WardPropertyTabs {...defaultProps} />);
    expect(getByTestId("ward-list")).toBeDefined();
  });

  it("should render property list when active tab is properties", () => {
    const { getByTestId } = render(<WardPropertyTabs {...defaultProps} activeTab="properties" />);
    expect(getByTestId("property-list")).toBeDefined();
  });

  it("should call router.push when tab is changed", () => {
    const { getByText } = render(<WardPropertyTabs {...defaultProps} />);
    const propertiesTab = getByText("zoneMaster.tabs.properties");
    fireEvent.click(propertiesTab);
    
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("rightTab=properties"));
  });

  it("should clear property-specific params when switching to wards tab", () => {
    const { getByText } = render(<WardPropertyTabs {...defaultProps} activeTab="properties" />);
    const wardsTab = getByText("zoneMaster.tabs.wards");
    fireEvent.click(wardsTab);
    
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("rightTab=wards"));
  });
});
