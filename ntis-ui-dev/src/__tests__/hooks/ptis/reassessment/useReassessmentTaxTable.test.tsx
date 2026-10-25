import { describe, it, expect, vi } from "vitest";
import { useReassessmentTaxTable } from "@/hooks/ptis/reassessment/useReassessmentTaxTable";
import { renderHook } from "@testing-library/react";
import { ReassessmentTaxRow } from "@/types/reassessment.types";

// Mock format functions
vi.mock("@/lib/utils/format", () => ({
  formatReassessmentCurrency: (num: number) => `₹${num.toLocaleString()}`,
  formatReassessmentNumber: (num: number) => num.toLocaleString(),
  formatReassessmentTaxCurrency: (num: number) => `₹${num.toLocaleString()}`,
  sumReassessmentTaxAmounts: (taxes: Record<string, number>) =>
    Object.values(taxes).reduce((sum, val) => sum + val, 0),
}));

describe("useReassessmentTaxTable", () => {
  const mockTaxColumns = [
    { key: "tax1", label: "Tax 1", displayOrder: 1 },
    { key: "tax2", label: "Tax 2", displayOrder: 2 },
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
    {
      rowType: "total",
      label: "Total",
      taxes: { tax1: 2200, tax2: 1100 },
      totalTax: 3300,
    },
  ];

  it("generates columns correctly", () => {
    const { result } = renderHook(() =>
      useReassessmentTaxTable({
        taxColumns: mockTaxColumns,
        taxRows: mockTaxRows,
      })
    );
    expect(result.current.detailedTaxesColumns.length).toBe(4); // Taxes, tax1, tax2, Total Tax
    expect(result.current.detailedTaxesColumns[0].key).toBe("taxes");
    expect(result.current.detailedTaxesColumns[1].key).toBe("tax1");
    expect(result.current.detailedTaxesColumns[2].key).toBe("tax2");
    expect(result.current.detailedTaxesColumns[3].key).toBe("totalTax");
  });

  it("transforms tax rows correctly", () => {
    const { result } = renderHook(() =>
      useReassessmentTaxTable({
        taxColumns: mockTaxColumns,
        taxRows: mockTaxRows,
      })
    );
    expect(result.current.detailedTaxesData.length).toBe(3);
    expect(result.current.detailedTaxesData[0].taxes).toBe("Old Tax");
    expect(result.current.detailedTaxesData[0].tax1).toBe(1000);
    expect(result.current.detailedTaxesData[0].tax2).toBe(500);
    expect(result.current.detailedTaxesData[0].totalTax).toBe("₹1,500");
  });
});
