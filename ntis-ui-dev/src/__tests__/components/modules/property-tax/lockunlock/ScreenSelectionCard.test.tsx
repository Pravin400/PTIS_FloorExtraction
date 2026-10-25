import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LockedScreen } from "@/types/lockunlock.types";
import { ScreenSelectionCard } from "@/components/modules/property-tax/lockunlock/ScreenSelectionCard";

const mockGet = vi.fn();
const mockUpdateQueries = vi.fn();
const mockSearchParams = {
  get: mockGet,
};

vi.mock("@/hooks/useQueryTransition", () => ({
  useQueryTransition: () => ({
    isPending: false,
    updateQueries: mockUpdateQueries,
    searchParams: mockSearchParams,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/property-tax/lockunlock",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === "screenSelectionCard.selectedCount") {
      return `${values?.count} selected`;
    }
    const translations: Record<string, string> = {
      "screenSelectionCard.title": "Screen selection",
      "screenSelectionCard.noScreens": "No screens available to select.",
    };
    return translations[key] || key;
  },
}));

describe("ScreenSelectionCard", () => {
  const mockScreens: LockedScreen[] = [
    { id: 1, screenCode: "S1", screenName: "Screen 1", screenNameLocal: "Screen 1 Local", displayOrder: 1 },
    { id: 2, screenCode: "S2", screenName: "Screen 2", screenNameLocal: "Screen 2 Local", displayOrder: 2 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it("should render screen selection card with screens", () => {
    const mockSetSelected = vi.fn();
    render(
      <ScreenSelectionCard
        screens={mockScreens}
        selectedScreenIds={[1]}
        setSelectedScreenIds={mockSetSelected}
      />
    );

    expect(screen.getByText("Screen selection")).toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByLabelText("Screen 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Screen 2")).toBeInTheDocument();
  });

  it("should display empty message if no screens", () => {
    render(
      <ScreenSelectionCard
        screens={[]}
        selectedScreenIds={[]}
        setSelectedScreenIds={vi.fn()}
      />
    );
    
    expect(screen.getByText("No screens available to select.")).toBeInTheDocument();
  });
});
