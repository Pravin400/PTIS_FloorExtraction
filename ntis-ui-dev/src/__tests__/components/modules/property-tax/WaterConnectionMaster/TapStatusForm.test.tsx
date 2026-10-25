import { render } from "@testing-library/react";
import { IntlProvider } from "next-intl";
import { TapStatusForm } from "@/components/modules/property-tax/WaterConnectionMaster/TapStatusForm";

describe("TapStatusForm", () => {
  it("renders without crashing", () => {
    render(
      <IntlProvider locale="en" messages={{}} onError={() => { }}>
        <TapStatusForm id={null} />
      </IntlProvider>
    );
    expect(document.getElementById("tap-status-form")).toBeInTheDocument();
  });
});
