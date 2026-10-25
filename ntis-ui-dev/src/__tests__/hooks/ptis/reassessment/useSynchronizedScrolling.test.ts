import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSynchronizedScrolling } from "@/hooks/ptis/reassessment/useSynchronizedScrolling";

describe("useSynchronizedScrolling", () => {
  it("returns refs for both tables", () => {
    const { result } = renderHook(() => useSynchronizedScrolling());
    expect(result.current.oldTableRef).toBeDefined();
    expect(result.current.newTableRef).toBeDefined();
  });
});
