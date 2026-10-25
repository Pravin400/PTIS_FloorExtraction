import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TaxSummaryCards } from "@/components/modules/property-tax/ptis/reassement-screen/components/TaxSummaryCards";
import { NextIntlClientProvider } from "next-intl";

const mockMessages = {
  reassessment: {
    summaryCards: {
      oldLabel: "Old",
      newLabel: "New",
      changedStatus: "Changed",
    },
  },
};

describe("TaxSummaryCards", () => {
  const mockCards = [
    {
      label: "Test Label 1",
      oldValue: "100",
      newValue: "150",
      difference: "+50",
      unit: "Unit",
      color: "sky" as const,
    },
    {
      label: "Test Label 2",
      oldValue: "A",
      newValue: "B",
      difference: "CHANGED",
      unit: "Type",
      color: "purple" as const,
    },
    {
      label: "Test Label 3",
      oldValue: "500",
      newValue: "400",
      difference: "-100",
      unit: "₹",
      color: "emerald" as const,
    },
  ];

  function setup(cards = mockCards) {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TaxSummaryCards cards={cards} />
      </NextIntlClientProvider>
    );
  }

  it("renders all cards", () => {
    setup();
    mockCards.forEach((card) => {
      expect(screen.getByText(card.label)).toBeInTheDocument();
    });
  });

  it("renders old and new values correctly", () => {
    setup();
    expect(screen.getByText(/100\s+Unit/)).toBeInTheDocument();
    expect(screen.getByText(/150\s+Unit/)).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
  });

  it("renders units when provided for area cards", () => {
    setup();
    expect(screen.getAllByText(/Unit/).length).toBeGreaterThan(0);
  });
});
