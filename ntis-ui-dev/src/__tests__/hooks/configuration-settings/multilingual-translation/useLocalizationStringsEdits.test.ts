import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useLocalizationStringsEdits } from "@/hooks/configuration-settings/multilingual-translation/useLocalizationStringsEdits";

describe("useLocalizationStringsEdits", () => {
  beforeEach(() => {
    // No mocks needed for this pure hook
  });

  describe("initial state", () => {
    it("should initialize with empty edits", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      expect(result.current.edits).toEqual({});
    });

    it("should provide handleCellChange function", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      expect(typeof result.current.handleCellChange).toBe("function");
    });

    it("should provide clearEdits function", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      expect(typeof result.current.clearEdits).toBe("function");
    });
  });

  describe("handleCellChange", () => {
    it("should add edit for hi_IN field", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.handleCellChange(1, "hi_IN", "नमस्ते");
      });

      expect(result.current.edits).toEqual({
        1: { hi_IN: "नमस्ते" },
      });
    });

    it("should add edit for mr_IN field", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.handleCellChange(2, "mr_IN", "नमस्कार");
      });

      expect(result.current.edits).toEqual({
        2: { mr_IN: "नमस्कार" },
      });
    });

    it("should handle multiple edits for same row", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.handleCellChange(1, "hi_IN", "हैलो");
      });

      act(() => {
        result.current.handleCellChange(1, "mr_IN", "हॅलो");
      });

      expect(result.current.edits).toEqual({
        1: {
          hi_IN: "हैलो",
          mr_IN: "हॅलो",
        },
      });
    });

    it("should handle edits for multiple rows", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.handleCellChange(1, "hi_IN", "एक");
      });

      act(() => {
        result.current.handleCellChange(2, "mr_IN", "दोन");
      });

      act(() => {
        result.current.handleCellChange(3, "hi_IN", "तीन");
      });

      expect(result.current.edits).toEqual({
        1: { hi_IN: "एक" },
        2: { mr_IN: "दोन" },
        3: { hi_IN: "तीन" },
      });
    });

    it("should update existing edit", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.handleCellChange(1, "hi_IN", "पुराना");
      });

      act(() => {
        result.current.handleCellChange(1, "hi_IN", "नया");
      });

      expect(result.current.edits).toEqual({
        1: { hi_IN: "नया" },
      });
    });

    it("should handle empty string values", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.handleCellChange(1, "hi_IN", "");
      });

      expect(result.current.edits).toEqual({
        1: { hi_IN: "" },
      });
    });

    it("should preserve other fields when updating one field", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.handleCellChange(1, "hi_IN", "हिंदी");
      });

      act(() => {
        result.current.handleCellChange(1, "mr_IN", "मराठी");
      });

      expect(result.current.edits[1]).toHaveProperty("hi_IN", "हिंदी");
      expect(result.current.edits[1]).toHaveProperty("mr_IN", "मराठी");
    });
  });

  describe("clearEdits", () => {
    it("should clear all edits", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      // Add some edits
      act(() => {
        result.current.handleCellChange(1, "hi_IN", "test1");
        result.current.handleCellChange(2, "mr_IN", "test2");
      });

      expect(Object.keys(result.current.edits).length).toBe(2);

      // Clear edits
      act(() => {
        result.current.clearEdits();
      });

      expect(result.current.edits).toEqual({});
    });

    it("should handle clearing already empty edits", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      act(() => {
        result.current.clearEdits();
      });

      expect(result.current.edits).toEqual({});
    });

    it("should allow adding edits after clearing", () => {
      const { result } = renderHook(() => useLocalizationStringsEdits());

      // Add edits
      act(() => {
        result.current.handleCellChange(1, "hi_IN", "first");
      });

      // Clear
      act(() => {
        result.current.clearEdits();
      });

      // Add again
      act(() => {
        result.current.handleCellChange(2, "mr_IN", "second");
      });

      expect(result.current.edits).toEqual({
        2: { mr_IN: "second" },
      });
    });
  });

  describe("function stability", () => {
    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() => useLocalizationStringsEdits());

      const firstHandleCellChange = result.current.handleCellChange;
      const firstClearEdits = result.current.clearEdits;

      rerender();

      expect(result.current.handleCellChange).toBe(firstHandleCellChange);
      expect(result.current.clearEdits).toBe(firstClearEdits);
    });
  });
});
