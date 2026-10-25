import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GrievanceWorkflowStageMaster } from "@/components/modules/assets/configuration/master-data/grievance-workflow-stage/GrievanceWorkflowStageMaster";
import type { GrievanceWorkflowStageMasterProps, GrievanceWorkflowStageMaster as GrievanceWorkflowStageMasterType } from "@/types/asset-masters/grievance-workflow-stage-master.types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
  usePathname: vi.fn(() => "/en/assets/configuration/master-data/grievance-workflow-stage"),
}));

vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => "en"),
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      title: "Grievance Workflow Stage",
      subtitle: "Manage grievance workflow stages per ULB type",
      add: "Add Workflow Stage",
      searchPlaceholder: "Search workflow stage records...",
      showing: "Showing",
      to: "to",
      of: "of",
      entries: "entries",
    };
    return translations[key] || key;
  }),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));

vi.mock("@/components/common", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/common")>();
  return {
    ...actual,
    useToast: vi.fn(() => ({
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      dismiss: vi.fn(),
    })),
  };
});

describe("GrievanceWorkflowStageMaster Component", () => {
  const sampleData: GrievanceWorkflowStageMasterType[] = [
    {
      id: 1,
      ulbTypeId: 1,
      ulbTypeName: "Municipal Corporation",
      stageCode: "STAGE_01",
      stageName: "Initial Review",
      stageNameLocal: "प्रारंभिक पुनरावलोकन",
      stageOrder: 1,
      status: "OPEN",
      description: "Initial Review Stage",
      isActive: true,
    },
  ];

  const defaultProps: GrievanceWorkflowStageMasterProps = {
    data: sampleData,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    sortBy: "stageOrder",
    sortOrder: "asc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render page title, subtitle, and add action button", () => {
    render(<GrievanceWorkflowStageMaster {...defaultProps} />);

    expect(screen.getByText("Grievance Workflow Stage")).toBeInTheDocument();
    expect(screen.getByText("Manage grievance workflow stages per ULB type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Workflow Stage/i })).toBeInTheDocument();
  });

  it("should navigate to add page when clicking Add button", () => {
    render(<GrievanceWorkflowStageMaster {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /Add Workflow Stage/i });
    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/grievance-workflow-stage/add");
  });

  it("should render table data rows", () => {
    render(<GrievanceWorkflowStageMaster {...defaultProps} />);

    expect(screen.getByText("STAGE_01")).toBeInTheDocument();
    expect(screen.getByText("Initial Review")).toBeInTheDocument();
  });
});
