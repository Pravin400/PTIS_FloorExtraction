import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return { ...actual, useLocale: () => 'en' };
});

import { EmpTypeForm as EmpTypeMasterFormDrawer } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpTypeMaster/EmpTypeForm';
import type { EmpTypeMasterItem } from '@/types/payroll/MasterModule';

import empTypeMasterMessages from '@/i18n/locales/en/payrollEmployeeTypeMaster.json';
import empTypeMasterMessagesMr from '@/i18n/locales/mr/payrollEmployeeTypeMaster.json';
import empTypeMasterMessagesHi from '@/i18n/locales/hi/payrollEmployeeTypeMaster.json';

// ── i18n mock messages ────────────────────────────────────────────────────────
const messages = {
  common: {
    buttons: { cancel: 'Cancel' },
    actions: { save: 'Save', update: 'Update' },
    status: { active: 'Active', inactive: 'Inactive' },
    note: { mandatory: 'Fields marked with * are mandatory' },
  },
  empTypeMaster: empTypeMasterMessages,
  payrollEmployeeTypeMaster: empTypeMasterMessages,
};

const messagesMr = {
  common: {
    buttons: { cancel: 'रद्द करा' },
    actions: { save: 'जतन करा', update: 'अद्यतनित करा' },
    status: { active: 'सक्रिय', inactive: 'निष्क्रिय' },
    note: { mandatory: '* चिन्हांकित फील्ड अनिवार्य आहेत' },
  },
  empTypeMaster: empTypeMasterMessagesMr,
  payrollEmployeeTypeMaster: empTypeMasterMessagesMr,
};

const messagesHi = {
  common: {
    buttons: { cancel: 'रद्द करें' },
    actions: { save: 'सहेजें', update: 'अपडेट करें' },
    status: { active: 'सक्रिय', inactive: 'निष्क्रिय' },
    note: { mandatory: '* चिह्नित फ़ील्ड अनिवार्य हैं' },
  },
  empTypeMaster: empTypeMasterMessagesHi,
  payrollEmployeeTypeMaster: empTypeMasterMessagesHi,
};

// ── Test Fixtures ─────────────────────────────────────────────────────────────
const existingItem: EmpTypeMasterItem = {
  employeeTypeId: 'TYPE-001',
  employeeTypeCode: 'PERMN',
  employeeTypeName: 'Permanent',
  employeeTypeNameMarathi: 'कायम',
  sequenceNo: 1,
  isActive: true,
};

const secondItem: EmpTypeMasterItem = {
  employeeTypeId: 'TYPE-002',
  employeeTypeCode: 'TEMPR',
  employeeTypeName: 'Temporary',
  employeeTypeNameMarathi: 'तात्पुरता',
  sequenceNo: 2,
  isActive: false,
};

// ── Render Helpers (Property Tax pattern: renderAdd / renderEdit) ──────────────
function renderAdd(props?: {
  onSave?: (data: Omit<EmpTypeMasterItem, 'employeeTypeId'>) => void;
  onClose?: () => void;
  existingItems?: EmpTypeMasterItem[];
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpTypeMasterFormDrawer
        isOpen={true}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn()}
        existingItems={props?.existingItems ?? [existingItem, secondItem]}
      />
    </NextIntlClientProvider>
  );
}

function renderEdit(
  item: EmpTypeMasterItem = existingItem,
  props?: {
    onSave?: (data: Omit<EmpTypeMasterItem, 'employeeTypeId'>) => void;
    onClose?: () => void;
    existingItems?: EmpTypeMasterItem[];
  }
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpTypeMasterFormDrawer
        isOpen={true}
        initialItem={item}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn()}
        existingItems={props?.existingItems ?? [existingItem, secondItem]}
      />
    </NextIntlClientProvider>
  );
}

/**
 * Submit the employee type form directly by targeting form ID.
 * Follows Property Tax pattern (SubFloorForm.test.tsx).
 */
function submitEmpTypeForm(container: HTMLElement) {
  const form = container.querySelector('#emp-type-form') as HTMLFormElement;
  expect(form).not.toBeNull();
  fireEvent.submit(form);
}

