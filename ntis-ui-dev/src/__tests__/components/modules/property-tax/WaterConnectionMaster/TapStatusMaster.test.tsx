import { render, screen } from "@testing-library/react";
import { IntlProvider } from "next-intl";
import { TapStatusMaster } from "@/components/modules/property-tax/WaterConnectionMaster/TapStatusMaster";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";

describe("TapStatusMaster", () => {
  it("renders without crashing", () => {
    const data = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 1, hasPrevious: false, hasNext: false };
    render(
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <ConfirmProvider>
          <TapStatusMaster data={data} />
        </ConfirmProvider>
      </IntlProvider>
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
