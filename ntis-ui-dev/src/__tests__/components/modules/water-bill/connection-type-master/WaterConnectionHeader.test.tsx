import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { WaterConnectionHeader } from "@/components/modules/water-bill/connection-type-master/WaterConnectionHeader";

let currentPathname = "/en/water-bill/connection-type-master/connection-type";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => currentPathname,
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return {
    ...actual,
    useLocale: () => "en",
  };
});

const mockMessages = {
  connectionTypeMaster: {
    connectionType: {
      title: "Connection Type Master",
      description: "Manage connection types and descriptions",
    },
  },
  tapSizeMaster: {
    tapSize: {
      title: "Tap Size Master",
      description: "Manage tap sizes and nominal dimensions",
    },
  },
  connectionCategoryMaster: {
    connectionCategory: {
      title: "Connection Category Master",
      description: "Manage connection categories, billing frequencies and methods",
    },
  },
  waterConnectionMaster: {
    tabs: {
      connectionType: "Connection Type",
      tapSize: "Tap Size",
      connectionCategory: "Connection Category",
    },
  },
};

function renderHeader() {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <WaterConnectionHeader />
    </NextIntlClientProvider>
  );
}

describe("WaterConnectionHeader Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentPathname = "/en/water-bill/connection-type-master/connection-type";
  });

  it("renders Connection Type title and description for connection-type route", () => {
    currentPathname = "/en/water-bill/connection-type-master/connection-type";
    renderHeader();

    expect(screen.getByText("Connection Type Master")).toBeInTheDocument();
    expect(screen.getByText("Manage connection types and descriptions")).toBeInTheDocument();
  });

  it("renders Tap Size title and description for tap-size route", () => {
    currentPathname = "/en/water-bill/connection-type-master/tap-size";
    renderHeader();

    expect(screen.getByText("Tap Size Master")).toBeInTheDocument();
    expect(screen.getByText("Manage tap sizes and nominal dimensions")).toBeInTheDocument();
  });

  it("renders Connection Category title and description for connection-category route", () => {
    currentPathname = "/en/water-bill/connection-type-master/connection-category";
    renderHeader();

    expect(screen.getByText("Connection Category Master")).toBeInTheDocument();
    expect(screen.getByText("Manage connection categories, billing frequencies and methods")).toBeInTheDocument();
  });

  it("renders all tab navigation pills", () => {
    renderHeader();

    expect(screen.getByRole("tab", { name: /Connection Type/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Tap Size/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Connection Category/i })).toBeInTheDocument();
  });
});
