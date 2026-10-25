import { render, screen } from "@testing-library/react";
import { IntlProvider } from "next-intl";
import { TapTypeMaster } from "@/components/modules/property-tax/WaterConnectionMaster/TapTypeMaster";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";

describe("TapTypeMaster", () => {
  it("renders without crashing", () => {
    const data = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 1, hasPrevious: false, hasNext: false };
    render(
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <ConfirmProvider>
          <TapTypeMaster data={data} />
        </ConfirmProvider>
      </IntlProvider>
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
