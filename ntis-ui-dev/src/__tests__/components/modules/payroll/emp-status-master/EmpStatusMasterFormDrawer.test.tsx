import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return { ...actual, useLocale: () => 'en' };
});

import { EmpStatusForm as EmpStatusMasterFormDrawer } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpStatusMaster/EmpStatusForm';
import type { EmpStatusMasterItem } from '@/types/payroll/MasterModule';

import empStatusMasterMessages from '@/i18n/locales/en/payrollEmployeeStatusMaster.json';
import empStatusMasterMessagesMr from '@/i18n/locales/mr/payrollEmployeeStatusMaster.json';
import empStatusMasterMessagesHi from '@/i18n/locales/hi/payrollEmployeeStatusMaster.json';

// ── i18n mock messages ────────────────────────────────────────────────────────
const messages = {
  common: {
    buttons: { cancel: 'Cancel' },
    actions: { save: 'Save', update: 'Update' },
    status: { active: 'Active', inactive: 'Inactive' },
    note: { mandatory: 'Fields marked with * are mandatory' },
  },
  empStatusMaster: empStatusMasterMessages,
  payrollEmployeeStatusMaster: empStatusMasterMessages,
};

const messagesMr = {
  common: {
    buttons: { cancel: 'रद्द करा' },
    actions: { save: 'जतन करा', update: 'अद्यतनित करा' },
    status: { active: 'सक्रिय', inactive: 'निष्क्रिय' },
    note: { mandatory: '* चिन्हांकित फील्ड अनिवार्य आहेत' },
  },
  empStatusMaster: empStatusMasterMessagesMr,
  payrollEmployeeStatusMaster: empStatusMasterMessagesMr,
};

const messagesHi = {
  common: {
    buttons: { cancel: 'रद्द करें' },
    actions: { save: 'सहेजें', update: 'अपडेट करें' },
    status: { active: 'सक्रिय', inactive: 'निष्क्रिय' },
    note: { mandatory: '* चिह्नित फ़ील्ड अनिवार्य हैं' },
  },
  empStatusMaster: empStatusMasterMessagesHi,
  payrollEmployeeStatusMaster: empStatusMasterMessagesHi,
};

// ── Test Fixtures ─────────────────────────────────────────────────────────────
const existingItem: EmpStatusMasterItem = {
  id: 1,
  employeeStatusId: '1',
  employeeStatusCode: 'ACTIVE',
  employeeStatus: 'Active in Service',
  employeeStatusMarathi: 'सेवेत कार्यरत',
  description: 'Employee is currently active in service',
  isActive: true,
};

const secondItem: EmpStatusMasterItem = {
  id: 2,
  employeeStatusId: '2',
  employeeStatusCode: 'SUSPENDED',
  employeeStatus: 'Suspended',
  employeeStatusMarathi: 'निलंबित',
  description: 'Employee under suspension',
  isActive: false,
};

function renderAdd(props?: {
  onSave?: (data: Omit<EmpStatusMasterItem, 'employeeStatusId'>) => void;
  onClose?: () => void;
  existingItems?: EmpStatusMasterItem[];
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpStatusMasterFormDrawer
        isOpen={true}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn()}
        existingItems={props?.existingItems ?? [existingItem, secondItem]}
      />
    </NextIntlClientProvider>
  );
}

function renderEdit(
  item: EmpStatusMasterItem = existingItem,
  props?: {
    onSave?: (data: Omit<EmpStatusMasterItem, 'employeeStatusId'>) => void;
    onClose?: () => void;
    existingItems?: EmpStatusMasterItem[];
  }
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpStatusMasterFormDrawer
        isOpen={true}
        initialItem={item}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn()}
        existingItems={props?.existingItems ?? [existingItem, secondItem]}
      />
    </NextIntlClientProvider>
  );
}

function submitEmpStatusForm(container: HTMLElement) {
  const form = container.querySelector('#emp-status-form') as HTMLFormElement;
  expect(form).not.toBeNull();
  fireEvent.submit(form);
}

