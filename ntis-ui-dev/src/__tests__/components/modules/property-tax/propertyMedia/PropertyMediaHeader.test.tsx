import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyMediaHeader } from "@/components/modules/property-tax/PropertyMedia/PropertyMediaHeader";
import { useParams, useRouter } from "next/navigation";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("PropertyMediaHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      locale: "en",
    });
  });

  it("renders the header title and action buttons", () => {
    render(<PropertyMediaHeader />);

    expect(screen.getByText("propertyMediaHeader.propertyMediaHeaderTitle")).toBeInTheDocument();
    expect(screen.getByText("propertyMediaHeader.uploadDownload")).toBeInTheDocument();
    expect(screen.getByText("propertyMediaHeader.auditTrail")).toBeInTheDocument();
  });

  it("navigates to upload-download route when Upload / Download button is clicked", () => {
    render(<PropertyMediaHeader />);

    const uploadDownloadBtn = screen.getByText("propertyMediaHeader.uploadDownload");
    fireEvent.click(uploadDownloadBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/property-media/upload-download");
  });

  it("navigates to audit trail route when Audit Trail button is clicked", () => {
    render(<PropertyMediaHeader />);

    const auditBtn = screen.getByText("propertyMediaHeader.auditTrail");
    fireEvent.click(auditBtn);

    expect(mockPush).toHaveBeenCalledWith("/en/property-tax/property-media/audit");
  });

  it("handles different locales correctly in navigation URLs", () => {
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      locale: "mr",
    });

    render(<PropertyMediaHeader />);

    const uploadDownloadBtn = screen.getByText("propertyMediaHeader.uploadDownload");
    fireEvent.click(uploadDownloadBtn);

    expect(mockPush).toHaveBeenCalledWith("/mr/property-tax/property-media/upload-download");
  });
});
