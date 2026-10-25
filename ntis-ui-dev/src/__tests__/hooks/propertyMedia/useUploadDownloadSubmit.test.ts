import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUploadDownloadSubmit } from "@/hooks/PropertyMedia/uploadDownload/useUploadDownloadSubmit";
import { UploadDownloadFormModel } from "@/types/PropertyMedia/PropertyMedia.types";
import * as serverActions from "@/app/[locale]/property-tax/property-media/action";
import * as clientApi from "@/lib/api/property-media/propertyMedia.client";

const mockConfirm = vi.fn();
const mockToastInfo = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const { mockPollMediaJobStatus, mockCancelPolling } = vi.hoisted(() => ({
    mockPollMediaJobStatus: vi.fn(),
    mockCancelPolling: vi.fn(),
}));

vi.mock("@/components/common", () => ({
    useConfirm: () => ({ confirm: mockConfirm }),
    useToast: () => ({
        info: mockToastInfo,
        success: mockToastSuccess,
        error: mockToastError,
    }),
}));

vi.mock("@/lib/utils/PropertyMedia/jobStatusPolling", () => ({
    pollMediaJobStatus: mockPollMediaJobStatus,
}));

vi.mock("@/app/[locale]/property-tax/property-media/action", () => ({
    executeLocalImportAction: vi.fn(),
    executeLocalBulkUploadAction: vi.fn(),
}));

vi.mock("@/lib/api/property-media/propertyMedia.client", () => ({
    downloadPropertyMediaImages: vi.fn(),
}));

