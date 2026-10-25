import { describe, it, expect, vi } from "vitest";
import { useReassessmentSummaryCards } from "@/hooks/ptis/reassessment/useReassessmentSummaryCards";
import { renderHook } from "@testing-library/react";
import { MappedFloorDetail, ReassessmentTaxRow } from "@/types/reassessment.types";

// Mock formatReassessmentCurrency
vi.mock("@/lib/utils/format", () => ({
  formatReassessmentCurrency: (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  },
  formatReassessmentTaxCurrency: (value: number, compareWith?: number) => {
    if (compareWith === undefined || value === compareWith) {
      if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)}Cr`;
      } else if (value >= 100000) {
        return `₹${(value / 100000).toFixed(2)}L`;
      }
      return `₹${value.toLocaleString('en-IN')}`;
    }

    const standard = (v: number) => {
      if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
      if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
      return `₹${v.toLocaleString('en-IN')}`;
    };

    if (standard(value) !== standard(compareWith)) return standard(value);

    if (value >= 10000000 && compareWith >= 10000000) {
      for (let decimals = 3; decimals <= 7; decimals++) {
        const formatted = `₹${(value / 10000000).toFixed(decimals)}Cr`;
        const formattedCompare = `₹${(compareWith / 10000000).toFixed(decimals)}Cr`;
        if (formatted !== formattedCompare) return formatted;
      }
    }

    return `₹${value.toLocaleString('en-IN')}`;
  },
  sumReassessmentTaxAmounts: (taxes: Record<string, number>) =>
    Object.values(taxes).reduce((sum, val) => sum + val, 0),
}));

describe("useReassessmentSummaryCards", () => {
  const mockOldFloorDetails: MappedFloorDetail[] = [
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
      renter: "John Doe",
      taxLiability: "₹5000",
      rentMy: 10000,
      rentalValue: 120000,
      depreciation: 10,
      alv: 108000,
      mr: 100,
      rv: 120000,
      ocCertificateNo: '',
      ocCertificateIssueDate: '',
      ccCertificateNo: '',
      ccCertificateIssueDate: '',
    },
  ];

  const mockNewFloorDetails: MappedFloorDetail[] = [
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
      renter: "Jane Doe",
      taxLiability: "₹7000",
      rentMy: 12000,
      rentalValue: 144000,
      depreciation: 10,
      alv: 129600,
      mr: 120,
      rv: 144000,
      status: "Added",
      ocCertificateNo: '',
      ocCertificateIssueDate: '',
      ccCertificateNo: '',
      ccCertificateIssueDate: '',
    },
  ];

  const mockTaxRows: ReassessmentTaxRow[] = [
    {
      rowType: "old",
      label: "Old Tax",
      taxes: { tax1: 1000, tax2: 500 },
      totalTax: 1500,
    },
    {
      rowType: "additional",
      label: "New Tax",
      taxes: { tax1: 1200, tax2: 600 },
      totalTax: 1800,
    },
  ];

  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      "summaryCards.carpetAreaLabel": "Carpet Area",
      "summaryCards.typeOfUseLabel": "Type of Use",
      "summaryCards.rateableValueLabel": "Rateable Value",
      "summaryCards.totalTaxLabel": "Total Tax",
      "summaryCards.units.sqM": "sq.m",
      "summaryCards.units.type": "Type",
      "summaryCards.units.rupees": "₹",
      "summaryCards.changedStatus": "CHANGED",
      "summaryCards.sameStatus": "-",
    };
    return translations[key] || key;
  };

  it("calculates total built-up area correctly", () => {
    const { result } = renderHook(() =>
      useReassessmentSummaryCards({
        oldFloorDetails: mockOldFloorDetails,
        newFloorDetails: mockNewFloorDetails,
        taxRows: mockTaxRows,
        t: mockT,
      })
    );
    expect(result.current[0].oldValue).toBe("55.74");
    expect(result.current[0].newValue).toBe("65.03");
    expect(result.current[0].difference).toBe("+9.29");
  });

  it("detects type of use change", () => {
    const { result } = renderHook(() =>
      useReassessmentSummaryCards({
        oldFloorDetails: mockOldFloorDetails,
        newFloorDetails: mockNewFloorDetails,
        taxRows: mockTaxRows,
        t: mockT,
      })
    );
    expect(result.current[1].oldValue).toBe("Residential");
    expect(result.current[1].newValue).toBe("Commercial");
    expect(result.current[1].difference).toBe("CHANGED");
  });

  it("calculates rateable value correctly", () => {
    const { result } = renderHook(() =>
      useReassessmentSummaryCards({
        oldFloorDetails: mockOldFloorDetails,
        newFloorDetails: mockNewFloorDetails,
        taxRows: mockTaxRows,
        t: mockT,
      })
    );
    expect(result.current[2].oldValue).toBe("₹1.20L");
    expect(result.current[2].newValue).toBe("₹1.44L");
    expect(result.current[2].difference).toBe("+₹24,000");
  });

  it("calculates total tax correctly", () => {
    const { result } = renderHook(() =>
      useReassessmentSummaryCards({
        oldFloorDetails: mockOldFloorDetails,
        newFloorDetails: mockNewFloorDetails,
        taxRows: mockTaxRows,
        t: mockT,
      })
    );
    expect(result.current[3].oldValue).toBe("₹1,500");
    expect(result.current[3].newValue).toBe("₹1,800");
    expect(result.current[3].difference).toBe("+₹300");
  });

  it("derives total tax from individual tax heads when API totals match", () => {
    const taxRowsWithStaleTotal: ReassessmentTaxRow[] = [
      {
        rowType: "old",
        label: "Old Tax",
        taxes: { tax1: 39668200000 },
        totalTax: 39668200000,
      },
      {
        rowType: "additional",
        label: "New Tax",
        taxes: { tax1: 39668199999 },
        totalTax: 39668200000,
      },
    ];

    const { result } = renderHook(() =>
      useReassessmentSummaryCards({
        oldFloorDetails: mockOldFloorDetails,
        newFloorDetails: mockNewFloorDetails,
        taxRows: taxRowsWithStaleTotal,
        t: mockT,
      })
    );

    expect(result.current[3].oldValue).toBe("₹3966.8200000Cr");
    expect(result.current[3].newValue).toBe("₹3966.8199999Cr");
    expect(result.current[3].difference).toBe("-₹1");
  });
});