// ── Test Suites ───────────────────────────────────────────────────────────────
describe('EmpStatusMasterFormDrawer — Add Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Add New Employee Status title and subtitle', () => {
    renderAdd();
    expect(screen.getByText('Add New Employee Status')).toBeInTheDocument();
    expect(screen.getByText('Create a new municipal employment status record')).toBeInTheDocument();
  });

  it('renders all form input fields with placeholders', () => {
    renderAdd();
    expect(screen.getByPlaceholderText('e.g. ACTIVE')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Active in Service')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('उदा. सेवेत कार्यरत')).toBeInTheDocument();
  });

  it('defaults to Active status switch', () => {
    renderAdd();
    expect(screen.getByText('Active')).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders Cancel and Create Status buttons', () => {
    renderAdd();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create status/i })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    renderAdd({ onClose });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows adding employee status with hyphen and underscore in status code (e.g. GEN_ADMIN or DEPT-EDU)', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = renderAdd({ onSave, onClose });

    fireEvent.change(screen.getByPlaceholderText('e.g. ACTIVE'), { target: { value: 'gen_admin' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Active in Service'), { target: { value: 'General Admin' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. सेवेत कार्यरत'), { target: { value: 'सामान्य प्रशासन' } });

    submitEmpStatusForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        employeeStatusCode: 'GEN_ADMIN',
        employeeStatus: 'General Admin',
        employeeStatusMarathi: 'सामान्य प्रशासन',
        description: undefined,
        isActive: true,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('EmpStatusMasterFormDrawer — Validation Rules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows validation errors when submitted with empty mandatory fields', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });
    submitEmpStatusForm(container);

    await waitFor(() => {
      expect(screen.getByText('Employee Status Code is required.')).toBeInTheDocument();
      expect(screen.getByText('Employee Status name is required.')).toBeInTheDocument();
      expect(screen.getByText('Employee Status (Regional) is required.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('strips numbers and symbols while allowing hyphens and underscores, and enforces uppercase formatting on Status Code', () => {
    renderAdd();
    const codeInput = screen.getByPlaceholderText('e.g. ACTIVE') as HTMLInputElement;
    fireEvent.change(codeInput, { target: { value: 'stat-act_123@#' } });
    expect(codeInput.value).toBe('STAT-ACT_');
  });

  it('strips numbers from English Employee Status Name (letters only)', () => {
    renderAdd();
    const nameInput = screen.getByPlaceholderText('e.g. Active in Service') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Active99' } });
    expect(nameInput.value).toBe('Active');
  });

  it('strips numeric digits (English and Marathi) from Marathi status name', () => {
    renderAdd();
    const marathiInput = screen.getByPlaceholderText('उदा. सेवेत कार्यरत') as HTMLInputElement;
    fireEvent.change(marathiInput, { target: { value: 'कार्यरत १२३ 123' } });
    expect(marathiInput.value).toBe('कार्यरत  ');
  });

  it('shows validation error when status code is less than 5 characters', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    fireEvent.change(screen.getByPlaceholderText('e.g. ACTIVE'), { target: { value: 'ACT' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Active in Service'), { target: { value: 'Active Status' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. सेवेत कार्यरत'), { target: { value: 'सक्रिय' } });

    submitEmpStatusForm(container);

    await waitFor(() => {
      expect(screen.getByText('Employee Status Code must be at least 5 characters.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('detects duplicate status code', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    fireEvent.change(screen.getByPlaceholderText('e.g. ACTIVE'), { target: { value: 'ACTIVE' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Active in Service'), { target: { value: 'New Status' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. सेवेत कार्यरत'), { target: { value: 'नवीन स्थिती' } });

    submitEmpStatusForm(container);

    await waitFor(() => {
      expect(screen.getByText('This Status Code already exists. Codes must be unique.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately on blur without clicking save button (English)', async () => {
    const onSave = vi.fn();
    renderAdd({ onSave });

    const codeInput = screen.getByPlaceholderText('e.g. ACTIVE');
    fireEvent.change(codeInput, { target: { value: 'ACTIVE' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(screen.getByText('This Status Code already exists. Codes must be unique.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately on blur in Marathi (mr)', async () => {
    const onSave = vi.fn();
    render(
      <NextIntlClientProvider locale="mr" messages={messagesMr}>
        <EmpStatusMasterFormDrawer
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          existingItems={[existingItem, secondItem]}
        />
      </NextIntlClientProvider>
    );

    const codeInput = screen.getByPlaceholderText('उदा. ACTIVE');
    fireEvent.change(codeInput, { target: { value: 'ACTIVE' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(screen.getByText('हा स्थिती संकेतांक आधीपासून अस्तित्वात आहे. संकेतांक अद्वितीय असावेत.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately on blur in Hindi (hi)', async () => {
    const onSave = vi.fn();
    render(
      <NextIntlClientProvider locale="hi" messages={messagesHi}>
        <EmpStatusMasterFormDrawer
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          existingItems={[existingItem, secondItem]}
        />
      </NextIntlClientProvider>
    );

    const codeInput = screen.getByPlaceholderText('उदा. ACTIVE');
    fireEvent.change(codeInput, { target: { value: 'ACTIVE' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(screen.getByText('यह स्थिति कोड पहले से मौजूद है. कोड अद्वितीय होने चाहिए.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('EmpStatusMasterFormDrawer — Edit Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Edit Employee Status title and displays existing code badge', () => {
    renderEdit(existingItem);
    expect(screen.getByText('Edit Employee Status')).toBeInTheDocument();
    expect(screen.getByText('Update employment status settings and service eligibility')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('pre-populates all form inputs with existing record values', () => {
    renderEdit(existingItem);
    expect(screen.getByDisplayValue('ACTIVE')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Active in Service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('सेवेत कार्यरत')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Employee is currently active in service')).toBeInTheDocument();
  });

  it('allows saving existing record without triggering false duplicate error on self', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = renderEdit(existingItem, { onSave, onClose });

    submitEmpStatusForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        employeeStatusCode: 'ACTIVE',
        employeeStatus: 'Active in Service',
        employeeStatusMarathi: 'सेवेत कार्यरत',
        description: 'Employee is currently active in service',
        isActive: true,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('toggles Active status from Inactive to Active and preserves state', () => {
    renderEdit(secondItem);
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});
