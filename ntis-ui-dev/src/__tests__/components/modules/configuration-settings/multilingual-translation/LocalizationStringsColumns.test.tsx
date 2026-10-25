import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLocalizationStringsColumns } from "@/components/modules/configuration-settings/multilingual-translation/LocalizationStringsColumns";
import type { MultilingualTranslation, SupportedLanguageCode } from "@/types/multilingual-translation.types";

// Mock Input component
vi.mock("@/components/common", () => ({
  Column: vi.fn(),
  Input: ({
    value,
    placeholder,
    onChange,
  }: {
    value: string;
    placeholder?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <input
      data-testid="input-field"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
    />
  ),
}));

describe("getLocalizationStringsColumns", () => {
  const mockT = (key: string) => key;
  const mockOnCellChange = vi.fn();

  const mockRow: MultilingualTranslation = {
    id: 1,
    resource: "common",
    key: "greeting",
    en_US: "Hello",
    hi_IN: "नमस्ते",
    mr_IN: "नमस्कार",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Base columns", () => {
    it("always includes resource, key, and en_US columns (plus language columns when languages is empty)", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: [],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      // Empty languages array means show all columns including hi_IN and mr_IN
      expect(columns).toHaveLength(5);
      expect(columns.map((c) => c.key)).toEqual(["resource", "key", "en_US", "hi_IN", "mr_IN"]);
    });

    it("resource column renders with correct styling", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: [],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const resourceColumn = columns.find((c) => c.key === "resource");
      const { container } = render(
        <>{resourceColumn?.render?.("test-resource", mockRow, 0)}</>
      );

      const span = container.querySelector("span");
      expect(span).toHaveClass("font-mono", "text-sm", "text-slate-700");
      expect(span).toHaveTextContent("test-resource");
    });

    it("key column renders with correct styling", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: [],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const keyColumn = columns.find((c) => c.key === "key");
      const { container } = render(
        <>{keyColumn?.render?.("test-key", mockRow, 0)}</>
      );

      const span = container.querySelector("span");
      expect(span).toHaveClass("font-medium", "text-blue-600");
      expect(span).toHaveTextContent("test-key");
    });

    it("en_US column renders with correct styling", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: [],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const enColumn = columns.find((c) => c.key === "en_US");
      const { container } = render(
        <>{enColumn?.render?.("Hello World", mockRow, 0)}</>
      );

      const span = container.querySelector("span");
      expect(span).toHaveClass("text-slate-800");
      expect(span).toHaveTextContent("Hello World");
    });
  });

  describe("Language-specific columns", () => {
    it("includes hi_IN column when 'hi' language is active", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      expect(columns.map((c) => c.key)).toContain("hi_IN");
    });

    it("includes mr_IN column when 'mr' language is active", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["mr"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      expect(columns.map((c) => c.key)).toContain("mr_IN");
    });

    it("includes both hi_IN and mr_IN columns when both languages are active", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi", "mr"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      expect(columns.map((c) => c.key)).toEqual([
        "resource",
        "key",
        "en_US",
        "hi_IN",
        "mr_IN",
      ]);
    });

    it("includes all language columns when languages array is empty", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: [] as SupportedLanguageCode[],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      // Empty languages means show all
      expect(columns.map((c) => c.key)).toEqual([
        "resource",
        "key",
        "en_US",
        "hi_IN",
        "mr_IN",
      ]);
    });
  });

  describe("hi_IN column rendering", () => {
    it("renders Input with row value", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const hiColumn = columns.find((c) => c.key === "hi_IN");
      render(<>{hiColumn?.render?.(mockRow.hi_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      expect(input).toHaveValue("नमस्ते");
    });

    it("uses edited value when present in edits", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi"],
        edits: { 1: { hi_IN: "Edited Hindi" } },
        onCellChange: mockOnCellChange,
      });

      const hiColumn = columns.find((c) => c.key === "hi_IN");
      render(<>{hiColumn?.render?.(mockRow.hi_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      expect(input).toHaveValue("Edited Hindi");
    });

    it("calls onCellChange with correct parameters when value changes", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const hiColumn = columns.find((c) => c.key === "hi_IN");
      render(<>{hiColumn?.render?.(mockRow.hi_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      fireEvent.change(input, { target: { value: "New Hindi" } });

      expect(mockOnCellChange).toHaveBeenCalledWith(1, "hi_IN", "New Hindi");
    });

    it("has correct placeholder", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const hiColumn = columns.find((c) => c.key === "hi_IN");
      render(<>{hiColumn?.render?.(mockRow.hi_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      expect(input).toHaveAttribute("placeholder", "table.needsTranslation");
    });
  });

  describe("mr_IN column rendering", () => {
    it("renders Input with row value", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["mr"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const mrColumn = columns.find((c) => c.key === "mr_IN");
      render(<>{mrColumn?.render?.(mockRow.mr_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      expect(input).toHaveValue("नमस्कार");
    });

    it("uses edited value when present in edits", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["mr"],
        edits: { 1: { mr_IN: "Edited Marathi" } },
        onCellChange: mockOnCellChange,
      });

      const mrColumn = columns.find((c) => c.key === "mr_IN");
      render(<>{mrColumn?.render?.(mockRow.mr_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      expect(input).toHaveValue("Edited Marathi");
    });

    it("calls onCellChange with correct parameters when value changes", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["mr"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const mrColumn = columns.find((c) => c.key === "mr_IN");
      render(<>{mrColumn?.render?.(mockRow.mr_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      fireEvent.change(input, { target: { value: "New Marathi" } });

      expect(mockOnCellChange).toHaveBeenCalledWith(1, "mr_IN", "New Marathi");
    });
  });

  describe("Column widths", () => {
    it("has correct widths for all columns", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi", "mr"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const widths = columns.map((c) => ({ key: c.key, width: c.width }));
      expect(widths).toEqual([
        { key: "resource", width: "15%" },
        { key: "key", width: "20%" },
        { key: "en_US", width: "25%" },
        { key: "hi_IN", width: "20%" },
        { key: "mr_IN", width: "20%" },
      ]);
    });
  });

  describe("Column labels", () => {
    it("uses translation function for labels", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi", "mr"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      expect(columns.map((c) => c.label)).toEqual([
        "table.resource",
        "table.key",
        "table.en_US",
        "table.hi_IN",
        "table.mr_IN",
      ]);
    });
  });

  describe("Edge cases", () => {
    it("handles row with undefined hi_IN value", () => {
      const rowWithUndefined = {
        ...mockRow,
        hi_IN: undefined as unknown as string,
      };

      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi"],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const hiColumn = columns.find((c) => c.key === "hi_IN");
      render(<>{hiColumn?.render?.(rowWithUndefined.hi_IN, rowWithUndefined, 0)}</>);

      const input = screen.getByTestId("input-field");
      expect(input).toHaveValue("");
    });

    it("handles empty string edit value", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: ["hi"],
        edits: { 1: { hi_IN: "" } },
        onCellChange: mockOnCellChange,
      });

      const hiColumn = columns.find((c) => c.key === "hi_IN");
      render(<>{hiColumn?.render?.(mockRow.hi_IN, mockRow, 0)}</>);

      const input = screen.getByTestId("input-field");
      expect(input).toHaveValue("");
    });

    it("handles non-string values in resource column", () => {
      const columns = getLocalizationStringsColumns({
        t: mockT,
        languages: [],
        edits: {},
        onCellChange: mockOnCellChange,
      });

      const resourceColumn = columns.find((c) => c.key === "resource");
      const { container } = render(
        <>{resourceColumn?.render?.(123 as unknown as string, mockRow, 0)}</>
      );

      const span = container.querySelector("span");
      expect(span).toHaveTextContent("");
    });
  });
});
