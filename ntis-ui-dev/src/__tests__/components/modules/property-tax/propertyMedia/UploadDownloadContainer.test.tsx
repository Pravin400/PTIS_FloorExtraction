import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadDownloadContainer } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/UploadDownloadContainer";
import { useUploadDownload } from "@/hooks/PropertyMedia/uploadDownload";

const mockSetActiveTab = vi.fn();
const mockSetUploadSourceTab = vi.fn();
const mockHandleSubmit = vi.fn();
const mockHandleCancel = vi.fn();

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
}));

vi.mock("@/hooks/PropertyMedia/uploadDownload", () => ({
    useUploadDownload: vi.fn(),
}));

describe("UploadDownloadContainer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useUploadDownload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            open: true,
            activeTab: "upload",
            setActiveTab: mockSetActiveTab,
            uploadSourceTab: "server",
            setUploadSourceTab: mockSetUploadSourceTab,
            isUploadingLocal: false,
            handleLocalUpload: vi.fn(),
            formData: {
                activeTab: "upload",
                upload: { category: "1", subCategory: "101" },
                download: { category: "", subCategory: "" },
            },
            errors: {},
            showError: () => false,
            handleFilterZoneChange: vi.fn(),
            handleFilterWardsChange: vi.fn(),
            propertyFromOptions: [],
            propertyToOptions: [],
            isLoadingPropertyFrom: false,
            isLoadingPropertyTo: false,
            handleFilterPropertyFromChange: vi.fn(),
            handleFilterPropertyToChange: vi.fn(),
            handleUploadFieldChange: vi.fn(),
            handleDownloadFieldChange: vi.fn(),
            handleBlur: vi.fn(),
            handleSubmit: mockHandleSubmit,
            handleCancel: mockHandleCancel,
            isSubmitting: false,
            isPending: false,
            fileInputRef: { current: null },
            fileDisplayValue: "",
            handleBrowseClick: vi.fn(),
            handleFileInputChange: vi.fn(),
            handleClearFiles: vi.fn(),
            previewId: "",
            handlePageChange: vi.fn(),
            handlePageSizeChange: vi.fn(),
            t: (key: string) => key,
            tCommon: (key: string) => key,
        });
    });

    it("renders drawer title, tabs, and action buttons", () => {
        render(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
            />
        );

        expect(screen.getByText("uploadDownloadDrawer.title")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.uploadTab")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.downloadTab")).toBeInTheDocument();
        expect(screen.getByText("buttons.cancel")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.uploadButton")).toBeInTheDocument();
    });

    it("calls handleCancel when Cancel button is clicked", () => {
        render(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
            />
        );

        const cancelBtn = screen.getByText("buttons.cancel");
        fireEvent.click(cancelBtn);

        expect(mockHandleCancel).toHaveBeenCalledTimes(1);
    });

    it("renders download button label when activeTab is download", () => {
        (useUploadDownload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            open: true,
            activeTab: "download",
            setActiveTab: mockSetActiveTab,
            uploadSourceTab: "server",
            setUploadSourceTab: mockSetUploadSourceTab,
            isUploadingLocal: false,
            handleLocalUpload: vi.fn(),
            formData: {
                activeTab: "download",
                upload: { category: "", subCategory: "" },
                download: { category: "1", subCategory: "101" },
            },
            errors: {},
            showError: () => false,
            handleFilterZoneChange: vi.fn(),
            handleFilterWardsChange: vi.fn(),
            propertyFromOptions: [],
            propertyToOptions: [],
            isLoadingPropertyFrom: false,
            isLoadingPropertyTo: false,
            handleFilterPropertyFromChange: vi.fn(),
            handleFilterPropertyToChange: vi.fn(),
            handleUploadFieldChange: vi.fn(),
            handleDownloadFieldChange: vi.fn(),
            handleBlur: vi.fn(),
            handleSubmit: mockHandleSubmit,
            handleCancel: mockHandleCancel,
            isSubmitting: false,
            isPending: false,
            fileInputRef: { current: null },
            fileDisplayValue: "",
            handleBrowseClick: vi.fn(),
            handleFileInputChange: vi.fn(),
            handleClearFiles: vi.fn(),
            previewId: "",
            handlePageChange: vi.fn(),
            handlePageSizeChange: vi.fn(),
            t: (key: string) => key,
            tCommon: (key: string) => key,
        });

        render(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
            />
        );

        expect(screen.getByText("uploadDownloadDrawer.downloadButton")).toBeInTheDocument();
    });

    it("disables upload button when totalCount is null, 0, or negative", () => {
        // totalCount is 0
        const { rerender } = render(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
                previewData={{
                    items: [],
                    page: 1,
                    pageSize: 10,
                    totalCount: 0,
                    totalPages: 0,
                    totalMatched: 0,
                    totalUnmatched: 0,
                    hasPrevious: false,
                    hasNext: false,
                }}
            />
        );
        const uploadBtn = screen.getByText("uploadDownloadDrawer.uploadButton").closest("button");
        expect(uploadBtn).toBeDisabled();

        // totalCount is null (cast as unknown as number)
        rerender(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
                previewData={{
                    items: [],
                    page: 1,
                    pageSize: 10,
                    totalCount: null as unknown as number,
                    totalPages: 0,
                    totalMatched: 0,
                    totalUnmatched: 0,
                    hasPrevious: false,
                    hasNext: false,
                }}
            />
        );
        expect(uploadBtn).toBeDisabled();

        // totalMatched is negative
        rerender(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
                previewData={{
                    items: [],
                    page: 1,
                    pageSize: 10,
                    totalCount: 0,
                    totalPages: 0,
                    totalMatched: -1,
                    totalUnmatched: 0,
                    hasPrevious: false,
                    hasNext: false,
                }}
            />
        );
        expect(uploadBtn).toBeDisabled();

        // 7 files uploaded, but 0 matched (e.g. from local device upload)
        rerender(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
                previewData={{
                    items: [{ fileName: "test.jpg", isMatched: false }],
                    page: 1,
                    pageSize: 10,
                    totalCount: 7,
                    totalPages: 1,
                    totalMatched: 0,
                    totalUnmatched: 7,
                    hasPrevious: false,
                    hasNext: false,
                }}
            />
        );
        expect(uploadBtn).toBeDisabled();
    });

    it("enables upload button when totalCount is positive", () => {
        render(
            <UploadDownloadContainer
                categoryOptions={[{ id: 1, name: "Building Photo" }]}
                previewData={{
                    items: [{ fileName: "test.jpg", isMatched: true }],
                    page: 1,
                    pageSize: 10,
                    totalCount: 5,
                    totalPages: 1,
                    totalMatched: 5,
                    totalUnmatched: 0,
                    hasPrevious: false,
                    hasNext: false,
                }}
            />
        );
        const uploadBtn = screen.getByText("uploadDownloadDrawer.uploadButton").closest("button");
        expect(uploadBtn).not.toBeDisabled();
    });
});
