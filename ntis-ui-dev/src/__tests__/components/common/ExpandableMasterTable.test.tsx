import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import {
  ExpandableMasterTable,
  type Column,
  type ExpandableMasterTableProps,
} from "@/components/common/ExpandableMasterTable";

const mockMessages = {
  table: {
    columns: { actions: "Actions" },
    showingEntries: "Showing {start}-{end} of {total}",
  },
  messages: { noData: "No data available" },
  actions: { loading: "Loading..." },
};

type Row = {
  id: number;
  name: string;
  status?: string;
};

const columns: Column<Row>[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status", isStatus: true },
];

const data: Row[] = [
  { id: 1, name: "Alice", status: "active" },
  { id: 2, name: "Bob", status: "inactive" },
];

function setup(props: Partial<ExpandableMasterTableProps<Row>> = {}) {
  const defaultProps: ExpandableMasterTableProps<Row> = {
    columns,
    data,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    onPageChange: vi.fn(),
    ...props,
  };

  return render(
    <NextIntlClientProvider locale="en" messages={{ common: mockMessages }}>
      <ExpandableMasterTable {...defaultProps} />
    </NextIntlClientProvider>
  );
}

describe("ExpandableMasterTable", () => {
  it("renders table headers and rows", () => {
    setup();

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows loading and empty states from common translations", () => {
    setup({ loading: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    setup({ loading: false, data: [] });
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders expanded row content beneath each row", () => {
    setup({
      renderExpandedRow: (row) => <div>Expanded details for {row.name}</div>,
    });

    expect(screen.getByText("Expanded details for Alice")).toBeInTheDocument();
    expect(screen.getByText("Expanded details for Bob")).toBeInTheDocument();
  });

  it("does not render an expanded row when renderExpandedRow returns null", () => {
    const { container } = setup({
      renderExpandedRow: () => null,
    });

    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows).toHaveLength(data.length);
  });

  it("calls onRowClick with row data and index", () => {
    const onRowClick = vi.fn();
    setup({ onRowClick });

    fireEvent.click(screen.getByText("Bob").closest("tr") as HTMLTableRowElement);

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(data[1], 1);
  });

  it("renders actions with the translated action header", () => {
    const actionSpy = vi.fn();
    setup({
      renderActions: (row) => (
        <button type="button" onClick={() => actionSpy(row)}>
          Select {row.name}
        </button>
      ),
    });

    expect(screen.getByText("Actions")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select Alice" }));
    expect(actionSpy).toHaveBeenCalledWith(data[0]);
  });

  it("renders pagination info and calls pagination callbacks", () => {
    const onPageChange = vi.fn();
    setup({
      isPagination: true,
      pageNumber: 2,
      pageSize: 1,
      totalCount: 2,
      totalPages: 2,
      onPageChange,
    });

    expect(screen.getByText("Showing 2-2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Go to previous page/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("renders and updates the page size selector", () => {
    const onPageSizeChange = vi.fn();
    setup({
      isPageSize: true,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50],
      onPageSizeChange,
    });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "20" } });

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("renders multi-row custom expanded rows via renderCustomExpandedRows", () => {
    setup({
      renderCustomExpandedRows: (row) => (
        <tr data-testid={`custom-subrow-${row.id}`}>
          <td colSpan={4}>Subunits for {row.name}</td>
        </tr>
      ),
    });

    expect(screen.getByTestId("custom-subrow-1")).toBeInTheDocument();
    expect(screen.getByText("Subunits for Alice")).toBeInTheDocument();
    expect(screen.getByTestId("custom-subrow-2")).toBeInTheDocument();
    expect(screen.getByText("Subunits for Bob")).toBeInTheDocument();
  });

  it("renders customThead when provided", () => {
    setup({
      customThead: (
        <thead data-testid="custom-thead">
          <tr>
            <th>Custom Header</th>
          </tr>
        </thead>
      ),
    });

    expect(screen.getByTestId("custom-thead")).toBeInTheDocument();
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
  });
});
