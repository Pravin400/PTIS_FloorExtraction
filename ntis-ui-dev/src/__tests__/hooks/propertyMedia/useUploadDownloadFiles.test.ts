import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useUploadDownloadFiles } from "@/hooks/PropertyMedia/uploadDownload/useUploadDownloadFiles";

describe("useUploadDownloadFiles", () => {
    const mockTranslate = vi.fn((key: string, values?: Record<string, string | number>) => {
        if (key === "uploadDownloadDrawer.filesSelected" && values) {
            return `${values.count} files selected`;
        }
        return key;
    });

    it("initializes with empty files and empty display value", () => {
        const { result } = renderHook(() =>
            useUploadDownloadFiles({ t: mockTranslate })
        );

        expect(result.current.selectedFiles).toEqual([]);
        expect(result.current.fileDisplayValue).toBe("");
    });

    it("updates selectedFiles and shows single file name in fileDisplayValue", () => {
        const { result } = renderHook(() =>
            useUploadDownloadFiles({ t: mockTranslate })
        );

        const file = new File(["dummy content"], "photo1.jpg", { type: "image/jpeg" });
        const event = {
            target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleFileInputChange(event);
        });

        expect(result.current.selectedFiles).toHaveLength(1);
        expect(result.current.fileDisplayValue).toBe("photo1.jpg");
        expect(result.current.prepareFilesPayload()).toEqual([file]);
    });

    it("updates selectedFiles and shows count translation in fileDisplayValue for multiple files", () => {
        const { result } = renderHook(() =>
            useUploadDownloadFiles({ t: mockTranslate })
        );

        const file1 = new File(["1"], "photo1.jpg", { type: "image/jpeg" });
        const file2 = new File(["2"], "photo2.jpg", { type: "image/jpeg" });
        const event = {
            target: { files: [file1, file2] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleFileInputChange(event);
        });

        expect(result.current.selectedFiles).toHaveLength(2);
        expect(result.current.fileDisplayValue).toBe("2 files selected");
    });

    it("clears files on handleClearFiles", () => {
        const { result } = renderHook(() =>
            useUploadDownloadFiles({ t: mockTranslate })
        );

        const file = new File(["dummy"], "plan.pdf", { type: "application/pdf" });
        act(() => {
            result.current.handleFileInputChange({
                target: { files: [file] },
            } as unknown as React.ChangeEvent<HTMLInputElement>);
        });
        expect(result.current.selectedFiles).toHaveLength(1);

        act(() => {
            result.current.handleClearFiles();
        });

        expect(result.current.selectedFiles).toEqual([]);
        expect(result.current.fileDisplayValue).toBe("");
    });

    it("clicks fileInputRef when handleBrowseClick is called", () => {
        const { result } = renderHook(() =>
            useUploadDownloadFiles({ t: mockTranslate })
        );

        const mockClick = vi.fn();
        (result.current.fileInputRef as unknown as { current: HTMLInputElement }).current = {
            click: mockClick,
        } as unknown as HTMLInputElement;

        act(() => {
            result.current.handleBrowseClick();
        });

        expect(mockClick).toHaveBeenCalledTimes(1);
    });
});
