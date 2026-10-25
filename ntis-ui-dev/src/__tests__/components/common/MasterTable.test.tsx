import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MasterTable, MasterTableProps, Column } from "@/components/common/MasterTable";
import { NextIntlClientProvider } from "next-intl";

const mockMessages = {
  table: {
    columns: { actions: "Actions" },
    showingEntries: "Showing {start}-{end} of {total}",
    page: "Page {current} of {total}",
  },
  messages: { noData: "No data available" },
  actions: { loading: "Loading..." },
};

type Row = { id: number; name: string; status?: string };
const columns: Column<Row>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status", isStatus: true },
];

describe("MasterTable", () => {
  const data: Row[] = [
    { id: 1, name: "Alice", status: "active" },
    { id: 2, name: "Bob", status: "inactive" },
  ];

  /*
     Helper to render the component with default props appropriate for testing.
     Most test cases exercise pagination, so the helper opts into the
    feature by passing `isPagination: true` unless explicitly
     overridden.
  */
  function setup(props: Partial<MasterTableProps<Row>> = {}, messages = mockMessages) {
    const defaultProps = {
      columns,
      data,
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
      onPageChange: vi.fn(),
      // default pagination enabled; support both legacy and new prop names

      isPagination: true,
      ...props
    };

    return render(
      <NextIntlClientProvider locale="en" messages={{ common: messages }}>
        <MasterTable {...defaultProps} />
      </NextIntlClientProvider>
    );
  }

  it("renders table headers and rows", () => {
    setup();
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows loading text when loading", () => {
    setup({ loading: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty text when no data", () => {
    setup({ data: [] });
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders action buttons if renderActions provided", () => {
    const renderActions = () => <button>Test Action</button>;
    setup({ renderActions });
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getAllByText("Test Action").length).toBeGreaterThan(0);
  });

  it("calls renderActions when action button clicked", () => {
    const actionSpy = vi.fn();
    const renderActions = (row: Row) => <button onClick={() => actionSpy(row)}>Test Action</button>;
    setup({ renderActions });
    const actionButtons = screen.getAllByText("Test Action");
    fireEvent.click(actionButtons[0]);
    expect(actionSpy).toHaveBeenCalled();
  });

  it("renders header and footer content", () => {
    setup({ headerTitle: "Table Title", headerSubtitle: "Subtitle", headerExtra: <span>Extra</span>, footerLeftContent: <span>Left</span>, footerRightContent: <span>Right</span> });
    expect(screen.getByText("Table Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Extra")).toBeInTheDocument();
    expect(screen.getByText("Left")).toBeInTheDocument();
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("shows correct pagination info when pagination is enabled", () => {
    setup({ pageNumber: 1, pageSize: 10, totalCount: 2, totalPages: 1 });
    expect(screen.getByText(/Showing 1-2 of 2/)).toBeInTheDocument();
  });

  it("calls onPageChange when pagination buttons clicked", () => {
    const onPageChange = vi.fn();
    setup({ pageNumber: 2, pageSize: 1, totalCount: 2, totalPages: 2, onPageChange });

    const prevBtn = screen.getByRole("button", { name: /Go to previous page/i });
    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("renders custom row key and row className", () => {
    setup({ getRowKey: (row) => `row-${row.id}`, rowClassName: () => "custom-row" });
    // Assuming standard table render, check for class on tr
    // We can't easily query by row key unless it's an ID, but we can check the class
    const table = screen.getByRole("table");
    // The rows are inside tbody
    const rows = table.querySelectorAll("tbody tr");
    expect(rows[0]).toHaveClass("custom-row");
  });

  it("does not render pagination when pagination disabled", () => {
    setup({ isPagination: false });
    // "Showing X-Y of Z" text should not be present
    const paginationText = screen.queryByText(/Showing/);
    expect(paginationText).not.toBeInTheDocument();

    // Pagination buttons should not be present
    const prevBtn = screen.queryByRole("button", { name: /Go to previous page/i });
    expect(prevBtn).not.toBeInTheDocument();
  });

  it("does not render pagination when paging props are missing (no flag provided)", () => {
    // Manually render without setup helper to avoid default props
    render(
      <NextIntlClientProvider locale="en" messages={{ common: mockMessages }}>
        <MasterTable
          columns={columns}
          data={data}
        // No pagination props provided
        />
      </NextIntlClientProvider>
    );

    const paginationText = screen.queryByText(/Showing/);
    expect(paginationText).not.toBeInTheDocument();
  });

  it("applies containerClassName to the outer wrapper", () => {
    const { container } = setup({ containerClassName: "my-custom-container" });
    // The first child of the render result should be the wrapper div
    expect(container.firstChild).toHaveClass("my-custom-container");
  });
  it("calls onPageSizeChange when page size dropdown changes", () => {
    const onPageSizeChange = vi.fn();
    setup({
      isPageSize: true,
      pageSize: 10,
      onPageSizeChange,
      totalCount: 100,
      isPagination: true
    });

    const selects = screen.getAllByRole("combobox");
    // Depending on layout, there might be multiple dropdowns (top/bottom)
    // We'll target the first one found or iterate
    fireEvent.change(selects[0], { target: { value: "20" } });

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it("does not render page size dropdown when isPageSize is false", () => {
    setup({
      isPageSize: false,
      pageSize: 10,
      totalCount: 100
    });

    // Look for the select element which shouldn't exist
    const select = screen.queryByRole("combobox");
    expect(select).not.toBeInTheDocument();
  });

  it("renders page size dropdown when isPageSize is true", () => {
    setup({
      isPageSize: true,
      pageSize: 10,
      totalCount: 100,
      isPagination: true
    });

    expect(screen.getAllByRole("combobox")[0]).toBeInTheDocument();
  });

  it("renders standalone page size dropdown when pagination is disabled but isPageSize is true", () => {
    setup({
      isPagination: false,
      isPageSize: true,
      pageSize: 10,
      totalCount: 100
    });

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows plain dropdown when paginationConfig.showPageSizeSelector is true but counts are missing", () => {
    setup({
      isPagination: false,
      paginationConfig: { enabled: false, showPageSizeSelector: true },
      pageSize: undefined,
      totalCount: undefined,
      totalPages: undefined,
    });

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("paginationConfig.showPageSizeSelector overrides isPageSize when both provided", () => {
    // even though isPageSize=false, config true should still show selector
    setup({
      isPagination: true,
      isPageSize: false,
      paginationConfig: { enabled: true, showPageSizeSelector: true },
      pageNumber: 1,
      pageSize: 10,
      totalCount: 50,
      totalPages: 5,
    });
    // showingEntries text contains dropdown inside
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toBeInTheDocument();

    cleanup();

    // conversely config false hides even if isPageSize true
    setup({
      isPagination: true,
      isPageSize: true,
      paginationConfig: { enabled: true, showPageSizeSelector: false },
      pageNumber: 1,
      pageSize: 10,
      totalCount: 50,
      totalPages: 5,
    });
    // only plain text should appear, no combobox
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("respects paginationConfig.enabled over legacy flag", () => {
    // disabled via config should hide pagination even if legacy flag true
    setup({ paginationConfig: { enabled: false }, isPagination: true });
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();

    // enabled via config should show pagination even if isPagination false
    setup({
      paginationConfig: { enabled: true },
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
      isPagination: false,
    });
    expect(screen.getByText(/Showing 1-2 of 2/)).toBeInTheDocument();
  });
  it("still respects legacy isPagination when new prop is absent", () => {
    // only legacy prop provided, should behave same as before
    setup({ isPagination: true, pageNumber: 1, pageSize: 10, totalCount: 2, totalPages: 1 });
    expect(screen.getByText(/Showing 1-2 of 2/)).toBeInTheDocument();

    cleanup();

    setup({ isPagination: false });
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
  it("renders page size dropdown with custom pageSizeOptions", () => {
    setup({
      isPageSize: true,
      pageSize: 10,
      pageSizeOptions: [5, 15, 25],
      totalCount: 100,
      isPagination: true
    });

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("5");
    expect(options[1]).toHaveTextContent("15");
    expect(options[2]).toHaveTextContent("25");
  });

  it("renders correct range with page-size selector on later pages", () => {
    // pageSize = 5, pageNumber = 2, totalCount = 12
    const data = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    render(
      <NextIntlClientProvider messages={{ common: mockMessages }} locale="en">
        <MasterTable<Row>
          columns={columns}
          data={data.slice(5, 10)}
          pageNumber={2}
          pageSize={5}
          totalCount={12}
          totalPages={3}
          isPagination={true}
          isPageSize={true}
          pageSizeOptions={[5, 10, 20]}
          onPageChange={() => {}}
        />
      </NextIntlClientProvider>
    );
    // Should render "Showing 6 to 10 of 12"
    expect(screen.getByText(/Showing 6.*10.*12/)).toBeInTheDocument();
  });

  // Tests for onRowClick callback
  describe("onRowClick callback", () => {
    it("calls onRowClick when a row is clicked", () => {
      const onRowClick = vi.fn();
      setup({ onRowClick });

      const table = screen.getByRole("table");
      const rows = table.querySelectorAll("tbody tr");
      
      fireEvent.click(rows[0]);
      
      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith(data[0], 0);
    });

    it("calls onRowClick with correct row data and index", () => {
      const onRowClick = vi.fn();
      setup({ onRowClick });

      const table = screen.getByRole("table");
      const rows = table.querySelectorAll("tbody tr");
      
      // Click second row
      fireEvent.click(rows[1]);
      
      expect(onRowClick).toHaveBeenCalledWith(data[1], 1);
      expect(onRowClick).toHaveBeenCalledWith({ id: 2, name: "Bob", status: "inactive" }, 1);
    });

    it("does not call onRowClick when not provided", () => {
      setup({ onRowClick: undefined });

      const table = screen.getByRole("table");
      const rows = table.querySelectorAll("tbody tr");
      
      // Should not throw error when clicking row
      expect(() => fireEvent.click(rows[0])).not.toThrow();
    });

    it("calls onRowClick for each row independently", () => {
      const onRowClick = vi.fn();
      setup({ onRowClick });

      const table = screen.getByRole("table");
      const rows = table.querySelectorAll("tbody tr");
      
      fireEvent.click(rows[0]);
      fireEvent.click(rows[1]);
      
      expect(onRowClick).toHaveBeenCalledTimes(2);
      expect(onRowClick).toHaveBeenNthCalledWith(1, data[0], 0);
      expect(onRowClick).toHaveBeenNthCalledWith(2, data[1], 1);
    });

    it("applies cursor-pointer class when onRowClick is provided", () => {
      const onRowClick = vi.fn();
      const { container } = setup({ onRowClick });

      const table = container.querySelector("table");
      const rows = table?.querySelectorAll("tbody tr");
      
      expect(rows?.[0]).toHaveClass("cursor-pointer");
      expect(rows?.[1]).toHaveClass("cursor-pointer");
    });

    it("does not apply cursor-pointer class when onRowClick is not provided", () => {
      const { container } = setup({ onRowClick: undefined });

      const table = container.querySelector("table");
      const rows = table?.querySelectorAll("tbody tr");
      
      expect(rows?.[0]).not.toHaveClass("cursor-pointer");
    });

    it("applies hover effect when onRowClick is provided", () => {
      const onRowClick = vi.fn();
      const { container } = setup({ onRowClick });

      const table = container.querySelector("table");
      const rows = table?.querySelectorAll("tbody tr");
      
      expect(rows?.[0]).toHaveClass("hover:bg-blue-50/40");
    });

    it("works with custom rowClassName when onRowClick is provided", () => {
      const onRowClick = vi.fn();
      const rowClassName = () => "custom-row-class";
      const { container } = setup({ onRowClick, rowClassName });

      const table = container.querySelector("table");
      const rows = table?.querySelectorAll("tbody tr");
      
      expect(rows?.[0]).toHaveClass("custom-row-class");
      expect(rows?.[0]).toHaveClass("cursor-pointer");
    });

    it("does not interfere with action button clicks", () => {
      const onRowClick = vi.fn();
      const actionSpy = vi.fn();
      const renderActions = (row: Row) => (
        <button onClick={(e) => {
          e.stopPropagation();
          actionSpy(row);
        }}>
          Action
        </button>
      );
      
      setup({ onRowClick, renderActions });

      const actionButton = screen.getAllByText("Action")[0];
      fireEvent.click(actionButton);
      
      // Action button should be called but not onRowClick
      expect(actionSpy).toHaveBeenCalledTimes(1);
      expect(onRowClick).not.toHaveBeenCalled();
    });
  });
});
