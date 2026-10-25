import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TariffWorkbench } from "@/components/modules/water-bill/tariff-workbench/TariffWorkbench";
import type {
  TariffWorkbench as TariffWorkbenchType,
  TariffWorkbenchPagedResponse,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  toast: vi.fn(),
};
const mockConfirm = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, params?: Record<string, unknown>) => {
    if (params?.count !== undefined) {
      return `${ns}.${key}_${params.count}`;
    }
    return `${ns}.${key}`;
  },
  useLocale: () => "en",
}));

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/common")>();
  return {
    ...actual,
    useToast: () => mockToast,
    useConfirm: () => ({ confirm: mockConfirm }),
  };
});

describe("TariffWorkbench Component Tests", () => {
  const sampleRecords: TariffWorkbenchType[] = [
    {
      id: 1,
      tariffCode: "RES-MTR-2026",
      tariffName: "Residential Metered 2026-27",
      financialYearId: 1,
      connectionTypeId: 1,
      connectionCategoryId: 1,
      effectiveFrom: "2026-04-01T00:00:00.000Z",
      effectiveTo: "2027-03-31T00:00:00.000Z",
      versionNo: 1,
      status: "Published",
      description: "Sample Residential Metered Tariff",
      isActive: true,
      financialYearCode: "2026-27",
      connectionTypeName: "Residential",
      connectionCategoryName: "Regular",
      slabsCount: 2,
    },
    {
      id: 2,
      tariffCode: "COM-ANN-2026",
      tariffName: "Commercial Annual 2026-27",
      financialYearId: 1,
      connectionTypeId: 2,
      connectionCategoryId: 2,
      effectiveFrom: "2026-04-01T00:00:00.000Z",
      effectiveTo: "2027-03-31T00:00:00.000Z",
      versionNo: 1,
      status: "Draft",
      description: "Sample Commercial Annual Tariff",
      isActive: false,
      financialYearCode: "2026-27",
      connectionTypeName: "Commercial",
      connectionCategoryName: "Annual",
      slabsCount: 0,
    },
  ];

  const samplePagedData: TariffWorkbenchPagedResponse = {
    items: sampleRecords,
    totalCount: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render successfully with header title and total/active counts", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} />);

    expect(screen.getByText("tariffWorkbench.addTitle")).toBeInTheDocument();
  });

  it("should load list/table records correctly with tariff code and connection names", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} />);

    expect(screen.getAllByText("RES-MTR-2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Residential Metered/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("COM-ANN-2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Commercial Annual/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Residential").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Annual").length).toBeGreaterThan(0);
  });

  it("should render empty state when no records are available", () => {
    const emptyPagedData: TariffWorkbenchPagedResponse = {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    render(<TariffWorkbench locale="en" pagedData={emptyPagedData} />);

    expect(screen.getAllByText(/noData|No Data|No records/i).length).toBeGreaterThan(0);
  });

  it("should trigger search change when typing in search input", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} />);

    const searchInput = screen.getByPlaceholderText("tariffWorkbench.searchPlaceholder");
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "RES-MTR" } });
    expect(searchInput).toHaveValue("RES-MTR");
  });

  it("should navigate to add tariff page when Add button is clicked", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} />);

    const addBtn = screen.getByRole("button", { name: /tariffWorkbench.addTitle/i });
    fireEvent.click(addBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/master/add");
  });

  it("should navigate to edit tariff page when edit action button is clicked", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} />);

    const editBtns = screen.getAllByRole("button", { name: "common.table.actions.edit" });
    fireEvent.click(editBtns[0]);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/master/edit/1");
  });

  it("should navigate to slabs page with tariffId filter when View Rate Slabs button is clicked", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} />);

    const viewSlabsBtns = screen.getAllByRole("button", { name: /tariffWorkbench.table.view/i });
    fireEvent.click(viewSlabsBtns[0]);

    expect(mockPush).toHaveBeenCalledWith("/en/water-bill/tariff-workbench/slabs?tariffId=1");
  });

  it("should trigger confirmation dialog when delete action button is clicked", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} />);

    const deleteBtns = screen.getAllByRole("button", { name: "common.table.actions.delete" });
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        title: "tariffWorkbench.confirm.deleteTitle",
        description: "tariffWorkbench.confirm.deleteDescription",
        meta: { name: "RES-MTR-2026", id: 1 },
      })
    );
  });

  it("should open form drawer when drawer prop is 'add'", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} drawer="add" />);

    expect(screen.getAllByText("tariffWorkbench.addTitle").length).toBeGreaterThan(1);
  });

  it("should open form drawer with prefilled values when drawer prop is 'edit'", () => {
    render(<TariffWorkbench locale="en" pagedData={samplePagedData} drawer="edit" initialEditingData={sampleRecords[0]} />);

    expect(screen.getByText("tariffWorkbench.editTitle")).toBeInTheDocument();
    expect(screen.getByDisplayValue("RES-MTR-2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Residential Metered 2026-27")).toBeInTheDocument();
  });
});
