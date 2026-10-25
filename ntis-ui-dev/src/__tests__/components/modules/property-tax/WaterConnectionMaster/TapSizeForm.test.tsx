import { vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { IntlProvider } from "next-intl";
import { TapSizeForm } from "@/components/modules/property-tax/WaterConnectionMaster/TapSizeForm";

vi.mock("@/app/[locale]/property-tax/water-connection-master/actions", () => ({
  createTapSizeAction: vi.fn(),
  updateTapSizeAction: vi.fn(),
}));

describe("TapSizeForm", () => {
  it("renders without crashing", () => {
    render(
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <TapSizeForm id={null} />
      </IntlProvider>
    );
    expect(document.getElementById("tap-size-form")).toBeInTheDocument();
  });

  it("allows a positive decimal tap size", () => {
    const { container } = render(
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <TapSizeForm id={null} />
      </IntlProvider>
    );
    const sizeInput = container.querySelector<HTMLInputElement>("#tap-size-name");

    expect(sizeInput).toHaveAttribute("maxlength", "5");
    expect(sizeInput).toHaveAttribute("inputmode", "decimal");

    fireEvent.change(sizeInput!, { target: { value: "1.3" } });
    expect(sizeInput).toHaveValue("1.3");
  });

  it("keeps at most two integer and two decimal digits", () => {
    const { container } = render(
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <TapSizeForm id={null} />
      </IntlProvider>
    );
    const sizeInput = container.querySelector<HTMLInputElement>("#tap-size-name");

    fireEvent.change(sizeInput!, { target: { value: "123.456" } });
    expect(sizeInput).toHaveValue("12.45");
  });
});
