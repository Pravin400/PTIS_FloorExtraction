import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DownloadTab } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/DownloadTab";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

describe("DownloadTab", () => {
  const mockChange = vi.fn();
  const mockZoneChange = vi.fn();
  const mockWardsChange = vi.fn();
  const mockBlur = vi.fn();
  const mockTranslate = (key: string) => key;

  const mockCategories = [{ value: "1", label: "Building Photo" }];
  const mockSubCategories = [{ value: "101", label: "Front Elevation" }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders choose what to download section and property filter", () => {
    render(
      <DownloadTab
        formData={{ category: "1", subCategory: "101" }}
        categoryOptions={mockCategories}
        subCategoryOptions={mockSubCategories}
        zoneOptions={[]}
        wardOptions={[]}
        onChange={mockChange}
        onZoneChange={mockZoneChange}
        onWardsChange={mockWardsChange}
        onBlur={mockBlur}
        errors={{}}
        showError={() => false}
        t={mockTranslate}
      />
    );

    expect(screen.getByText("uploadDownloadDrawer.chooseWhatToDownload")).toBeInTheDocument();
    expect(screen.getByText("uploadDownloadDrawer.categoryLabel")).toBeInTheDocument();
    expect(screen.getByText("uploadDownloadDrawer.photoSubtypeLabel")).toBeInTheDocument();
    expect(screen.getByText("uploadDownloadDrawer.propertyFilter.title")).toBeInTheDocument();
  });
});
