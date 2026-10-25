import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NewFloorDetails } from "@/components/modules/property-tax/ptis/reassement-screen/components/NewFloorDetails";
import { NextIntlClientProvider } from "next-intl";
import { MappedFloorDetail } from "@/types/reassessment.types";
import type { SharedAutoScrollController } from "@/hooks/ptis/reassessment/useSharedAutoScroll";

const mockMessages = {
  reassessment: {
    floorDetails: {
      newTitle: "New Floor Details",
      columns: {
        floor: "Floor",
        conYear: "Con Year",
        asstYear: "Asst Year",
        constType: "Const Type",
        use: "Use",
        carpetArea: "Carpet Area",
        builtUpArea: "Built Up Area",
        rate: "Rate",
        yearlyRate: "Yearly Rate",
        financialYear: "Fin Year",
        renter: "Renter",
        taxLiability: "Tax Liability",
        rentMy: "Rent My",
        rentalValue: "Rental Value",
        depreciation: "Depreciation",
        alv: "ALV",
        mr: "MR",
        rv: "RV",
        status: "Status",
      },
      statuses: {
        unchanged: "Unchanged",
        added: "Added",
        removed: "Removed",
      },
    },
    buttons: {
      startAutoScroll: "Start Auto Scroll",
      stopAutoScroll: "Stop Auto Scroll",
    },
  },
};

describe("NewFloorDetails", () => {
  const mockData: MappedFloorDetail[] = [
    {
      floor: "GF",
      conYear: "2021",
      asstYear: "2022",
      constType: "RCC",
      use: "Commercial",
      carpetAreaSqFt: 600,
      carpetAreaSqM: 55.74,
      builtUpAreaSqFt: 700,
      builtUpAreaSqM: 65.03,
      rate: 120,
      yearlyRate: 1440,
      financialYear: "2022-23",
      ocCertificateNo: "OC12345",
      ocCertificateIssueDate: "2024-08-04T00:00:00",
      ccCertificateNo: "",
      ccCertificateIssueDate: "",
      renter: "Jane Doe",
      taxLiability: "₹7000",
      rentMy: 12000,
      rentalValue: 144000,
      depreciation: 10,
      alv: 129600,
      mr: 120,
      rv: 144000,
      status: "Unchanged",
    },
  ];

  function createMockAutoScrollController(): SharedAutoScrollController {
    return {
      register: vi.fn(() => vi.fn()),
      stopAll: vi.fn(),
      setActive: vi.fn(),
      activeScrollerId: null,
    };
  }

  function setup(
    data = mockData,
    autoScrollController = createMockAutoScrollController()
  ) {
    return {
      autoScrollController,
      ...render(
        <NextIntlClientProvider locale="en" messages={mockMessages}>
          <NewFloorDetails data={data} autoScrollController={autoScrollController} />
        </NextIntlClientProvider>
      ),
    };
  }

  it("renders the component title", () => {
    setup();
    expect(screen.getByText("New Floor Details")).toBeInTheDocument();
  });

  it("renders the floor data", () => {
    setup();
    expect(screen.getByText("GF")).toBeInTheDocument();
    expect(screen.getByText("2021")).toBeInTheDocument();
    expect(screen.getByText("Commercial")).toBeInTheDocument();
  });

  it("renders the status correctly", () => {
    setup();
    expect(screen.getByText("Unchanged")).toBeInTheDocument();
  });

  it("registers with the shared auto scroll controller", () => {
    const autoScrollController = createMockAutoScrollController();
    setup(mockData, autoScrollController);
    expect(autoScrollController.register).toHaveBeenCalledWith(
      "new",
      expect.any(Function)
    );
  });
});
