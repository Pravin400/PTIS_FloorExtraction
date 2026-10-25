import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import TypeOfUseModal from "@/components/modules/property-tax/property-type-master/TypeOfUseModal";
import type { TypeOfUseItem } from "@/types/typeOfUse.types";

describe("TypeOfUseModal", () => {
  const mockItems: TypeOfUseItem[] = [
    { id: "R1", description: "Residential Type 1" },
    { id: "C1", description: "Commercial Type 1" },
  ];

  const defaultProps = {
    open: true,
    items: mockItems,
    onClose: vi.fn(),
    propertyDescription: null as string | null,
  };

  const mockMessages = {
    propertyType: {
      propertyType: {
        aliasFallback: {
          category: "Category",
          typeOfUse: "Type of Use",
          ward: "Ward",
          entity: "Property Type",
        },
        modal: {
          title: "Type of Use",
          subtitle: "Assigned types",
          propertySubtitle: "Types for {description}",
          close: "Close",
        },
      },
    },
    common: {
      buttons: {
        close: "Close",
      },
      messages: {
        total: "total",
      },
    },
  };

  const renderComponent = (props = defaultProps) => {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <TypeOfUseModal {...props} />
      </NextIntlClientProvider>
    );
  };

  it("renders null when open is false", () => {
    renderComponent({ ...defaultProps, open: false });
    expect(screen.queryByText("Type of Use")).not.toBeInTheDocument();
  });

  it("renders modal with title and subtitle", () => {
    renderComponent();
    expect(screen.getByText("Type of Use")).toBeInTheDocument();
    expect(screen.getByText("Assigned types")).toBeInTheDocument();
  });

  it("renders property specific subtitle when description is provided", () => {
    renderComponent({ ...defaultProps, propertyDescription: "Test Property" });
    expect(screen.getByText("Types for Test Property")).toBeInTheDocument();
  });

  it("renders all items", () => {
    renderComponent();
    expect(screen.getByText("R1")).toBeInTheDocument();
    expect(screen.getByText("Residential Type 1")).toBeInTheDocument();
    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(screen.getByText("Commercial Type 1")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    renderComponent();
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