// ── Test Suites ───────────────────────────────────────────────────────────────
describe('EmpTypeMasterFormDrawer — Add Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Add New Employee Type title and subtitle', () => {
    renderAdd();
    expect(screen.getByText('Add New Employee Type')).toBeInTheDocument();
    expect(screen.getByText('Create a new municipal employee type classification')).toBeInTheDocument();
  });

  it('renders all form input fields with placeholders', () => {
    renderAdd();
    expect(screen.getByPlaceholderText('e.g. PERM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Permanent')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('उदा. कायम / नियमित')).toBeInTheDocument();
  });

  it('defaults to Active status switch', () => {
    renderAdd();
    expect(screen.getByText('Active')).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders Cancel and Create Type buttons', () => {
    renderAdd();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create type/i })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    renderAdd({ onClose });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows adding employee type with hyphen and underscore in type code (e.g. PER-EMP)', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = renderAdd({ onSave, onClose });

    fireEvent.change(screen.getByPlaceholderText('e.g. PERM'), { target: { value: 'per-emp' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Permanent'), { target: { value: 'Permanent Employee' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. कायम / नियमित'), { target: { value: 'कायम कर्मचारी' } });

    submitEmpTypeForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        employeeTypeCode: 'PER-EMP',
        employeeTypeName: 'Permanent Employee',
        employeeTypeNameMarathi: 'कायम कर्मचारी',
        sequenceNo: 3,
        isActive: true,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('EmpTypeMasterFormDrawer — Validation Rules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows validation errors when submitted with empty mandatory fields', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });
    submitEmpTypeForm(container);

    await waitFor(() => {
      expect(screen.getByText('Employee Type Code is required.')).toBeInTheDocument();
      expect(screen.getByText('Employee Type Name is required.')).toBeInTheDocument();
      expect(screen.getByText('Employee Type (Regional) is required.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('strips numbers and symbols while allowing hyphens and underscores, and enforces uppercase formatting on Type Code', () => {
    renderAdd();
    const codeInput = screen.getByPlaceholderText('e.g. PERM') as HTMLInputElement;
    fireEvent.change(codeInput, { target: { value: 'per-emp_123@#' } });
    expect(codeInput.value).toBe('PER-EMP_');
  });

  it('strips numbers from English Employee Type Name (letters only)', () => {
    renderAdd();
    const nameInput = screen.getByPlaceholderText('e.g. Permanent') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Permanent45' } });
    expect(nameInput.value).toBe('Permanent');
  });

  it('strips numeric digits (English and Marathi) from Marathi name', () => {
    renderAdd();
    const marathiInput = screen.getByPlaceholderText('उदा. कायम / नियमित') as HTMLInputElement;
    fireEvent.change(marathiInput, { target: { value: 'कायम १२३ 123' } });
    expect(marathiInput.value).toBe('कायम  ');
  });



  it('shows validation error when type code is less than 5 characters', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    fireEvent.change(screen.getByPlaceholderText('e.g. PERM'), { target: { value: 'PERM' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Permanent'), { target: { value: 'Permanent' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. कायम / नियमित'), { target: { value: 'कायम' } });

    submitEmpTypeForm(container);

    await waitFor(() => {
      expect(screen.getByText('Employee Type Code must be at least 5 characters.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('detects duplicate employee type name under the same type code', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    fireEvent.change(screen.getByPlaceholderText('e.g. PERM'), { target: { value: 'PERMN' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Permanent'), { target: { value: 'Permanent' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. कायम / नियमित'), { target: { value: 'कायम नवीन' } });

    submitEmpTypeForm(container);

    await waitFor(() => {
      expect(screen.getByText('This employee type name already exists for this code.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately on blur without clicking save button (English)', async () => {
    const onSave = vi.fn();
    renderAdd({ onSave });

    const codeInput = screen.getByPlaceholderText('e.g. PERM');
    fireEvent.change(codeInput, { target: { value: 'PERMN' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(screen.getByText('This Type Code already exists. Codes must be unique.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately on blur in Marathi (mr)', async () => {
    const onSave = vi.fn();
    render(
      <NextIntlClientProvider locale="mr" messages={messagesMr}>
        <EmpTypeMasterFormDrawer
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          existingItems={[existingItem, secondItem]}
        />
      </NextIntlClientProvider>
    );

    const codeInput = screen.getByPlaceholderText('उदा. PERM');
    fireEvent.change(codeInput, { target: { value: 'PERMN' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(screen.getByText('हा प्रकार संकेतांक आधीपासून अस्तित्वात आहे. संकेतांक अद्वितीय असावेत.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately on blur in Hindi (hi)', async () => {
    const onSave = vi.fn();
    render(
      <NextIntlClientProvider locale="hi" messages={messagesHi}>
        <EmpTypeMasterFormDrawer
          isOpen={true}
          onClose={vi.fn()}
          onSave={onSave}
          existingItems={[existingItem, secondItem]}
        />
      </NextIntlClientProvider>
    );

    const codeInput = screen.getByPlaceholderText('उदा. PERM');
    fireEvent.change(codeInput, { target: { value: 'PERMN' } });
    fireEvent.blur(codeInput);

    await waitFor(() => {
      expect(screen.getByText('यह प्रकार कोड पहले से मौजूद है। कोड अद्वितीय होने चाहिए।')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('EmpTypeMasterFormDrawer — Edit Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Edit Employee Type title and displays existing code badge', () => {
    renderEdit(existingItem);
    expect(screen.getByText('Edit Employee Type')).toBeInTheDocument();
    expect(screen.getByText('Update employee type classification and ordering')).toBeInTheDocument();
    expect(screen.getByText('PERMN')).toBeInTheDocument();
  });

  it('pre-populates all form inputs with existing record values', () => {
    renderEdit(existingItem);
    expect(screen.getByDisplayValue('PERMN')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Permanent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('कायम')).toBeInTheDocument();
  });

  it('allows saving existing record without triggering false duplicate error on self', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { container } = renderEdit(existingItem, { onSave, onClose });

    submitEmpTypeForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        employeeTypeCode: 'PERMN',
        employeeTypeName: 'Permanent',
        employeeTypeNameMarathi: 'कायम',
        sequenceNo: 1,
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
