import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RetrospectiveTaxModal } from "@/components/modules/property-tax/ptis/reassement-screen/RetrospectiveTaxModal";
import { NextIntlClientProvider } from "next-intl";
import { MappedRetrospectiveColumn, MappedRetrospectiveRow } from "@/types/reassessment.types";

const mockMessages = {
  common: {
    buttons: {
      close: "Close",
    },
    table: {
      columns: { actions: "Actions" },
      showingEntries: "Showing {start}-{end} of {total}",
    },
    messages: {
      noData: "No data available",
      total: "Total: {count}",
    },
    actions: {
      loading: "Loading...",
    },
  },
  reassessment: {
    retrospectiveModal: {
      title: "Retrospective Tax Details",
      subtitle: "Details of retrospective tax",
      columns: {
        financeYear: "Finance Year",
        days: "Days",
        total: "Total",
      },
      noData: "No data available",
    },
    buttons: {
      close: "Close",
    },
  },
};

describe("RetrospectiveTaxModal", () => {
  const mockColumns: MappedRetrospectiveColumn[] = [
    { key: "tax1", label: "Tax 1", displayOrder: 1 },
    { key: "tax2", label: "Tax 2", displayOrder: 2 },
  ];

  const mockRows: MappedRetrospectiveRow[] = [
    {
      pendingYearId: 1,
      financeYear: "2020-21",
      days: 180,
      tax1: 1000,
      tax2: 500,
      total: 1500,
    },
  ];

  function setup(
    open = true,
    onClose = vi.fn(),
    columns = mockColumns,
    rows = mockRows,
    error?: string
  ) {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <RetrospectiveTaxModal
          open={open}
          onClose={onClose}
          columns={columns}
          rows={rows}
          error={error}
        />
      </NextIntlClientProvider>
    );
  }

  it("renders the modal when open is true", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "Retrospective Tax Details" })
    ).toBeInTheDocument();
  });

  it("renders the data rows", () => {
    setup();
    expect(screen.getByText("2020-21")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    setup(true, onClose);
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders error message when error is provided", () => {
    setup(true, vi.fn(), mockColumns, mockRows, "Test error message");
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders no data message when rows are empty", () => {
    setup(true, vi.fn(), mockColumns, []);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });
});
