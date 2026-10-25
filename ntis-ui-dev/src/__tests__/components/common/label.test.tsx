import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { Label, LabelProps } from "@/components/common/label";
import { NextIntlClientProvider } from "next-intl";

describe("Label", () => {
  const mockMessages = {
    form: {
      optional: "(optional)",
    },
    info: "Info text",
  };
  function setup(props: Partial<LabelProps> = {}, messages = mockMessages) {
    return render(
      <NextIntlClientProvider locale="en" messages={{ common: messages }}>
        <Label {...props}>Test Label</Label>
      </NextIntlClientProvider>
    );
  }

  it("renders label text", () => {
    setup();
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("shows required indicator when required", () => {
    setup({ required: true });
    expect(screen.getByLabelText("required")).toBeInTheDocument();
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("shows optional indicator when optional", () => {
    setup({ optional: true });
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("does not show optional if required is true", () => {
    setup({ required: true, optional: true });
    expect(screen.queryByText("(optional)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("required")).toBeInTheDocument();
  });

  it("shows info text if provided", () => {
    setup({ info: "info" });
    expect(screen.getByText("Info text")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    setup({ className: "custom-label" });
    const label = screen.getByText("Test Label").closest("label");
    expect(label).toHaveClass("custom-label");
  });

  it("forwards ref to label element", () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(
      <NextIntlClientProvider locale="en" messages={{ common: mockMessages }}>
        <Label ref={ref}>Test Label</Label>
      </NextIntlClientProvider>
    );
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
