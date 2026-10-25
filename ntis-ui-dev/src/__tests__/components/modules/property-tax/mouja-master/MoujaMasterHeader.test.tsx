import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MoujaMasterHeaderExtra } from "@/components/modules/property-tax/mouja-master/MoujaMasterHeader";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMoujaSearch } from "@/hooks/moujamaster/useMoujaSearch";
import { useLocale, useTranslations } from "next-intl";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: vi.fn(),
  useTranslations: vi.fn(),
}));

// Mock hooks
vi.mock("@/hooks/moujamaster/useMoujaSearch", () => ({
  useMoujaSearch: vi.fn(),
}));

describe("MoujaMasterHeaderExtra", () => {
  const mockPush = vi.fn();
  const mockHandleSearchChange = vi.fn();
  const mockSearchParamsGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default next/navigation mocks
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ get: mockSearchParamsGet });
    (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue("/en/property-tax/moujamaster");
    
    // Setup next-intl mocks
    (useLocale as unknown as ReturnType<typeof vi.fn>).mockReturnValue("en");
    (useTranslations as unknown as ReturnType<typeof vi.fn>).mockReturnValue((key: string) => key);
    
    // Setup useMoujaSearch mock
    (useMoujaSearch as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      search: "",
      handleSearchChange: mockHandleSearchChange,
    });
  });

  it("should render SearchInput and AddButton when on the main listing page", () => {
    render(<MoujaMasterHeaderExtra />);
    expect(screen.getByPlaceholderText("list.filters.search")).toBeInTheDocument();
    expect(screen.getByText("list.buttons.add")).toBeInTheDocument();
  });

  it("should return null if not on the main listing page (e.g. on add page)", () => {
    (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue("/en/property-tax/moujamaster/add");
    const { container } = render(<MoujaMasterHeaderExtra />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should navigate to add page when Add button is clicked", () => {
    render(<MoujaMasterHeaderExtra />);
    const addButton = screen.getByText("list.buttons.add");
    fireEvent.click(addButton);
    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/moujamaster/add");
  });

  it("should pass the search value to SearchInput and call handleSearchChange on input", () => {
    (useMoujaSearch as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      search: "test query",
      handleSearchChange: mockHandleSearchChange,
    });
    
    render(<MoujaMasterHeaderExtra />);
    const input = screen.getByPlaceholderText("list.filters.search");
    
    // Value should match the mock
    expect(input).toHaveValue("test query");

    // Firing change event
    fireEvent.change(input, { target: { value: "new query" } });
    expect(mockHandleSearchChange).toHaveBeenCalledWith("new query");
  });
  
  it("should correctly parse search params and pass them to useMoujaSearch", () => {
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === "pageSize") return "25";
      if (key === "sortBy") return "moujaName";
      if (key === "sortOrder") return "desc";
      return null;
    });

    render(<MoujaMasterHeaderExtra />);

    expect(useMoujaSearch).toHaveBeenCalledWith({
      pageSize: 25,
      locale: "en",
      sortBy: "moujaName",
      sortOrder: "desc",
      startTransition: expect.any(Function),
    });
  });
});
