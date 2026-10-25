import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AliasMasterStatsCards } from "@/components/modules/configuration-settings/alias-master/AliasMasterStatsCards";

describe("AliasMasterStatsCards", () => {
  const t = (key: string) => `aliasMaster.${key}`;

  it("should render total, active, and inactive counts with their labels", () => {
    render(
      <AliasMasterStatsCards
        counts={{ totalCount: 12, activeCount: 9, inactiveCount: 3 }}
        t={t}
      />
    );

    expect(screen.getByText("aliasMaster.stats.total")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    expect(screen.getByText("aliasMaster.stats.active")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();

    expect(screen.getByText("aliasMaster.stats.inactive")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should render zero counts correctly", () => {
    render(
      <AliasMasterStatsCards
        counts={{ totalCount: 0, activeCount: 0, inactiveCount: 0 }}
        t={t}
      />
    );

    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(3);
  });

  it("should format large counts with locale separators", () => {
    render(
      <AliasMasterStatsCards
        counts={{ totalCount: 1234, activeCount: 1000, inactiveCount: 234 }}
        t={t}
      />
    );

    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });
});
