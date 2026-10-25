import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import * as actions from "@/app/[locale]/water-bill/geography-type-master/action";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useTranslations: vi.fn((ns?: string) => (key: string) => (ns ? `${ns}.${key}` : key)),
  useLocale: vi.fn(() => "en"),
}));
import { GeographyTypeForm } from "@/components/modules/water-bill/geography-type-master";
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/common/Drawer", () => ({
  Drawer: ({
    open,
    title,
    footer,
    children,
  }: {
    open: boolean;
    title: React.ReactNode;
    footer: React.ReactNode;
    children: React.ReactNode;
  }) =>
    open ? (
      <div>
        <div>{title}</div>
        {React.Children.map(children, (child) => {
          if (child && typeof child === "object" && "type" in child && child.type === "form") {
            const childElement = child as React.ReactElement<{ id?: string }>;
            return React.cloneElement(childElement, {
              ...childElement.props,
              ...({ "data-testid": "form" } as React.HTMLAttributes<HTMLFormElement>),
            });
          }
          return child;
        })}
        <div>{footer}</div>
      </div>
    ) : null,
}));
vi.mock("@/components/common", () => ({
  Input: ({
    name,
    label,
    fullWidth: _fullWidth,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label?: string; fullWidth?: boolean }) => (
    <input {...props} name={name} data-testid={name} aria-label={label || name} />
  ),
  ValidationMessage: ({ message, visible }: { message?: string; visible?: boolean }) =>
    visible && message ? <div>{message}</div> : null,
  CancelButton: ({
    label,
    fullWidth: _fullWidth,
    isLoading: _isLoading,
    ...rest
  }: { label: string; fullWidth?: boolean; isLoading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest}>{label}</button>
  ),
  SaveButton: ({
    label,
    fullWidth: _fullWidth,
    isLoading: _isLoading,
    ...rest
  }: { label: string; fullWidth?: boolean; isLoading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest}>{label}</button>
  ),
  ToggleSwitch: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-testid="toggle-switch" aria-label="Toggle status" />
  ),
}));

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
  back: vi.fn(),
  refresh: mockRouterRefresh,
  forward: vi.fn(),
  push: mockRouterPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
} as unknown as ReturnType<typeof useRouter>));

const mockCreate = vi.spyOn(actions, "createGeographyTypeAction").mockResolvedValue({ success: true });
const mockUpdate = vi.spyOn(actions, "updateGeographyTypeAction").mockResolvedValue({ success: true });

describe("GeographyTypeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders add form and submits successfully", async () => {
    render(<GeographyTypeForm id={null} />);
    fireEvent.change(screen.getByTestId("geographyTypeCode"), { target: { value: "MOUJA" } });
    fireEvent.blur(screen.getByTestId("geographyTypeCode"));
    fireEvent.change(screen.getByTestId("geographyType"), { target: { value: "Mouja" } });
    fireEvent.blur(screen.getByTestId("geographyType"));
    fireEvent.change(screen.getByTestId("levelNo"), { target: { value: "3" } });
    fireEvent.blur(screen.getByTestId("levelNo"));
    fireEvent.submit(screen.getByTestId("form"));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-type-master");
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it("renders edit form and submits successfully", async () => {
    const initialData = {
      id: 1,
      geographyTypeCode: "ZONE",
      geographyType: "Zone",
      levelNo: 1,
      isActive: true,
      createdDate: "2026-09-16T10:20:18",
      updatedDate: null,
    };
    render(<GeographyTypeForm id={1} initialData={initialData} />);
    expect(screen.getByTestId("geographyTypeCode")).toHaveValue("ZONE");
    expect(screen.getByTestId("geographyType")).toHaveValue("Zone");
    fireEvent.change(screen.getByTestId("geographyType"), { target: { value: "Zone Updated" } });
    fireEvent.blur(screen.getByTestId("geographyType"));
    fireEvent.submit(screen.getByTestId("form"));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-type-master");
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it("shows validation errors on empty submit", async () => {
    render(<GeographyTypeForm id={null} />);
    fireEvent.submit(screen.getByTestId("form"));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("toggles active status in edit mode", async () => {
    const initialData = {
      id: 1,
      geographyTypeCode: "ZONE",
      geographyType: "Zone",
      levelNo: 1,
      isActive: true,
      createdDate: "2026-09-16T10:20:18",
      updatedDate: null,
    };
    render(<GeographyTypeForm id={1} initialData={initialData} />);
    const toggle = await screen.findByTestId("toggle-switch");
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it("cancels and closes drawer", async () => {
    render(<GeographyTypeForm id={null} />);
    const cancelBtn = screen.getByText("common.buttons.cancel");
    fireEvent.click(cancelBtn);
    await waitFor(
      () => {
        expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/geography-type-master");
      },
      { timeout: 1000 }
    );
  });

  it("sanitizes geography type code to alphanumeric and underscore only", async () => {
    render(<GeographyTypeForm id={null} />);
    const input = screen.getByTestId("geographyTypeCode") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "AB C-12@#$_" } });
    expect(input.value).toBe("ABC12_");
  });

  it("limits geography type code length to 20 characters", async () => {
    render(<GeographyTypeForm id={null} />);
    const input = screen.getByTestId("geographyTypeCode") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "A".repeat(30) } });
    expect(input.value).toHaveLength(20);
  });

  it("handles API error on submit", async () => {
    mockCreate.mockResolvedValueOnce({ success: false, statusCode: 409, message: "Duplicate" });
    render(<GeographyTypeForm id={null} />);
    fireEvent.change(screen.getByTestId("geographyTypeCode"), { target: { value: "MOUJA" } });
    fireEvent.blur(screen.getByTestId("geographyTypeCode"));
    fireEvent.change(screen.getByTestId("geographyType"), { target: { value: "Mouja" } });
    fireEvent.blur(screen.getByTestId("geographyType"));
    fireEvent.change(screen.getByTestId("levelNo"), { target: { value: "3" } });
    fireEvent.blur(screen.getByTestId("levelNo"));
    fireEvent.submit(screen.getByTestId("form"));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
  });
});