describe("useUploadDownloadSubmit", () => {
    const mockSetErrors = vi.fn();
    const mockSetSubmittedOnce = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockCloseAndRoute = vi.fn();
    const mockTranslate = (key: string) => key;
    const mockMapApiError = ({ message }: { message?: string }) => message || "Error";

    const defaultFormData: UploadDownloadFormModel = {
        activeTab: "upload",
        upload: {
            category: "1",
            subCategory: "101",
        },
        download: {
            category: "1",
            subCategory: "101",
            zone: "Zone1",
            ward: ["WardA"],
            propertyFrom: "P1",
            propertyTo: "P2",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockPollMediaJobStatus.mockReturnValue(mockCancelPolling);
    });

    describe("Validation check", () => {
        it("aborts submission if validate returns errors", async () => {
            const mockValidate = vi.fn().mockReturnValue({ "upload.category": "Required" });

            const { result } = renderHook(() =>
                useUploadDownloadSubmit({
                    formData: defaultFormData,
                    activeTab: "upload",
                    uploadSourceTab: "server",
                    validate: mockValidate,
                    setErrors: mockSetErrors,
                    setSubmittedOnce: mockSetSubmittedOnce,
                    closeAndRoute: mockCloseAndRoute,
                    t: mockTranslate,
                    mapApiError: mockMapApiError,
                })
            );

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(mockSetSubmittedOnce).toHaveBeenCalledWith(true);
            expect(mockSetErrors).toHaveBeenCalledWith({ "upload.category": "Required" });
            expect(mockConfirm).not.toHaveBeenCalled();
            expect(result.current.isSubmitting).toBe(false);
        });
    });

    describe("Upload Tab - Device mode without previewId", () => {
        it("shows toast error if device upload has no previewId", async () => {
            const mockValidate = vi.fn().mockReturnValue({});

            const rendered = renderHook(() =>
                useUploadDownloadSubmit({
                    formData: defaultFormData,
                    activeTab: "upload",
                    uploadSourceTab: "device",
                    previewId: null,
                    validate: mockValidate,
                    setErrors: mockSetErrors,
                    setSubmittedOnce: mockSetSubmittedOnce,
                    closeAndRoute: mockCloseAndRoute,
                    t: mockTranslate,
                    mapApiError: mockMapApiError,
                })
            );

            await act(async () => {
                await rendered.result.current.handleSubmit();
            });

            expect(mockToastError).toHaveBeenCalledWith("uploadDownloadDrawer.noFilesSelectedError");
            expect(mockConfirm).not.toHaveBeenCalled();
        });
    });

    describe("Upload Tab - Server upload", () => {
        it("shows confirmation and executes executeLocalImportAction on confirm", async () => {
            const mockValidate = vi.fn().mockReturnValue({});
            const spyImport = vi.spyOn(serverActions, "executeLocalImportAction").mockResolvedValue({
                success: true,
                data: { jobId: 456, recordsSelected: 2, jobCode: "JOB-456", status: "Running" },
            });

            mockConfirm.mockImplementation(async ({ onConfirm }) => {
                await onConfirm();
            });

            const rendered = renderHook(() =>
                useUploadDownloadSubmit({
                    formData: defaultFormData,
                    activeTab: "upload",
                    uploadSourceTab: "server",
                    validate: mockValidate,
                    setErrors: mockSetErrors,
                    setSubmittedOnce: mockSetSubmittedOnce,
                    onSuccess: mockOnSuccess,
                    closeAndRoute: mockCloseAndRoute,
                    t: mockTranslate,
                    mapApiError: mockMapApiError,
                })
            );

            await act(async () => {
                await rendered.result.current.handleSubmit();
            });

            expect(mockConfirm).toHaveBeenCalled();
            expect(spyImport).toHaveBeenCalledWith({ photoTypeId: 101 });
            expect(mockToastInfo).toHaveBeenCalledWith("uploadDownloadDrawer.success.uploadInProgress");
            expect(mockPollMediaJobStatus).toHaveBeenCalledWith(expect.objectContaining({
                jobId: 456,
                recordsCount: 2,
                jobCode: "JOB-456",
                toast: expect.any(Object),
                t: mockTranslate,
                onSettled: expect.any(Function),
            }));
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockCloseAndRoute).not.toHaveBeenCalled();
            expect(rendered.result.current.isSubmitting).toBe(false);
            rendered.unmount();
            expect(mockCancelPolling).toHaveBeenCalledTimes(1);
        });
    });

    describe("Upload Tab - Device upload", () => {
        it("executes executeLocalBulkUploadAction with previewId on confirm", async () => {
            const mockValidate = vi.fn().mockReturnValue({});
            const spyBulkUpload = vi.spyOn(serverActions, "executeLocalBulkUploadAction").mockResolvedValue({
                success: true,
                data: { jobId: 789, recordsSelected: 4, jobCode: "JOB-789", status: "Running" },
            });

            mockConfirm.mockImplementation(async ({ onConfirm }) => {
                await onConfirm();
            });

            const { result } = renderHook(() =>
                useUploadDownloadSubmit({
                    formData: defaultFormData,
                    activeTab: "upload",
                    uploadSourceTab: "device",
                    previewId: "prev-456",
                    validate: mockValidate,
                    setErrors: mockSetErrors,
                    setSubmittedOnce: mockSetSubmittedOnce,
                    onSuccess: mockOnSuccess,
                    closeAndRoute: mockCloseAndRoute,
                    t: mockTranslate,
                    mapApiError: mockMapApiError,
                })
            );

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(spyBulkUpload).toHaveBeenCalledWith({ previewId: "prev-456" });
            expect(mockToastInfo).toHaveBeenCalledWith("uploadDownloadDrawer.success.uploadInProgress");
            expect(mockPollMediaJobStatus).toHaveBeenCalledWith(expect.objectContaining({
                jobId: 789,
                recordsCount: 4,
                jobCode: "JOB-789",
                onSettled: expect.any(Function),
            }));
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockCloseAndRoute).not.toHaveBeenCalled();
        });
    });

    describe("Download Tab", () => {
        it("calls downloadPropertyMediaImages directly without confirmation", async () => {
            const mockValidate = vi.fn().mockReturnValue({});
            const spyDownload = vi.spyOn(clientApi, "downloadPropertyMediaImages").mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useUploadDownloadSubmit({
                    formData: defaultFormData,
                    activeTab: "download",
                    uploadSourceTab: "server",
                    validate: mockValidate,
                    setErrors: mockSetErrors,
                    setSubmittedOnce: mockSetSubmittedOnce,
                    onSuccess: mockOnSuccess,
                    closeAndRoute: mockCloseAndRoute,
                    t: mockTranslate,
                    mapApiError: mockMapApiError,
                })
            );

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(mockConfirm).not.toHaveBeenCalled();
            expect(mockToastInfo).toHaveBeenCalled();
            expect(spyDownload).toHaveBeenCalledWith({
                category: "1",
                photoTypeId: "101",
                divisionId: "Zone1",
                wardIds: ["WardA"],
                fromPropertyNo: "P1",
                toPropertyNo: "P2",
            });
            expect(mockToastSuccess).toHaveBeenCalled();
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockCloseAndRoute).toHaveBeenCalled();
            expect(result.current.isSubmitting).toBe(false);
        });

        it("keeps the form open and reports download failure", async () => {
            const mockValidate = vi.fn().mockReturnValue({});
            vi.spyOn(clientApi, "downloadPropertyMediaImages").mockRejectedValue(
                Object.assign(new Error("Download failed"), { statusCode: 500 })
            );

            const { result } = renderHook(() =>
                useUploadDownloadSubmit({
                    formData: defaultFormData,
                    activeTab: "download",
                    uploadSourceTab: "server",
                    validate: mockValidate,
                    setErrors: mockSetErrors,
                    setSubmittedOnce: mockSetSubmittedOnce,
                    closeAndRoute: mockCloseAndRoute,
                    t: mockTranslate,
                    mapApiError: mockMapApiError,
                })
            );

            await act(async () => {
                await result.current.handleSubmit();
            });

            expect(mockToastError).toHaveBeenCalledWith("Download failed");
            expect(mockCloseAndRoute).not.toHaveBeenCalled();
            expect(result.current.isSubmitting).toBe(false);
        });

        it("sets submitting state while the download request is pending", async () => {
            let resolveDownload: (() => void) | undefined;
            vi.spyOn(clientApi, "downloadPropertyMediaImages").mockImplementation(
                () => new Promise((resolve) => {
                    resolveDownload = resolve;
                })
            );
            const { result } = renderHook(() =>
                useUploadDownloadSubmit({
                    formData: defaultFormData,
                    activeTab: "download",
                    uploadSourceTab: "server",
                    validate: vi.fn().mockReturnValue({}),
                    setErrors: mockSetErrors,
                    setSubmittedOnce: mockSetSubmittedOnce,
                    closeAndRoute: mockCloseAndRoute,
                    t: mockTranslate,
                    mapApiError: mockMapApiError,
                })
            );

            let submitPromise: Promise<void> | undefined;
            await act(async () => {
                submitPromise = result.current.handleSubmit();
                await Promise.resolve();
            });
            expect(result.current.isSubmitting).toBe(true);

            await act(async () => {
                resolveDownload?.();
                await submitPromise;
            });
            expect(result.current.isSubmitting).toBe(false);
            expect(mockCloseAndRoute).toHaveBeenCalledTimes(1);
        });
    });
});
