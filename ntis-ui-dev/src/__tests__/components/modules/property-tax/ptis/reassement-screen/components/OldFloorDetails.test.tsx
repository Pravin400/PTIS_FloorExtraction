import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OldFloorDetails } from "@/components/modules/property-tax/ptis/reassement-screen/components/OldFloorDetails";
import { NextIntlClientProvider } from "next-intl";
import { MappedFloorDetail } from "@/types/reassessment.types";
import type { SharedAutoScrollController } from "@/hooks/ptis/reassessment/useSharedAutoScroll";

const mockMessages = {
  reassessment: {
    floorDetails: {
      oldTitle: "Old Floor Details",
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
    },
    buttons: {
      startAutoScroll: "Start Auto Scroll",
      stopAutoScroll: "Stop Auto Scroll",
    },
  },
};

describe("OldFloorDetails", () => {
  const mockData: MappedFloorDetail[] = [
    {
      floor: "GF",
      conYear: "2020",
      asstYear: "2021",
      constType: "RCC",
      use: "Residential",
      carpetAreaSqFt: 500,
      carpetAreaSqM: 46.45,
      builtUpAreaSqFt: 600,
      builtUpAreaSqM: 55.74,
      rate: 100,
      yearlyRate: 1200,
      financialYear: "2021-22",
      ocCertificateNo: "OC67890",
      ocCertificateIssueDate: "2024-08-04T00:00:00",
      ccCertificateNo: "CC98765",
      ccCertificateIssueDate: "2024-09-04T00:00:00",
      renter: "John Doe",
      taxLiability: "₹5000",
      rentMy: 10000,
      rentalValue: 120000,
      depreciation: 10,
      alv: 108000,
      mr: 100,
      rv: 120000,
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
          <OldFloorDetails data={data} autoScrollController={autoScrollController} />
        </NextIntlClientProvider>
      ),
    };
  }

  it("renders the component title", () => {
    setup();
    expect(screen.getByText("Old Floor Details")).toBeInTheDocument();
  });

  it("renders the floor data", () => {
    setup();
    expect(screen.getByText("GF")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
  });

  it("registers with the shared auto scroll controller", () => {
    const autoScrollController = createMockAutoScrollController();
    setup(mockData, autoScrollController);
    expect(autoScrollController.register).toHaveBeenCalledWith(
      "old",
      expect.any(Function)
    );
  });
});
