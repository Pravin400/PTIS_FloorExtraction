import { render, screen } from "@testing-library/react";
import { IntlProvider } from "next-intl";
import { TapSizeMaster } from "@/components/modules/property-tax/WaterConnectionMaster/TapSizeMaster";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";

describe("TapSizeMaster", () => {
  it("renders without crashing", () => {
    const data = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 1, hasPrevious: false, hasNext: false };
    render(
      <IntlProvider locale="en" messages={{}} onError={() => {}}>
        <ConfirmProvider>
          <TapSizeMaster data={data} />
        </ConfirmProvider>
      </IntlProvider>
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});

