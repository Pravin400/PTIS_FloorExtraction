import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AliasMaster } from "@/components/modules/configuration-settings/alias-master/AliasMaster";
import type { AliasMaster as AliasMasterType, AliasMasterCounts } from "@/types/alias-master.types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockReplace = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("@/app/[locale]/configuration-settings/alias-master/action", () => ({
  toggleAliasMasterStatusAction: vi.fn(),
}));

describe("AliasMaster List Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData: AliasMasterType[] = [
    {
      id: 47,
      aliasKey: "ALS-000047",
      keyName: "Ward_No",
      labelName: "Ward No",
      englishName: "Sector",
      regionalName: "सेक्टर",
      hindiName: "सेक्टर",
      isActive: true,
    },
  ];

  const counts: AliasMasterCounts = { totalCount: 1, activeCount: 1, inactiveCount: 0 };

  test("renders master list table, stats cards, and search placeholder", () => {
    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        counts={counts}
        searchTerm=""
      />
    );

    expect(screen.getByText("aliasMaster.title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("aliasMaster.searchPlaceholder")).toBeInTheDocument();
    expect(screen.getByText("Ward_No")).toBeInTheDocument();
    expect(screen.getByText("aliasMaster.stats.total")).toBeInTheDocument();
    expect(screen.getByText("aliasMaster.stats.active")).toBeInTheDocument();
    expect(screen.getByText("aliasMaster.stats.inactive")).toBeInTheDocument();
  });

  test("triggers page redirect on Add Alias click", () => {
    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        counts={counts}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "aliasMaster.add" }));

    expect(mockPush).toHaveBeenCalledWith("/en/configuration-settings/alias-master/add");
  });

  test("triggers page redirect on Edit click", () => {
    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        counts={counts}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "aliasMaster.edit" }));

    expect(mockPush).toHaveBeenCalledWith("/en/configuration-settings/alias-master/edit/47");
  });

  test("toggles status successfully and refreshes the list", async () => {
    const { toggleAliasMasterStatusAction } = await import("@/app/[locale]/configuration-settings/alias-master/action");
    vi.mocked(toggleAliasMasterStatusAction).mockResolvedValue({ success: true });

    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        counts={counts}
      />
    );

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(toggleAliasMasterStatusAction).toHaveBeenCalledWith(47, false);
      expect(mockToastSuccess).toHaveBeenCalledWith("aliasMaster.form.messages.deactivateSuccess");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test("shows an error toast and does not refresh when toggling status fails", async () => {
    const { toggleAliasMasterStatusAction } = await import("@/app/[locale]/configuration-settings/alias-master/action");
    vi.mocked(toggleAliasMasterStatusAction).mockResolvedValue({ success: false, message: "Update failed" });

    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        counts={counts}
      />
    );

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(toggleAliasMasterStatusAction).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith("Update failed");
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  test("triggers column sort when a sortable header is clicked", () => {
    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        counts={counts}
      />
    );

    const sortBtn = screen.getByRole("button", { name: /common\.table\.sort\.by aliasMaster\.keyName/i });
    fireEvent.click(sortBtn);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("sortBy=keyName"));
  });

  test("triggers page change when pagination numbers are clicked", () => {
    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={25}
        totalPages={3}
        counts={counts}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });

  test("triggers page size change when rows-per-page selector is changed", () => {
    render(
      <AliasMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={25}
        totalPages={3}
        counts={counts}
      />
    );

    fireEvent.click(screen.getByRole("combobox", { name: /common\.table\.rowsPerPage/i }));
    fireEvent.click(screen.getByRole("option", { name: "20" }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageSize=20"));
  });
});
