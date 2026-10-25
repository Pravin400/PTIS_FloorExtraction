import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UpicLinkCell } from "@/components/modules/property-tax/search-property/results/UpicLinkCell";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch: _prefetch,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("UpicLinkCell", () => {
  it("navigates with propertyId, wardNo, wardId, propertyNo, and partitionNo params", () => {
    render(
      <UpicLinkCell
        upicId=""
        propertyId={4242}
        wardNo="MM11"
        wardId={23}
        propertyNo="24"
        partitionNo="-"
        locale="en"
        copyLabel="UPIC ID"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/en/property-tax/ptis?propertyId=4242&wardNo=MM11&wardId=23&propertyNo=24&partitionNo=-&searchState=clear"
    );
    expect(link).toHaveAttribute("title", "Open in PTIS");
  });

  it("shows a display placeholder and builds the correct link URL", () => {
    render(
      <UpicLinkCell
        upicId=""
        propertyId={4242}
        locale="en"
        copyLabel="UPIC ID"
      />
    );

    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/en/property-tax/ptis?propertyId=4242&searchState=clear"
    );
  });

  it("renders plain text when propertyId is missing", () => {
    render(
      <UpicLinkCell
        upicId="UPIC-101"
        propertyId={0}
        locale="en"
        copyLabel="UPIC ID"
      />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("UPIC-101")).toBeInTheDocument();
  });

  it("includes societyDetailId and wingDetailId in the link href when provided", () => {
    render(
      <UpicLinkCell
        upicId="UPIC-999"
        propertyId={500}
        societyDetailId={12}
        wingDetailId={34}
        locale="en"
        copyLabel="UPIC ID"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/en/property-tax/ptis?propertyId=500&societyDetailId=12&wingDetailId=34&searchState=clear"
    );
  });
});
