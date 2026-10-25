import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidationSection } from "@/components/modules/property-tax/assessment-year-range/shared/components/ValidationSection";

describe("ValidationSection (AssessmentYearRange)", () => {
  it("renders the mandatory fields note", () => {
    const mockTCommon = vi.fn((key: string) => key === "note.mandatory" ? "All fields marked with * are mandatory" : key);
    render(<ValidationSection tCommon={mockTCommon} />);
    
    expect(screen.getByText("All fields marked with * are mandatory")).toBeInTheDocument();
  });

  it("calls tCommon with correct key", () => {
    const mockTCommon = vi.fn((key: string) => key);
    render(<ValidationSection tCommon={mockTCommon} />);
    
    expect(mockTCommon).toHaveBeenCalledWith("note.mandatory");
  });

  it("renders with alert styling", () => {
    const mockTCommon = vi.fn((key: string) => key);
    const { container } = render(<ValidationSection tCommon={mockTCommon} />);
    
    // Check for the presence of orange/warning styling classes
    const alertDiv = container.querySelector(".bg-orange-50");
    expect(alertDiv).toBeInTheDocument();
    
    const borderDiv = container.querySelector(".border-orange-200");
    expect(borderDiv).toBeInTheDocument();
  });

  it("renders AlertCircle icon", () => {
    const mockTCommon = vi.fn((key: string) => key);
    const { container } = render(<ValidationSection tCommon={mockTCommon} />);
    
    // Check for SVG element (lucide-react renders icons as SVG)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
