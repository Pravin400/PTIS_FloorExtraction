import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGrievanceWorkflowStageMasterList } from "@/hooks/asset-masters/grievance-workflow-stage-master/useGrievanceWorkflowStageMasterList";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useToast } from "@/components/common";
import { deleteGrievanceWorkflowStageMasterAction } from "@/app/[locale]/assets/configuration/master-data/grievance-workflow-stage/action";
import type { GrievanceWorkflowStageMaster } from "@/types/asset-masters/grievance-workflow-stage-master.types";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
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
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(),
}));

vi.mock("@/components/common", () => ({
  useToast: vi.fn(),
}));

vi.mock(
  "@/app/[locale]/assets/configuration/master-data/grievance-workflow-stage/action",
  () => ({
    deleteGrievanceWorkflowStageMasterAction: vi.fn(),
  })
);

describe("useGrievanceWorkflowStageMasterList", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockRefresh = vi.fn();
  const mockConfirm = vi.fn();
  const mockToastSuccess = vi.fn();
  const mockToastError = vi.fn();

  const defaultProps = {
    data: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 25,
    totalPages: 3,
    sortBy: "stageOrder",
    sortOrder: "asc",
  };

  const sampleRow: GrievanceWorkflowStageMaster = {
    id: 15,
    ulbTypeId: 1,
    ulbTypeName: "Municipal Corporation",
    stageCode: "STAGE_DEL",
    stageName: "Stage to Delete",
    stageNameLocal: "हटवण्यासारखा टप्पा",
    stageOrder: 2,
    status: "ACTIVE",
    description: "Sample",
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      refresh: mockRefresh,
    } as never);

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn(() => null),
    } as never);

    vi.mocked(useConfirm).mockReturnValue({
      confirm: mockConfirm,
    } as never);

    vi.mocked(useToast).mockReturnValue({
      success: mockToastSuccess,
      error: mockToastError,
      info: vi.fn(),
      warning: vi.fn(),
      dismiss: vi.fn(),
    } as never);
  });

  it("should calculate correct start and end record metrics", () => {
    const { result } = renderHook(() => useGrievanceWorkflowStageMasterList(defaultProps));

    expect(result.current.start).toBe(1);
    expect(result.current.end).toBe(10);
  });

  it("should navigate when changing page", () => {
    const { result } = renderHook(() => useGrievanceWorkflowStageMasterList(defaultProps));

    act(() => {
      result.current.changePage(2);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/en/assets/configuration/master-data/grievance-workflow-stage?page=2&pageSize=10&sortBy=stageOrder&sortOrder=asc"
    );
  });

  it("should navigate when changing page size", () => {
    const { result } = renderHook(() => useGrievanceWorkflowStageMasterList(defaultProps));

    act(() => {
      result.current.changePageSize(20);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/en/assets/configuration/master-data/grievance-workflow-stage?page=1&pageSize=20&sortBy=stageOrder&sortOrder=asc"
    );
  });

  it("should open delete confirmation modal and delete record on confirm success", async () => {
    vi.mocked(deleteGrievanceWorkflowStageMasterAction).mockResolvedValue({ success: true, ok: true });

    mockConfirm.mockImplementation(async ({ onConfirm }: { onConfirm: () => Promise<void> }) => {
      await onConfirm();
    });

    const { result } = renderHook(() => useGrievanceWorkflowStageMasterList(defaultProps));

    await act(async () => {
      result.current.handleDelete(sampleRow);
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "delete",
        title: "stageCode: STAGE_DEL",
      })
    );

    expect(deleteGrievanceWorkflowStageMasterAction).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith("form.messages.deleteSuccess");
  });

  it("should navigate to previous page when deleting the last remaining item on a page > 1", async () => {
    vi.mocked(deleteGrievanceWorkflowStageMasterAction).mockResolvedValue({ success: true, ok: true });

    mockConfirm.mockImplementation(async ({ onConfirm }: { onConfirm: () => Promise<void> }) => {
      await onConfirm();
    });

    // Page 2 of 2 with pageSize 10, totalCount 11 (only 1 item on Page 2)
    const page2Props = {
      ...defaultProps,
      pageNumber: 2,
      totalCount: 11,
      totalPages: 2,
    };

    const { result } = renderHook(() => useGrievanceWorkflowStageMasterList(page2Props));

    await act(async () => {
      result.current.handleDelete(sampleRow);
    });

    expect(deleteGrievanceWorkflowStageMasterAction).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      "/en/assets/configuration/master-data/grievance-workflow-stage?page=1&pageSize=10&sortBy=stageOrder&sortOrder=asc"
    );
  });

  it("should display error toast on deletion failure", async () => {
    vi.mocked(deleteGrievanceWorkflowStageMasterAction).mockResolvedValue({
      success: false,
      ok: false,
      message: "Record is referenced in another workflow",
      statusCode: 409,
    });

    mockConfirm.mockImplementation(async ({ onConfirm }: { onConfirm: () => Promise<void> }) => {
      await onConfirm();
    });

    const { result } = renderHook(() => useGrievanceWorkflowStageMasterList(defaultProps));

    await act(async () => {
      result.current.handleDelete(sampleRow);
    });

    expect(deleteGrievanceWorkflowStageMasterAction).toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalled();
  });
});
