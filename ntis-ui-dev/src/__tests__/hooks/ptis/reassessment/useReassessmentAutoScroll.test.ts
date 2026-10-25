import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReassessmentAutoScroll } from "@/hooks/ptis/reassessment/useReassessmentAutoScroll";

describe("useReassessmentAutoScroll", () => {
  let mockElement: Pick<HTMLElement, "scrollLeft" | "scrollWidth" | "clientWidth">;

  beforeEach(() => {
    // Mock requestAnimationFrame and cancelAnimationFrame
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return window.setTimeout(() => cb(performance.now()), 0);
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      window.clearTimeout(id);
    });

    // Create mock element
    mockElement = {
      scrollLeft: 0,
      scrollWidth: 500,
      clientWidth: 200,
    };

    // Mock document.querySelector
    vi.spyOn(document, "querySelector").mockReturnValue(mockElement as unknown as Element);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when isAutoScrolling is false", () => {
    renderHook(() =>
      useReassessmentAutoScroll({
        isAutoScrolling: false,
        containerId: "#test-container",
      })
    );
    expect(document.querySelector).not.toHaveBeenCalled();
  });

  it("starts auto scrolling when isAutoScrolling is true", () => {
    renderHook(() =>
      useReassessmentAutoScroll({
        isAutoScrolling: true,
        containerId: "#test-container",
      })
    );
    expect(document.querySelector).toHaveBeenCalledWith("#test-container .overflow-auto");
  });
});
