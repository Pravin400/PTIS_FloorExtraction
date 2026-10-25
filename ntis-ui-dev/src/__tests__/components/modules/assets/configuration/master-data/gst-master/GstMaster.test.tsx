import { vi, describe, test, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GstMaster } from "@/components/modules/assets/configuration/master-data/gst-master/GstMaster";
import type { GstMaster as GstMasterType } from "@/types/asset-masters/gst-master.types";

const mockConfirm = vi.fn().mockImplementation((options?: { onConfirm?: () => void }) => {
  if (options && typeof options.onConfirm === "function") {
    options.onConfirm();
  }
});
const mockPush = vi.fn();
const mockRefresh = vi.fn();

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/en/assets/configuration/master-data/gst-master",
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Mock useConfirm
vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/common")>();
  return {
    ...actual,
    useToast: () => ({
      success: mockToastSuccess,
      error: mockToastError,
    }),
  };
});

// Mock action
vi.mock("@/app/[locale]/assets/configuration/master-data/gst-master/action", () => ({
  deleteGstMasterAction: vi.fn(),
}));

// Mock useSearchNavigation
vi.mock("@/hooks/useSearchNavigation", () => ({
  useSearchNavigation: vi.fn(),
}));

describe("GstMaster List Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData: GstMasterType[] = [
    {
      id: 1,
      taxCode: "GST-18",
      taxName: "GST 18 Percent",
      taxPercentage: 18,
      isActive: true,
      effectiveFromDate: "2017-07-01",
      effectiveToDate: null,
    },
  ];

  test("renders master list table with correct headers and search placeholders", () => {
    render(
      <GstMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
        searchTerm=""
      />
    );

    expect(screen.getByText("gstMaster.title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("gstMaster.searchPlaceholder")).toBeInTheDocument();
    expect(screen.getByText("GST-18")).toBeInTheDocument();
    expect(screen.getByText("GST 18 Percent")).toBeInTheDocument();
  });

  test("triggers page redirect on Add GST click", () => {
    render(
      <GstMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const addButton = screen.getByRole("button", { name: "gstMaster.add" });
    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/gst-master/add");
  });

  test("triggers confirmation dialog on Delete click and executes deletion successfully", async () => {
    const { deleteGstMasterAction } = await import("@/app/[locale]/assets/configuration/master-data/gst-master/action");
    vi.mocked(deleteGstMasterAction).mockResolvedValue({ success: true });

    render(
      <GstMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const deleteButton = screen.getByRole("button", { name: "gstMaster.delete" });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteGstMasterAction).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("gstMaster.form.messages.deleteSuccess");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test("triggers confirmation dialog on Delete click and displays error message from backend when deletion fails", async () => {
    const { deleteGstMasterAction } = await import("@/app/[locale]/assets/configuration/master-data/gst-master/action");
    const errorMessage = "Cannot delete GST record as it is associated with active assets";
    vi.mocked(deleteGstMasterAction).mockResolvedValue({ success: false, message: errorMessage });

    render(
      <GstMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    const deleteButton = screen.getByRole("button", { name: "gstMaster.delete" });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteGstMasterAction).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  test("triggers column sort when header sort buttons are clicked", () => {
    render(
      <GstMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={1}
        totalPages={1}
      />
    );

    // Find the sort button for taxCode
    const sortBtn = screen.getByRole("button", { name: /common.table.sort.by gstMaster.taxCode/i });
    fireEvent.click(sortBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=taxCode")
    );

    // Find the sort button for effectiveFromDate
    const sortFromDateBtn = screen.getByRole("button", { name: /common.table.sort.by gstMaster.form.fields.effectiveFrom.label/i });
    fireEvent.click(sortFromDateBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=effectiveFromDate")
    );

    // Find the sort button for effectiveToDate
    const sortToDateBtn = screen.getByRole("button", { name: /common.table.sort.by gstMaster.form.fields.effectiveTo.label/i });
    fireEvent.click(sortToDateBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=effectiveToDate")
    );
  });

  test("triggers page change when pagination numbers are clicked", () => {
    render(
      <GstMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={25}
        totalPages={3}
      />
    );

    // Click on page number 2
    const page2Button = screen.getByRole("button", { name: "Go to page 2" });
    fireEvent.click(page2Button);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=2")
    );
  });

  test("triggers page size change when rows per page selector is changed", () => {
    render(
      <GstMaster
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={25}
        totalPages={3}
      />
    );

    // Click custom Select combobox button
    const select = screen.getByRole("combobox", { name: /common.table.rowsPerPage/i });
    fireEvent.click(select);

    // Click option "20"
    const option = screen.getByRole("option", { name: "20" });
    fireEvent.click(option);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=20")
    );
  });
});
