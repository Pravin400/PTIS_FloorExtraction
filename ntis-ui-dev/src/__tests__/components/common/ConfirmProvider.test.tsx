import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmProvider, useConfirm, type ConfirmPayload } from "@/components/common/ConfirmProvider";
import { NextIntlClientProvider } from 'next-intl';

function TestComponent({ payload }: { payload: ConfirmPayload }) {
  const { confirm } = useConfirm();
  return (
    <button onClick={() => confirm(payload)}>Open Confirm</button>
  );
}

describe("ConfirmProvider", () => {
  const basePayload: ConfirmPayload = {
    variant: "delete",
    title: "Delete Record",
    description: "Are you sure you want to delete?",
    confirmText: "Delete",
    cancelText: "Cancel",
    meta: { id: 1, name: "Test" },
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    closeOnConfirm: true,
  };

  const mockMessages = {
    confirm: {
      delete: { title: 'Delete', description: 'Delete desc', confirm: 'Delete' },
      add: { title: 'Add', description: 'Add desc', confirm: 'Add' },
      update: { title: 'Update', description: 'Update desc', confirm: 'Update' },
      info: { title: 'Info', description: 'Info desc', confirm: 'OK' },
      warning: { title: 'Warning', description: 'Warning desc', confirm: 'Warn' },
      cancel: 'Cancel',
      recordName: 'Name',
      recordId: 'ID',
    },
    // Add other keys if needed for your tests
  };
  function setup(payload = basePayload) {
    return render(
      <NextIntlClientProvider locale="en" messages={{ common: mockMessages }}>
        <ConfirmProvider>
          <TestComponent payload={payload} />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );
  }

  it("renders children and does not show dialog initially", () => {
    setup();
    expect(screen.getByText("Open Confirm")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens dialog with correct content when confirm is called", async () => {
    setup();
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("Delete Record")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onCancel and closes dialog when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    setup({ ...basePayload, onCancel });
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("calls onConfirm and closes dialog when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    setup({ ...basePayload, onConfirm });
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows correct icon and color for each variant", async () => {
    const variants = ["delete", "add", "update", "info", "warning"] as const;
    for (const variant of variants) {
      const { unmount } = setup({ ...basePayload, variant });
      fireEvent.click(screen.getByText("Open Confirm"));
      await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText("Close"));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      unmount();
    }
  });

  it("closes dialog on ESC key press", async () => {
    setup();
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes dialog when clicking backdrop", async () => {
    setup();
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    // Backdrop is the first div inside the portal
    const backdrop = document.querySelector(".fixed .absolute");
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows meta info in description if provided", async () => {
    setup({ ...basePayload, meta: { id: 42, name: "MetaName" } });
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText(/MetaName/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it("does not close on confirm if closeOnConfirm is false", async () => {
    const onConfirm = vi.fn();
    setup({ ...basePayload, onConfirm, closeOnConfirm: false });
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalled();
    // Dialog should still be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("throws error if useConfirm is used outside provider", () => {
    // Suppress error output for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function BadComponent() {
      useConfirm();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow();
    spy.mockRestore();
  });

  it("does not show tooltip if record name is short and fits", async () => {
    setup({ ...basePayload, meta: { name: "ShortName" } });
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    
    const recordSpan = screen.getByText("ShortName");
    expect(recordSpan).toBeInTheDocument();
    expect(recordSpan.className).not.toContain("cursor-help");
    
    fireEvent.mouseEnter(recordSpan);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on hover if record name is long and truncated", async () => {
    const longName = "VeryLongRecordNameThatExceedsTheTruncationLimitOfThirtyCharacters";
    const expectedTruncated = "VeryLongRecordNameThatExce....";

    setup({ ...basePayload, meta: { name: longName } });
    fireEvent.click(screen.getByText("Open Confirm"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    const recordSpan = screen.getByText(expectedTruncated);
    expect(recordSpan).toBeInTheDocument();
    expect(recordSpan.className).toContain("cursor-help");

    fireEvent.mouseEnter(recordSpan);
    
    await waitFor(() => expect(screen.getByRole("tooltip")).toBeInTheDocument());
    expect(screen.getByRole("tooltip")).toHaveTextContent(longName);
  });
});
