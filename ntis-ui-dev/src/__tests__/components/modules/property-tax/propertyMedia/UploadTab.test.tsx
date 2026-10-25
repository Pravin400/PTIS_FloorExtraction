import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadTab } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/UploadTab";

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
}));

describe("UploadTab", () => {
    const mockChange = vi.fn();
    const mockBlur = vi.fn();
    const mockUploadSourceTabChange = vi.fn();
    const mockLocalUpload = vi.fn();
    const mockBrowseClick = vi.fn();
    const mockTranslate = (key: string) => key;

    const mockCategories = [{ value: "1", label: "Building Photo" }];
    const mockSubCategories = [{ value: "101", label: "Front Elevation" }];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders category dropdowns and upload source tabs (From Server and From Device)", () => {
        render(
            <UploadTab
                categoryOptions={mockCategories}
                subCategoryOptions={mockSubCategories}
                formData={{ category: "1", subCategory: "101" }}
                uploadSourceTab="server"
                onUploadSourceTabChange={mockUploadSourceTabChange}
                onChange={mockChange}
                onBlur={mockBlur}
                errors={{}}
                showError={() => false}
                t={mockTranslate}
            />
        );

        expect(screen.getByText("uploadDownloadDrawer.chooseWhatToUpload")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.categoryLabel")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.photoSubtypeLabel")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.fromServerTab")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.fromDeviceTab")).toBeInTheDocument();
    });

    it("renders file picker controls and triggers browse and load when uploadSourceTab is device", () => {
        render(
            <UploadTab
                categoryOptions={mockCategories}
                subCategoryOptions={mockSubCategories}
                formData={{ category: "1", subCategory: "101" }}
                uploadSourceTab="device"
                fileDisplayValue="file1.jpg"
                handleBrowseClick={mockBrowseClick}
                handleLocalUpload={mockLocalUpload}
                onUploadSourceTabChange={mockUploadSourceTabChange}
                onChange={mockChange}
                onBlur={mockBlur}
                errors={{}}
                showError={() => false}
                t={mockTranslate}
            />
        );

        const browseBtn = screen.getByText("uploadDownloadDrawer.browse");
        fireEvent.click(browseBtn);
        expect(mockBrowseClick).toHaveBeenCalledTimes(1);

        const loadBtn = screen.getByText("uploadDownloadDrawer.localUploadButton");
        fireEvent.click(loadBtn);
        expect(mockLocalUpload).toHaveBeenCalledTimes(1);
    });

    it("renders file input without accept attribute so all file types can be selected", () => {
        const { container } = render(
            <UploadTab
                categoryOptions={mockCategories}
                subCategoryOptions={mockSubCategories}
                formData={{ category: "1", subCategory: "101" }}
                uploadSourceTab="device"
                fileDisplayValue=""
                onChange={mockChange}
                onBlur={mockBlur}
                errors={{}}
                showError={() => false}
                t={mockTranslate}
            />
        );

        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput).not.toHaveAttribute("accept");
    });
});
