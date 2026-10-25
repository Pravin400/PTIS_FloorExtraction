import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UploadTable } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/UploadTable";
import { UploadFileItem } from "@/types/PropertyMedia/PropertyMedia.types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

describe("UploadTable", () => {
  const mockTranslate = (key: string) => key;
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();

  const mockData: UploadFileItem[] = [
    {
      fileName: "building_front.jpg",
      propertyDisplay: "Prop 101, Zone 1",
      isMatched: true,
    },
    {
      fileName: "site_map.pdf",
      propertyDisplay: "Prop 102, Zone 1",
      isMatched: false,
    },
  ];

  it("renders server mode title and subtitle when sourceTab is server", () => {
    render(
      <UploadTable
        data={mockData}
        sourceTab="server"
        t={mockTranslate}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    expect(screen.getByText("uploadDownloadDrawer.selectFilesServerTitle")).toBeInTheDocument();
    expect(screen.getByText("uploadDownloadDrawer.selectFilesServerSubtitle")).toBeInTheDocument();
    expect(screen.getByText("building_front.jpg")).toBeInTheDocument();
    expect(screen.getByText("site_map.pdf")).toBeInTheDocument();
  });

  it("renders device mode title and subtitle when sourceTab is device", () => {
    render(
      <UploadTable
        data={mockData}
        sourceTab="device"
        t={mockTranslate}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    );

    expect(screen.getByText("uploadDownloadDrawer.selectFilesDeviceTitle")).toBeInTheDocument();
    expect(screen.getByText("uploadDownloadDrawer.selectFilesDeviceSubtitle")).toBeInTheDocument();
  });
});
