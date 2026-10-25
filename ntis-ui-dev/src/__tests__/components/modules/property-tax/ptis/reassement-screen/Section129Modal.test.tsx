import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Section129Modal } from "@/components/modules/property-tax/ptis/reassement-screen/Section129Modal";
import { NextIntlClientProvider } from "next-intl";

const mockMessages = {
  reassessment: {
    section129Modal: {
      title: "Section 129 Calculation",
      subtitle: "Progressive tax calculation",
      note: "Note: This is a progressive tax calculation",
      columns: {
        year: "Year",
        applicablePct: "Applicable %",
        generalTax: "General Tax",
        waterTax: "Water Tax",
        educationTax: "Education Tax",
        fireTax: "Fire Tax",
        totalTax: "Total Tax",
        remark: "Remark",
      },
      remarks: {
        noChange: "No Change",
        regular: "Regular",
        municipalTaxApplied: "% Municipal Tax Applied",
      },
      applicablePct: {
        asPerGramPanchayat: "As Per Gram Panchayat",
      },
    },
    buttons: {
      close: "Close",
    },
  },
};

describe("Section129Modal", () => {
  const mockData = [
    {
      year: "2020-21",
      applicablePct: "As Per Gram Panchayat",
      generalTax: 500,
      waterTax: "-",
      educationTax: "-",
      fireTax: "-",
      totalTax: 500,
      remark: "No Change",
    },
    {
      year: "2021-22",
      applicablePct: "20",
      generalTax: 500,
      waterTax: 100,
      educationTax: 100,
      fireTax: 100,
      totalTax: 800,
      remark: "20 Municipal Tax Applied",
    },
    {
      year: "2022-23",
      applicablePct: "100",
      generalTax: 500,
      waterTax: 500,
      educationTax: 500,
      fireTax: 500,
      totalTax: 2000,
      remark: "Regular",
      bg: "bg-emerald-50/30",
      isRegular: true,
    },
  ];

  function setup(open = true, onClose = vi.fn(), data = mockData) {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <Section129Modal open={open} onClose={onClose} data={data} />
      </NextIntlClientProvider>
    );
  }

  it("renders the modal when open is true", () => {
    setup();
    expect(screen.getByText("Section 129 Calculation")).toBeInTheDocument();
  });

  it("renders the note", () => {
    setup();
    expect(screen.getByText("Note: This is a progressive tax calculation")).toBeInTheDocument();
  });

  it("renders the data rows", () => {
    setup();
    expect(screen.getByText("2020-21")).toBeInTheDocument();
    expect(screen.getByText("2021-22")).toBeInTheDocument();
    expect(screen.getByText("2022-23")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    setup(true, onClose);
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
