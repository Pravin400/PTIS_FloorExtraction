import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RvCvCell, formatRvCvText } from "@/components/modules/property-tax/search-property/results/RvCvCell";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      "results.columns.rvLabel": "RV :-",
      "results.columns.cvLabel": "CV :-",
      "results.format.currency": "{amount}",
    };
    let result = translations[key] || key;
    if (params && typeof result === "string") {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
    }
    return result;
  },
}));

describe("formatRvCvText", () => {
  it("formats RV only", () => {
    expect(formatRvCvText(1200, null)).toBe("RV :- 1,200");
    expect(formatRvCvText(1250.45, undefined)).toBe("RV :- 1,250.45");
  });

  it("formats CV only", () => {
    expect(formatRvCvText(null, 50000)).toBe("CV :- 50,000");
    expect(formatRvCvText(undefined, 50000.75)).toBe("CV :- 50,000.75");
  });

  it("formats both RV and CV with newline", () => {
    expect(formatRvCvText(1200, 50000)).toBe("RV :- 1,200\nCV :- 50,000");
  });

  it("returns dash for missing values", () => {
    expect(formatRvCvText(null, null)).toBe("-");
    expect(formatRvCvText(0, 0)).toBe("-");
    expect(formatRvCvText(undefined, undefined)).toBe("-");
  });
});

describe("RvCvCell", () => {
  it("renders RV only", () => {
    render(<RvCvCell rv={1200} cv={null} />);
    expect(screen.getByText("RV :-")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.queryByText("CV :-")).toBeInTheDocument();
    expect(screen.queryByText("50,000")).not.toBeInTheDocument();
  });

  it("renders CV only", () => {
    render(<RvCvCell rv={0} cv={50000} />);
    expect(screen.getByText("CV :-")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
    expect(screen.queryByText("RV :-")).toBeInTheDocument();
    expect(screen.queryByText("1,200")).not.toBeInTheDocument();
  });

  it("renders both RV and CV", () => {
    render(<RvCvCell rv={1200} cv={50000} />);
    expect(screen.getByText("RV :-")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("CV :-")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
  });

  it("renders dash when both values are missing or zero", () => {
    render(<RvCvCell rv={0} cv={null} />);
    const elements = screen.getAllByText("-");
    expect(elements.length).toBe(2);
  });
});
