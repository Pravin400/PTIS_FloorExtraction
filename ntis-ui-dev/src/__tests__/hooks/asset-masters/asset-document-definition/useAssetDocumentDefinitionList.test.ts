/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useAssetDocumentDefinitionSearch,
  useAssetDocumentDefinitionList,
} from "@/hooks/asset-masters/asset-document-definition/useAssetDocumentDefinitionList";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: any) => val,
}));

describe("useAssetDocumentDefinitionList Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAssetDocumentDefinitionSearch", () => {
    it("initializes search and updates state on setSearch", () => {
      const { result } = renderHook(() =>
        useAssetDocumentDefinitionSearch({
          pageSize: 10,
          locale: "en",
        })
      );

      expect(result.current.search).toBe("");

      act(() => {
        result.current.setSearch("deed");
      });

      expect(result.current.search).toBe("deed");
    });
  });

  describe("useAssetDocumentDefinitionList", () => {
    it("handles sort toggling correctly", () => {
      const { result } = renderHook(() =>
        useAssetDocumentDefinitionList("documentCode", "asc", "en")
      );

      act(() => {
        result.current.handleSort("documentCode");
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=documentCode&sortOrder=desc")
      );
    });
  });
});
