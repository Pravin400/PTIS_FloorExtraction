import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { WaterRateMaster } from "@/components/modules/property-tax/WaterConnectionMaster/WaterRateMaster";
import type { WaterRate } from "@/types/water-connection.types";
import { toast } from "sonner";

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return { ...actual, useLocale: () => "en" };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/[locale]/property-tax/water-connection-master/actions", () => ({
  deleteWaterRateAction: vi.fn(),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: () => ({
    confirm: vi.fn((opts) => opts.onConfirm?.()),
  }),
}));

import { deleteWaterRateAction } from "@/app/[locale]/property-tax/water-connection-master/actions";
const mockDelete = vi.mocked(deleteWaterRateAction);

const messages = {
  waterConnectionMaster: {
    waterRate: {
      confirm: {
        deleteTitle: "Delete Water Rate?",
        deleteDescription: "Are you sure?",
      },
      messages: {
        deleteSuccess: "Water Rate deleted successfully",
        deleteInUse: "Water rate is currently in use",
      },
      table: {
        connectionTypeName: "Connection Type",
        connectionSizeDisplay: "Connection Size",
        yearCode: "Finance Year",
        yearlyRate: "Yearly Rate",
        quarterlyRate: "Quarterly Rate",
        monthlyRate: "Monthly Rate",
        status: "Status",
      },
    },
  },
  common: {
    table: {
      columns: { actions: "Actions" },
      showing: "Showing",
      to: "to",
      of: "of",
      rowsPerPage: "Rows per page",
      showingEntries: "Showing {start} to {end} of {total}",
    },
    messages: { noData: "No data available" },
    actions: { loading: "Loading..." },
    errors: { deleteError: "Failed to delete" },
  },
};

const mockRates: WaterRate[] = [
  {
    id: 1,
    waterConnectionTypeId: 1,
    connectionTypeName: "Domestic",
    waterConnectionSizeId: 1,
    connectionSizeDisplay: "15mm",
    financeYearId: 1,
    yearCode: "2024-25",
    yearlyRate: 1500,
    isActive: true,
  },
  {
    id: 2,
    waterConnectionTypeId: 2,
    connectionTypeName: "Commercial",
    waterConnectionSizeId: 2,
    connectionSizeDisplay: "25mm",
    financeYearId: 1,
    yearCode: "2024-25",
    yearlyRate: 3000,
    isActive: false,
  },
];

const defaultData = {
  items: mockRates,
  totalCount: 2,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
};

describe("WaterRateMaster", () => {
  beforeEach(() => vi.clearAllMocks());

  function setup(data = defaultData) {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <WaterRateMaster data={data} />
      </NextIntlClientProvider>
    );
  }

  describe("Rendering", () => {
    it("renders without crashing", () => {
      setup();
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renders column headers", () => {
      setup();
      expect(screen.getByText("Connection Type")).toBeInTheDocument();
      expect(screen.getByText("Connection Size")).toBeInTheDocument();
      expect(screen.getByText("Finance Year")).toBeInTheDocument();
      expect(screen.getByText("Yearly Rate")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("renders all row data", () => {
      setup();
      expect(screen.getByText("Domestic")).toBeInTheDocument();
      expect(screen.getByText("Commercial")).toBeInTheDocument();
      expect(screen.getByText("15mm")).toBeInTheDocument();
      expect(screen.getByText("25mm")).toBeInTheDocument();
      expect(screen.getAllByText("2024-25")).toHaveLength(2);
    });

    it("shows no data message when list is empty", () => {
      setup({ ...defaultData, items: [], totalCount: 0 });
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("renders page size selector in footer", () => {
      setup();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("Yearly Rate Display", () => {
    it("renders ₹ prefix on yearly rate", () => {
      setup();
      expect(screen.getByText("₹1,500")).toBeInTheDocument();
      expect(screen.getByText("₹3,000")).toBeInTheDocument();
    });

    it("does not show .00 decimal suffix", () => {
      setup();
      expect(screen.queryByText("₹1,500.00")).not.toBeInTheDocument();
      expect(screen.queryByText("₹3,000.00")).not.toBeInTheDocument();
    });

    it("renders - for a zero yearly rate", () => {
      setup({
        ...defaultData,
        items: [{ ...mockRates[0], yearlyRate: 0 }],
        totalCount: 1,
      });
      expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    });
  });

  describe("Actions", () => {
    it("renders Edit and Delete button for each row", () => {
      setup();
      expect(screen.getAllByLabelText("Edit")).toHaveLength(2);
      expect(screen.getAllByLabelText("Delete")).toHaveLength(2);
    });

    it("navigates to edit route when Edit clicked", () => {
      setup();
      screen.getAllByLabelText("Edit")[0].click();
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/en/property-tax/water-connection-master/water-rate/edit/1"
      );
    });

    it("navigates to correct id for second row Edit", () => {
      setup();
      screen.getAllByLabelText("Edit")[1].click();
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/en/property-tax/water-connection-master/water-rate/edit/2"
      );
    });

    it("calls deleteWaterRateAction with row id on Delete", async () => {
      mockDelete.mockResolvedValueOnce({ success: true });
      setup();
      screen.getAllByLabelText("Delete")[0].click();
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(1);
      });
    });

    it("shows success toast after successful delete", async () => {
      mockDelete.mockResolvedValueOnce({ success: true });
      setup();
      screen.getAllByLabelText("Delete")[0].click();
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Water Rate deleted successfully");
      });
    });

    it("shows error toast on generic delete failure", async () => {
      mockDelete.mockResolvedValueOnce({ success: false, statusCode: 500 });
      setup();
      screen.getAllByLabelText("Delete")[0].click();
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete");
      });
    });

    it("shows in-use toast when delete returns 409", async () => {
      mockDelete.mockResolvedValueOnce({ success: false, statusCode: 409 });
      setup();
      screen.getAllByLabelText("Delete")[0].click();
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Water rate is currently in use");
      });
    });
  });
});
