/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useAssetFieldDefinitionSearch,
  useAssetFieldDefinitionList,
} from "@/hooks/asset-masters/asset-field-definition/useAssetFieldDefinitionList";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: any) => val,
}));

describe("useAssetFieldDefinitionList Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAssetFieldDefinitionSearch", () => {
    it("initializes search and updates state on setSearch", () => {
      const { result } = renderHook(() =>
        useAssetFieldDefinitionSearch({
          pageSize: 10,
          locale: "en",
        })
      );

      expect(result.current.search).toBe("");

      act(() => {
        result.current.setSearch("building");
      });

      expect(result.current.search).toBe("building");
    });
  });

  describe("useAssetFieldDefinitionList", () => {
    it("handles sort toggling correctly", () => {
      const { result } = renderHook(() =>
        useAssetFieldDefinitionList("fieldCode", "asc", "en")
      );

      act(() => {
        result.current.handleSort("fieldCode");
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=fieldCode&sortOrder=desc")
      );
    });

    it("handles new column sort correctly", () => {
      const { result } = renderHook(() =>
        useAssetFieldDefinitionList("fieldCode", "asc", "en")
      );

      act(() => {
        result.current.handleSort("fieldName");
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=fieldName&sortOrder=asc")
      );
    });
  });
});
