import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChargeHeadForm } from "@/components/modules/water-bill/charge-heads/ChargeHeadForm";
import type { ChargeHead } from "@/types/water-bill/chargeHeads.types";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => "en",
}));

describe("ChargeHeadForm Component Tests", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const sampleEditingData: ChargeHead = {
    id: 1,
    chargeHeadCode: "WTR_CHG",
    chargeHeadName: "Water Charge",
    chargeHeadNameLocal: "पाणी शुल्क",
    chargeType: "Charge",
    sequenceNo: 1,
    description: "Standard water charge",
    isRefundable: false,
    isRegularPay: false,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Add mode title when open and initialData is null", () => {
    render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByText("chargeHeads.form.addTitle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "common.buttons.cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "chargeHeads.form.actions.save" })).toBeInTheDocument();
  });

  it("should render Edit mode title and prefill values when initialData is provided", () => {
    render(
      <ChargeHeadForm
        open={true}
        initialData={sampleEditingData}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText("chargeHeads.form.editTitle")).toBeInTheDocument();
    expect(screen.getByDisplayValue("WTR_CHG")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Water Charge")).toBeInTheDocument();
    expect(screen.getByDisplayValue("पाणी शुल्क")).toBeInTheDocument();
    expect(screen.getByText("chargeHeads.form.status.label")).toBeInTheDocument();
  });

  it("should sanitize Code input by rejecting invalid characters such as > and spaces at input time", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;

    // Typing WTR>>>123 does not retain >
    fireEvent.change(codeInput, { target: { value: "WTR>>>123" } });
    expect(codeInput).toHaveValue("WTR123");

    // Typing spaces does not retain spaces
    fireEvent.change(codeInput, { target: { value: "WTR FEE" } });
    expect(codeInput).toHaveValue("WTRFEE");

    // Typing lowercase with symbols sanitizes and converts to uppercase
    fireEvent.change(codeInput, { target: { value: ">>>>wtr-fee<<<<" } });
    expect(codeInput).toHaveValue("WTR-FEE");
  });

  it("should allow valid Code containing letters, digits, underscore, and hyphen (e.g. WTR-FEE_123)", () => {
    const validCodes = ["WTR-FEE_123", "WATER1", "FEE_123", "wtr-chg_01"];

    validCodes.forEach((code) => {
      const { container, unmount } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
      const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;

      fireEvent.change(codeInput, { target: { value: code } });
      expect(codeInput).toHaveValue(code.toUpperCase());

      fireEvent.change(nameInput, { target: { value: "Water Charge Valid" } });

      const saveBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.save" });
      fireEvent.click(saveBtn);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          chargeHeadCode: code.toUpperCase(),
          chargeHeadName: "Water Charge Valid",
        })
      );

      mockOnSubmit.mockClear();
      unmount();
    });
  });

  it("should limit Charge Head Code length to 40 characters", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "A".repeat(50) } });
    expect(codeInput.value).toHaveLength(40);
  });

  it("should show inline validation error when required Code is empty on blur or submit", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
    fireEvent.blur(codeInput);

    expect(screen.getByText("chargeHeads.form.validation.codeRequired")).toBeInTheDocument();

    const form = container.querySelector("#charge-head-form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("chargeHeads.form.validation.codeRequired")).toBeInTheDocument();
  });

  it("should show inline validation error when Name has only allowed punctuation without letters or numbers", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "WTR-FEE_123" } });
    fireEvent.change(nameInput, { target: { value: "---" } });

    const saveBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.save" });
    fireEvent.click(saveBtn);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("chargeHeads.form.validation.nameInvalid")).toBeInTheDocument();
  });

  it("should display inline validation error without crashing when Charge Type is invalid", () => {
    const invalidChargeTypeData: ChargeHead = {
      id: 1,
      chargeHeadCode: "WTR_NEW",
      chargeHeadName: "New Charge",
      chargeType: "InvalidType" as unknown as ChargeHead["chargeType"],
      sequenceNo: 1,
      isRefundable: false,
      isRegularPay: false,
      isActive: true,
    };

    render(
      <ChargeHeadForm
        open={true}
        initialData={invalidChargeTypeData}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const updateBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.update" });
    expect(() => fireEvent.click(updateBtn)).not.toThrow();

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("chargeHeads.form.validation.chargeTypeInvalid")).toBeInTheDocument();
  });

  it("should sanitize invalid characters like > from Name, Name (Local), and Description during typing following Geography Type Master pattern", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // Name strips >>>>
    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: ">>>>Water Charge<<<<" } });
    expect(nameInput).toHaveValue("Water Charge");

    // Typing only >>>> results in empty string
    fireEvent.change(nameInput, { target: { value: ">>>>>>>" } });
    expect(nameInput).toHaveValue("");

    // Name (Local) preserves Marathi text while stripping >>>>
    const nameLocalInput = container.querySelector("#charge-head-name-local") as HTMLInputElement;
    fireEvent.change(nameLocalInput, { target: { value: ">>>>पाणी शुल्क<<<<" } });
    expect(nameLocalInput).toHaveValue("पाणी शुल्क");

    // Description preserves text, punctuation (- & / .) while stripping >>>>
    const descInput = container.querySelector("#description") as HTMLInputElement;
    fireEvent.change(descInput, { target: { value: ">>>>Standard Fee (2026) - Fee/Tax & Surcharge.<<<<" } });
    expect(descInput).toHaveValue("Standard Fee (2026) - Fee/Tax & Surcharge.");
  });

  it("should show inline validation errors when Name (Local) or Description contain only allowed punctuation without letters/numbers", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;
    const nameLocalInput = container.querySelector("#charge-head-name-local") as HTMLInputElement;
    const descInput = container.querySelector("#description") as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "WTR_NEW" } });
    fireEvent.change(nameInput, { target: { value: "Water Charge" } });
    fireEvent.change(nameLocalInput, { target: { value: "---" } });
    fireEvent.change(descInput, { target: { value: "---" } });

    const saveBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.save" });
    fireEvent.click(saveBtn);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("chargeHeads.form.validation.nameLocalInvalid")).toBeInTheDocument();
    expect(screen.getByText("chargeHeads.form.validation.descriptionInvalid")).toBeInTheDocument();
  });

  it("should enforce maximum lengths for Name, Name (Local), and Description", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;
    const nameLocalInput = container.querySelector("#charge-head-name-local") as HTMLInputElement;
    const descInput = container.querySelector("#description") as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "N".repeat(200) } });
    expect(nameInput.value).toHaveLength(150);

    fireEvent.change(nameLocalInput, { target: { value: "L".repeat(200) } });
    expect(nameLocalInput.value).toHaveLength(150);

    fireEvent.change(descInput, { target: { value: "D".repeat(600) } });
    expect(descInput.value).toHaveLength(50);
  });

  it("should show Sequence No in both Add and Edit modes", () => {
    const { container, unmount } = render(
      <ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );
    expect(container.querySelector("#sequence-no")).toBeInTheDocument();

    unmount();

    const { container: editContainer } = render(
      <ChargeHeadForm
        open={true}
        initialData={sampleEditingData}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    expect(editContainer.querySelector("#sequence-no")).toBeInTheDocument();
  });

  it("should not submit form when required Code or Name field is empty", () => {
    render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const saveBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.save" });
    fireEvent.click(saveBtn);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should submit form data correctly on valid inputs in Add mode", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;
    const seqInput = container.querySelector("#sequence-no") as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "WTR_NEW" } });
    fireEvent.change(nameInput, { target: { value: "New Water Connection Fee" } });
    fireEvent.change(seqInput, { target: { value: "42" } });

    const saveBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.save" });
    fireEvent.click(saveBtn);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        chargeHeadCode: "WTR_NEW",
        chargeHeadName: "New Water Connection Fee",
        sequenceNo: 42,
      })
    );
  });

  it("should call onClose when Cancel button is clicked", () => {
    render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const cancelBtn = screen.getByRole("button", { name: "common.buttons.cancel" });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should disable Cancel button during form submission", () => {
    render(
      <ChargeHeadForm
        open={true}
        isSubmitting={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "common.buttons.cancel" });
    expect(cancelBtn).toBeDisabled();
  });

  it("should show inline validation error and prevent submit when Sequence No is cleared", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;
    const seqInput = container.querySelector("#sequence-no") as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "WTR_TEST" } });
    fireEvent.change(nameInput, { target: { value: "Water Test Fee" } });

    // Clear sequenceNo by setting value to empty string and blurring
    fireEvent.change(seqInput, { target: { value: "" } });
    expect(seqInput.value).toBe("");

    fireEvent.blur(seqInput);
    expect(screen.getByText("chargeHeads.form.validation.sequenceNoRequired")).toBeInTheDocument();

    const form = container.querySelector("#charge-head-form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("chargeHeads.form.validation.sequenceNoRequired")).toBeInTheDocument();
  });

  it("should show sequenceNoMin error when sequence number is 0", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;
    const seqInput = container.querySelector("#sequence-no") as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "WTR_TEST" } });
    fireEvent.change(nameInput, { target: { value: "Water Test Fee" } });
    fireEvent.change(seqInput, { target: { value: "0" } });

    const saveBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.save" });
    fireEvent.click(saveBtn);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("chargeHeads.form.validation.sequenceNoMin")).toBeInTheDocument();
  });

  it("should submit validated data payload upon successful submission", () => {
    const { container } = render(<ChargeHeadForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const codeInput = container.querySelector("#charge-head-code") as HTMLInputElement;
    const nameInput = container.querySelector("#charge-head-name") as HTMLInputElement;
    const seqInput = container.querySelector("#sequence-no") as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: "wtr_val" } });
    fireEvent.change(nameInput, { target: { value: "Validated Fee" } });
    fireEvent.change(seqInput, { target: { value: "15" } });

    const saveBtn = screen.getByRole("button", { name: "chargeHeads.form.actions.save" });
    fireEvent.click(saveBtn);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        chargeHeadCode: "WTR_VAL",
        chargeHeadName: "Validated Fee",
        sequenceNo: 15,
        chargeType: "Charge",
        isActive: true,
      })
    );
  });
});
