import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UploadFooterCounts } from "@/components/modules/property-tax/PropertyMedia/UploadDownload/UploadCountCard";

describe("UploadFooterCounts", () => {
    const mockTranslate = (key: string) => key;

    it("renders matched and unmatched counts with translated labels", () => {
        render(
            <UploadFooterCounts
                totalMatched={45}
                totalUnmatched={5}
                t={mockTranslate}
            />
        );

        expect(screen.getByText("uploadDownloadDrawer.matched:")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument();
        expect(screen.getByText("uploadDownloadDrawer.unmatched:")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("falls back to default English labels when translation function is omitted", () => {
        render(<UploadFooterCounts totalMatched={10} totalUnmatched={2} />);

        expect(screen.getByText("Matched:")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText("Unmatched:")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
    });
});
