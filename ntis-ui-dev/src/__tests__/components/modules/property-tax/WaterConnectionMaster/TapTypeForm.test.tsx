import { render } from "@testing-library/react";
import { IntlProvider } from "next-intl";
import { TapTypeForm } from "@/components/modules/property-tax/WaterConnectionMaster/TapTypeForm";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";

describe("TapTypeForm", () => {
  it("renders without crashing", () => {
    render(
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <ConfirmProvider>
          <TapTypeForm id={null} />
        </ConfirmProvider>
      </IntlProvider>
    );
    expect(document.getElementById("tap-type-form")).toBeInTheDocument();
  });
});
