import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { getTariffColumns } from "@/components/modules/water-bill/tariff-workbench/tariffColumns";
import type { TariffWorkbench as TariffWorkbenchType } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

describe("tariffColumns Tests", () => {
  const mockT = (key: string) => key;
  const mockTCommon = (key: string) => key;
  const mockOnSort = vi.fn();

  const sampleRow: TariffWorkbenchType = {
    id: 1,
    tariffCode: "RES-MTR-2026",
    tariffName: "Residential Metered",
    financialYearId: 1,
    connectionTypeId: 1,
    connectionCategoryId: 1,
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    effectiveTo: "2027-03-31T00:00:00.000Z",
    versionNo: 1,
    status: "Published",
    description: "Test Description",
    isActive: true,
    financialYearCode: "2026-27",
    connectionTypeName: "Residential",
    connectionCategoryName: "Regular",
    slabsCount: 2,
  };

  it("should return the correct number of column definitions", () => {
    const columns = getTariffColumns(mockT, mockTCommon);
    expect(columns.length).toBe(11);
    expect(columns.some((c) => c.key === "rateSlabs")).toBe(true);
  });

  it("should render tariff code, tariff name, and year correctly", () => {
    const columns = getTariffColumns(mockT, mockTCommon);

    const codeCol = columns.find((c) => c.key === "tariffCode");
    const nameCol = columns.find((c) => c.key === "tariffName");
    const yearCol = columns.find((c) => c.key === "year");
    const rateSlabsCol = columns.find((c) => c.key === "rateSlabs");

    expect(codeCol?.render?.(sampleRow.tariffCode, sampleRow, 0)).toBeDefined();
    expect(nameCol?.render?.(sampleRow.tariffName, sampleRow, 0)).toBeDefined();
    expect(yearCol?.render?.(sampleRow.yearCode, sampleRow, 0)).toBeDefined();
    expect(rateSlabsCol?.render?.(null, sampleRow, 0)).toBeDefined();
  });

  it("should format date fields correctly", () => {
    const columns = getTariffColumns(mockT, mockTCommon);

    const effectiveFromCol = columns.find((c) => c.key === "effectiveFrom");
    const effectiveToCol = columns.find((c) => c.key === "effectiveTo");

    const { container: fromContainer } = render(
      effectiveFromCol?.render?.("2026-04-01T00:00:00.000Z", sampleRow, 0) as React.ReactElement
    );
    expect(fromContainer.textContent).toBe("01 Apr 2026");

    const { container: toContainer } = render(
      effectiveToCol?.render?.("2027-03-31T00:00:00.000Z", sampleRow, 0) as React.ReactElement
    );
    expect(toContainer.textContent).toBe("31 Mar 2027");

    const nullRow = { ...sampleRow, effectiveTo: null };
    const { container: nullContainer } = render(
      effectiveToCol?.render?.(null, nullRow, 0) as React.ReactElement
    );
    expect(nullContainer.textContent).toBe("—");
  });

  it("should trigger sort callback when sortable column header is clicked", () => {
    const columns = getTariffColumns(mockT, mockTCommon, "tariffCode", "asc", mockOnSort);

    const codeCol = columns.find((c) => c.key === "tariffCode");
    expect(codeCol).toBeDefined();

    if (typeof codeCol?.label !== "string") {
      render(codeCol!.label);
      const sortButton = screen.getByRole("button");
      fireEvent.click(sortButton);

      expect(mockOnSort).toHaveBeenCalledWith("tariffCode");
    }
  });

  it("should trigger onViewRateSlabs when rate slabs action button is clicked", () => {
    const mockOnViewRateSlabs = vi.fn();
    const columns = getTariffColumns(mockT, mockTCommon, undefined, undefined, undefined, mockOnViewRateSlabs);

    const rateSlabsCol = columns.find((c) => c.key === "rateSlabs");
    expect(rateSlabsCol).toBeDefined();

    const { getByRole } = render(rateSlabsCol!.render!(null, sampleRow, 0) as React.ReactElement);
    const viewButton = getByRole("button");
    fireEvent.click(viewButton);

    expect(mockOnViewRateSlabs).toHaveBeenCalledWith(sampleRow);
  });
});
