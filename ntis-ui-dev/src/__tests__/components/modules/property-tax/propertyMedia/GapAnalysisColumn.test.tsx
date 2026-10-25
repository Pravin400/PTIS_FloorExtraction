import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { getCoverageColumns } from "@/components/modules/property-tax/PropertyMedia/GapAnalysis/GapAnalysisColumn";
import { DetailedCoverageItem } from "@/types/PropertyMedia/PropertyMedia.types";

describe("GapAnalysisColumn", () => {
  const mockTranslate = (key: string) => key;
  const columns = getCoverageColumns(mockTranslate);

  const createMockRow = (
    overrides?: Partial<DetailedCoverageItem>
  ): DetailedCoverageItem => ({
    id: 1,
    category: "Building Photo",
    photoTypeName: "Front Elevation",
    applicable: 100,
    available: 80,
    missing: 20,
    requirement: "Mandatory",
    coveragePercentage: "80%",
    ...overrides,
  });

  it("returns all expected column definitions with translation keys", () => {
    expect(columns).toHaveLength(7);
    const keys = columns.map((col) => col.key);
    expect(keys).toEqual([
      "category",
      "photoTypeName",
      "requirement",
      "applicable",
      "available",
      "missing",
      "coveragePercentage",
    ]);

    expect(columns[0].label).toBe("detailedCoverageTable.columns.category");
    expect(columns[1].label).toBe("detailedCoverageTable.columns.typeSubtype");
    expect(columns[2].label).toBe("detailedCoverageTable.columns.requirement");
    expect(columns[3].label).toBe("detailedCoverageTable.columns.applicable");
    expect(columns[4].label).toBe("detailedCoverageTable.columns.available");
    expect(columns[5].label).toBe("detailedCoverageTable.columns.missing");
    expect(columns[6].label).toBe("detailedCoverageTable.columns.coverage");
  });

  it("uses default English column labels when no translation function is provided", () => {
    const defaultCols = getCoverageColumns();
    expect(defaultCols[0].label).toBe("Category");
    expect(defaultCols[1].label).toBe("Type / Subtype");
    expect(defaultCols[2].label).toBe("Requirement");
  });

  it("renders photoTypeName with font-extrabold for Mandatory requirement", () => {
    const col = columns.find((c) => c.key === "photoTypeName");
    expect(col?.render).toBeDefined();

    const mandatoryRow = createMockRow({
      photoTypeName: "Front Elevation",
      requirement: "Mandatory",
    });
    const { container: mandatoryContainer } = render(
      <>{col?.render!("Front Elevation", mandatoryRow, 0)}</>
    );
    expect(mandatoryContainer.querySelector(".font-extrabold")).toBeInTheDocument();
    expect(screen.getByText("Front Elevation")).toBeInTheDocument();

    const optionalRow = createMockRow({
      photoTypeName: "Backyard",
      requirement: "Additional",
    });
    const { container: optionalContainer } = render(
      <>{col?.render!("Backyard", optionalRow, 1)}</>
    );
    expect(optionalContainer.querySelector(".text-slate-700")).toBeInTheDocument();
    expect(screen.getByText("Backyard")).toBeInTheDocument();
  });

  it("renders requirement badge or dash fallback", () => {
    const col = columns.find((c) => c.key === "requirement");
    expect(col?.render).toBeDefined();

    const rowWithReq = createMockRow({ requirement: "Mandatory" });
    render(<>{col?.render!("Mandatory", rowWithReq, 0)}</>);
    expect(screen.getByText("Mandatory")).toBeInTheDocument();

    const rowWithoutReq = createMockRow({ requirement: "" });
    render(<>{col?.render!("", rowWithoutReq, 1)}</>);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("formats numerical columns applicable, available, and missing with locale strings", () => {
    const applicableCol = columns.find((c) => c.key === "applicable");
    const availableCol = columns.find((c) => c.key === "available");
    const missingCol = columns.find((c) => c.key === "missing");

    const row = createMockRow({
      applicable: 15000,
      available: 12000,
      missing: 3000,
    });

    render(
      <div>
        <span data-testid="app">{applicableCol?.render!(row.applicable, row, 0)}</span>
        <span data-testid="avail">{availableCol?.render!(row.available, row, 0)}</span>
        <span data-testid="miss">{missingCol?.render!(row.missing, row, 0)}</span>
      </div>
    );

    expect(screen.getByTestId("app")).toHaveTextContent("15,000");
    expect(screen.getByTestId("avail")).toHaveTextContent("12,000");
    expect(screen.getByTestId("miss")).toHaveTextContent("3,000");
  });

  it("formats numerical columns with 0 as '0' rather than fallback '-'", () => {
    const applicableCol = columns.find((c) => c.key === "applicable");
    const availableCol = columns.find((c) => c.key === "available");
    const missingCol = columns.find((c) => c.key === "missing");

    const row = createMockRow({
      applicable: 0,
      available: 0,
      missing: 0,
    });

    render(
      <div>
        <span data-testid="zero-app">{applicableCol?.render!(0, row, 0)}</span>
        <span data-testid="zero-avail">{availableCol?.render!(0, row, 0)}</span>
        <span data-testid="zero-miss">{missingCol?.render!(0, row, 0)}</span>
      </div>
    );

    expect(screen.getByTestId("zero-app")).toHaveTextContent("0");
    expect(screen.getByTestId("zero-avail")).toHaveTextContent("0");
    expect(screen.getByTestId("zero-miss")).toHaveTextContent("0");
  });

  it("renders coverage percentage with ProgressBar parsing both numeric and string values", () => {
    const col = columns.find((c) => c.key === "coveragePercentage");
    expect(col?.render).toBeDefined();

    const rowWithStringPct = createMockRow({ coveragePercentage: "75.5%" });
    const { container: stringContainer } = render(
      <>{col?.render!("75.5%", rowWithStringPct, 0)}</>
    );
    expect(stringContainer.textContent).toContain("75.5%");

    const rowWithNumPct = createMockRow({ coveragePercentage: undefined });
    const { container: numContainer } = render(
      <>{col?.render!(50, rowWithNumPct, 1)}</>
    );
    expect(numContainer.textContent).toContain("50%");
  });
});
