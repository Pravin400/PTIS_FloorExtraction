import { render, screen, fireEvent } from "@testing-library/react";
import { vi, Mock } from "vitest";
import { WaterConnectionToolbar } from "@/components/modules/property-tax/WaterConnectionMaster/WaterConnectionToolbar";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";


vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useLocale: vi.fn(),
  useTranslations: () => (key: string) => key,
}));

describe("WaterConnectionToolbar", () => {

  beforeEach(() => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });
    (usePathname as Mock).mockReturnValue("/en/property-tax/water-connection-master/tap-type");
    (useSearchParams as Mock).mockReturnValue({ get: () => "" });
    (useLocale as Mock).mockReturnValue("en");
  });

  it("renders tabs and search input", () => {
    render(<WaterConnectionToolbar />);
    expect(screen.getByPlaceholderText("tapType.searchPlaceholder")).toBeInTheDocument();
    expect(screen.getByText("tabs.tapType")).toBeInTheDocument();
    expect(screen.getByText("tabs.tapStatus")).toBeInTheDocument();
    expect(screen.getByText("tabs.tapSize")).toBeInTheDocument();
  });

  it("calls router.push when tab is changed", () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push });
    render(<WaterConnectionToolbar />);
    fireEvent.click(screen.getByText("tabs.tapStatus"));
    expect(push).toHaveBeenCalled();
  });

  it("sanitizes search input", () => {
    render(<WaterConnectionToolbar />);
    const input = screen.getByPlaceholderText("tapType.searchPlaceholder");
    fireEvent.change(input, { target: { value: "test@!#" } });
    expect((input as HTMLInputElement).value).toBe("test");
  });

  it("calls router.push when Add button is clicked", () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push });
    render(<WaterConnectionToolbar />);
    fireEvent.click(screen.getByText("tapType.addTitle"));
    expect(push).toHaveBeenCalled();
  });
});
