import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pollMediaJobStatus } from "@/lib/utils/PropertyMedia/jobStatusPolling";
import * as serverActions from "@/app/[locale]/property-tax/property-media/action";

describe("pollMediaJobStatus", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockToast = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    };

    const mockT = vi.fn((key: string, values?: Record<string, string | number>) => {
        if (values?.jobCode) return `${key}:${values.jobCode}`;
        return key;
    });

    it("handles Completed status and fires success toast", async () => {
        vi.spyOn(serverActions, "fetchPropertyMediaJobStatusAction").mockResolvedValue({
            success: true,
            data: {
                jobId: 1,
                jobCode: "JOB-001",
                recordsSelected: 1,
                status: "Completed",
            },
        });

        const onCompleted = vi.fn();

        pollMediaJobStatus({
            jobId: 1,
            recordsCount: 1,
            toast: mockToast,
            t: mockT,
            onCompleted,
        });

        // Advance by initial delay for small upload (1500ms)
        await vi.advanceTimersByTimeAsync(1500);

        expect(serverActions.fetchPropertyMediaJobStatusAction).toHaveBeenCalledWith(1);
        expect(mockToast.success).toHaveBeenCalledWith("uploadDownloadDrawer.status.completed:JOB-001");
        expect(onCompleted).toHaveBeenCalledWith(
            expect.objectContaining({ jobId: 1, status: "Completed" })
        );
    });

    it("handles Failed status and fires error toast", async () => {
        vi.spyOn(serverActions, "fetchPropertyMediaJobStatusAction").mockResolvedValue({
            success: true,
            data: {
                jobId: 2,
                jobCode: "JOB-002",
                recordsSelected: 1,
                status: "Failed",
            },
        });

        const onFailed = vi.fn();

        pollMediaJobStatus({
            jobId: 2,
            recordsCount: 1,
            toast: mockToast,
            t: mockT,
            onFailed,
        });

        await vi.advanceTimersByTimeAsync(1500);

        expect(serverActions.fetchPropertyMediaJobStatusAction).toHaveBeenCalledWith(2);
        expect(mockToast.error).toHaveBeenCalledWith("uploadDownloadDrawer.status.failed:JOB-002");
        expect(onFailed).toHaveBeenCalledWith(
            expect.objectContaining({ jobId: 2, status: "Failed" })
        );
    });

    it("handles Cancelled status and fires warning toast", async () => {
        vi.spyOn(serverActions, "fetchPropertyMediaJobStatusAction").mockResolvedValue({
            success: true,
            data: {
                jobId: 3,
                jobCode: "JOB-003",
                recordsSelected: 1,
                status: "Cancelled",
            },
        });

        const onCancelled = vi.fn();

        pollMediaJobStatus({
            jobId: 3,
            recordsCount: 1,
            toast: mockToast,
            t: mockT,
            onCancelled,
        });

        await vi.advanceTimersByTimeAsync(1500);

        expect(serverActions.fetchPropertyMediaJobStatusAction).toHaveBeenCalledWith(3);
        expect(mockToast.warning).toHaveBeenCalledWith("uploadDownloadDrawer.status.cancelled:JOB-003");
        expect(onCancelled).toHaveBeenCalledWith(
            expect.objectContaining({ jobId: 3, status: "Cancelled" })
        );
    });

    it("continues polling through Pending and Running until Completed", async () => {
        const actionSpy = vi
            .spyOn(serverActions, "fetchPropertyMediaJobStatusAction")
            .mockResolvedValueOnce({
                success: true,
                data: {
                    jobId: 4,
                    jobCode: "JOB-004",
                    recordsSelected: 10,
                    status: "Pending",
                },
            })
            .mockResolvedValueOnce({
                success: true,
                data: {
                    jobId: 4,
                    jobCode: "JOB-004",
                    recordsSelected: 10,
                    status: "Running",
                },
            })
            .mockResolvedValueOnce({
                success: true,
                data: {
                    jobId: 4,
                    jobCode: "JOB-004",
                    recordsSelected: 10,
                    status: "Completed",
                },
            });

        const onCompleted = vi.fn();

        pollMediaJobStatus({
            jobId: 4,
            recordsCount: 10,
            toast: mockToast,
            t: mockT,
            onCompleted,
        });

        // 1st poll (initial delay for batch > 3 is 2500ms)
        await vi.advanceTimersByTimeAsync(2500);
        expect(actionSpy).toHaveBeenCalledTimes(1);

        // 2nd poll (from Pending status delay is 1500ms)
        await vi.advanceTimersByTimeAsync(1500);
        expect(actionSpy).toHaveBeenCalledTimes(2);

        // 3rd poll (from Running status delay is 2500ms)
        await vi.advanceTimersByTimeAsync(2500);
        expect(actionSpy).toHaveBeenCalledTimes(3);

        expect(mockToast.success).toHaveBeenCalledWith("uploadDownloadDrawer.status.completed:JOB-004");
        expect(onCompleted).toHaveBeenCalledTimes(1);
    });

    it("cancels polling when the returned cancel function is called", async () => {
        const actionSpy = vi
            .spyOn(serverActions, "fetchPropertyMediaJobStatusAction")
            .mockResolvedValue({
                success: true,
                data: {
                    jobId: 5,
                    jobCode: "JOB-005",
                    recordsSelected: 1,
                    status: "Running",
                },
            });

        const cancel = pollMediaJobStatus({
            jobId: 5,
            recordsCount: 1,
            toast: mockToast,
            t: mockT,
        });

        // Cancel before any timer fires
        cancel();

        await vi.advanceTimersByTimeAsync(5000);
        expect(actionSpy).not.toHaveBeenCalled();
    });

    it("ignores an in-flight response after cancellation", async () => {
        let resolveStatus: ((value: {
            success: boolean;
            data?: {
                jobId: number;
                jobCode: string;
                recordsSelected: number;
                status: "Running";
            };
        }) => void) | undefined;
        const actionSpy = vi
            .spyOn(serverActions, "fetchPropertyMediaJobStatusAction")
            .mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolveStatus = resolve;
                    })
            );
        const onStatusChange = vi.fn();
        const onSettled = vi.fn();

        const cancel = pollMediaJobStatus({
            jobId: 7,
            toast: mockToast,
            t: mockT,
            onStatusChange,
            onSettled,
        });

        await vi.advanceTimersByTimeAsync(1500);
        expect(actionSpy).toHaveBeenCalledTimes(1);

        cancel();
        resolveStatus?.({
            success: true,
            data: {
                jobId: 7,
                jobCode: "JOB-007",
                recordsSelected: 1,
                status: "Running",
            },
        });
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(5000);

        expect(actionSpy).toHaveBeenCalledTimes(1);
        expect(onStatusChange).not.toHaveBeenCalled();
        expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it("stops polling and warns after 3 consecutive errors", async () => {
        vi.spyOn(serverActions, "fetchPropertyMediaJobStatusAction").mockResolvedValue({
            success: false,
            error: "Internal server error",
        });

        pollMediaJobStatus({
            jobId: 6,
            recordsCount: 1,
            toast: mockToast,
            t: mockT,
        });

        // 1st attempt
        await vi.advanceTimersByTimeAsync(1500);
        // 2nd attempt
        await vi.advanceTimersByTimeAsync(2000);
        // 3rd attempt
        await vi.advanceTimersByTimeAsync(2000);

        expect(mockToast.warning).toHaveBeenCalledWith(
            "uploadDownloadDrawer.status.statusCheckFailed"
        );
    });
});
