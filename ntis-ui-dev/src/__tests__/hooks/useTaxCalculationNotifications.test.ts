import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTaxCalculationNotifications } from "@/hooks/useTaxCalculationNotifications";

// Mock server actions
vi.mock("@/app/actions/tax-calculation-job.actions", () => ({
  pauseTaxCalculationJobAction: vi.fn().mockResolvedValue({ success: true }),
  resumeTaxCalculationJobAction: vi.fn().mockResolvedValue({ success: true }),
  cancelTaxCalculationJobAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  listeners: Record<string, ((event: MessageEvent) => void)[]> = {};

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, callback: (event: MessageEvent) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: (event: MessageEvent) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit(event: string, data: unknown) {
    const handlers = this.listeners[event] || [];
    handlers.forEach((h) =>
      h({
        data: JSON.stringify(data),
      } as MessageEvent)
    );
  }

  close() {
    this.listeners = {};
  }
}

global.EventSource = MockEventSource as unknown as typeof EventSource;

describe("useTaxCalculationNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    document.cookie = "is_logged_in=true";
  });

  it("should initialize with empty active jobs", () => {
    const { result } = renderHook(() => useTaxCalculationNotifications());

    expect(result.current.jobsList).toEqual([]);
    expect(result.current.isCalculating).toBe(false);
  });

  it("should track progress events when received via SSE", () => {
    const onProgress = vi.fn();
    const { result } = renderHook(() => useTaxCalculationNotifications({ onProgress }));

    expect(MockEventSource.instances.length).toBe(1);
    const sse = MockEventSource.instances[0];

    act(() => {
      sse.emit("progress", {
        jobId: "JOB001",
        entityType: "S",
        societyDetailId: 1509001,
        wingDetailId: null,
        processedUnits: 5,
        totalUnits: 10,
        percentComplete: 50,
        status: "Processing",
        message: "Processing unit 5 of 10",
      });
    });

    expect(result.current.jobsList.length).toBe(1);
    expect(result.current.jobsList[0].jobId).toBe("JOB001");
    expect(result.current.jobsList[0].percentComplete).toBe(50);
    expect(result.current.isCalculating).toBe(true);
    expect(onProgress).toHaveBeenCalledTimes(1);
  });

  it("should support pausing, resuming, and cancelling a job", async () => {
    const { result } = renderHook(() => useTaxCalculationNotifications());

    const sse = MockEventSource.instances[0];

    act(() => {
      sse.emit("progress", {
        jobId: "JOB001",
        entityType: "S",
        societyDetailId: 1509001,
        wingDetailId: null,
        processedUnits: 3,
        totalUnits: 10,
        percentComplete: 30,
        status: "Processing",
        message: "Processing...",
      });
    });

    expect(result.current.jobsList[0].isPaused).toBeFalsy();

    // Pause
    await act(async () => {
      const ok = await result.current.pauseJob("JOB001");
      expect(ok).toBe(true);
    });
    expect(result.current.jobsList[0].status).toBe("Paused");
    expect(result.current.jobsList[0].isPaused).toBe(true);

    // Resume
    await act(async () => {
      const ok = await result.current.resumeJob("JOB001");
      expect(ok).toBe(true);
    });
    expect(result.current.jobsList[0].status).toBe("Processing");
    expect(result.current.jobsList[0].isPaused).toBe(false);

    // Cancel / Terminate
    await act(async () => {
      const ok = await result.current.cancelJob("JOB001");
      expect(ok).toBe(true);
    });
    expect(result.current.jobsList[0].status).toBe("Cancelled");
    expect(result.current.jobsList[0].isCancelled).toBe(true);
  });

  it("should update job status on completion", () => {
    const onCompleted = vi.fn();
    const { result } = renderHook(() => useTaxCalculationNotifications({ onCompleted }));

    const sse = MockEventSource.instances[0];

    act(() => {
      sse.emit("completed", {
        jobId: "JOB001",
        entityType: "S",
        societyDetailId: 1509001,
        wingDetailId: null,
        totalUnits: 10,
        succeededCount: 10,
        failedCount: 0,
        isSuccess: true,
        durationMs: 3500,
        completedAt: new Date().toISOString(),
        message: "Completed",
      });
    });

    expect(result.current.jobsList.length).toBe(1);
    expect(result.current.jobsList[0].isCompleted).toBe(true);
    expect(result.current.jobsList[0].isSuccess).toBe(true);
    expect(result.current.isCalculating).toBe(false);
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });
});
