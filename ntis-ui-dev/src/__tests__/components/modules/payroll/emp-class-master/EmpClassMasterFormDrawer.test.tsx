import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return { ...actual, useLocale: () => 'en' };
});

import { EmpClassMasterFormDrawer } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpClassMaster';
import type { EmpClassMasterItem, EmpClassMasterPayload } from '@/types/payroll/MasterModule';
import empClassMasterMessages from '@/i18n/locales/en/payrollEmployeeClassMaster.json';

const messages = {
  common: {
    buttons: { cancel: 'Cancel' },
    actions: { save: 'Save', update: 'Update' },
    status: { active: 'Active', inactive: 'Inactive' },
    note: { mandatory: 'Fields marked with * are mandatory' },
  },
  payrollEmployeeClassMaster: empClassMasterMessages,
};

const existingItem: EmpClassMasterItem = {
  id: 1,
  employeeClassId: '1',
  classCode: 'CLASS-I',
  className: 'Class I (Group A)',
  classNameMarathi: 'गट अ',
  description: 'Senior municipal executives and heads',
  isActive: true,
};

const secondItem: EmpClassMasterItem = {
  id: 2,
  employeeClassId: '2',
  classCode: 'CLASS-II',
  className: 'Class II (Group B)',
  classNameMarathi: 'गट ब',
  description: 'Mid-level officers',
  isActive: false,
};

function renderAdd(props?: {
  onSave?: (data: EmpClassMasterPayload) => Promise<boolean>;
  onClose?: () => void;
  existingItems?: EmpClassMasterItem[];
}) {
  const items = props?.existingItems ?? [existingItem, secondItem];
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpClassMasterFormDrawer
        isOpen={true}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn().mockResolvedValue(true)}
        existingItems={items}
        existingCodes={items.map((i) => i.classCode)}
      />
    </NextIntlClientProvider>
  );
}

function renderEdit(
  item: EmpClassMasterItem = existingItem,
  props?: {
    onSave?: (data: EmpClassMasterPayload) => Promise<boolean>;
    onClose?: () => void;
    existingItems?: EmpClassMasterItem[];
  }
) {
  const items = props?.existingItems ?? [existingItem, secondItem];
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpClassMasterFormDrawer
        isOpen={true}
        initialItem={item}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn().mockResolvedValue(true)}
        existingItems={items}
        existingCodes={items.map((i) => i.classCode)}
      />
    </NextIntlClientProvider>
  );
}

function submitEmpClassForm(container: HTMLElement) {
  const form = container.querySelector('#emp-class-form') as HTMLFormElement;
  expect(form).not.toBeNull();
  fireEvent.submit(form);
}

describe('EmpClassMasterFormDrawer — Add Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Add New Employee Class title and subtitle', () => {
    renderAdd();
    expect(screen.getByText('Add New Employee Class')).toBeInTheDocument();
    expect(screen.getByText('Configure new service classification details')).toBeInTheDocument();
  });

  it('renders all form input fields with placeholders', () => {
    renderAdd();
    expect(screen.getByPlaceholderText('e.g. CLASS-I')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Class I (Group A)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('उदा. वर्ग अ (गट अ)')).toBeInTheDocument();
  });

  it('defaults to Active status switch', () => {
    renderAdd();
    expect(screen.getByText('Active')).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders Cancel and Create Class buttons', () => {
    renderAdd();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create class/i })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    renderAdd({ onClose });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows adding employee class with letters, underscores, and hyphens in code', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    const { container } = renderAdd({ onSave, onClose });

    fireEvent.change(screen.getByPlaceholderText('e.g. CLASS-I'), { target: { value: 'grp-a_b' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Class I (Group A)'), { target: { value: 'Group A Category' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. वर्ग अ (गट अ)'), { target: { value: 'गट अ संवर्ग' } });

    submitEmpClassForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        classCode: 'GRP-A_B',
        className: 'Group A Category',
        classNameMarathi: 'गट अ संवर्ग',
        description: undefined,
        isActive: true,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('EmpClassMasterFormDrawer — Validation Rules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows validation errors when submitted with empty mandatory fields', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });
    submitEmpClassForm(container);

    await waitFor(() => {
      expect(screen.getByText('Class Code is required.')).toBeInTheDocument();
      expect(screen.getByText('Employee Class is required.')).toBeInTheDocument();
      expect(screen.getByText('Employee Class (Regional) is required.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error when entering existing class code', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    fireEvent.change(screen.getByPlaceholderText('e.g. CLASS-I'), { target: { value: 'CLASS-I' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Class I (Group A)'), { target: { value: 'New Name' } });
    fireEvent.change(screen.getByPlaceholderText('उदा. वर्ग अ (गट अ)'), { target: { value: 'नवीन नाव' } });

    submitEmpClassForm(container);

    await waitFor(() => {
      expect(screen.getByText('This Class Code already exists. Codes must be unique.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('EmpClassMasterFormDrawer — Edit Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pre-populates all inputs from initialItem', () => {
    renderEdit();
    expect(screen.getByDisplayValue('CLASS-I')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Class I (Group A)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('गट अ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior municipal executives and heads')).toBeInTheDocument();
  });

  it('submits updated values when edited', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    const { container } = renderEdit(existingItem, { onSave, onClose });

    fireEvent.change(screen.getByDisplayValue('Class I (Group A)'), {
      target: { value: 'Class I (Gazetted Officers)' },
    });

    submitEmpClassForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        classCode: 'CLASS-I',
        className: 'Class I (Gazetted Officers)',
        classNameMarathi: 'गट अ',
        description: 'Senior municipal executives and heads',
        isActive: true,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
