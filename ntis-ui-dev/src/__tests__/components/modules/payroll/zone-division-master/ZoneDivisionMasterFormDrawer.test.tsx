import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return { ...actual, useLocale: () => 'en' };
});

import { ZoneDivisionMasterFormDrawer } from '@/components/modules/payroll/MasterModule/OrganizationMaster/ZoneDivisionMaster';
import type {
  ZoneDivisionMasterItem,
  ZoneDivisionMasterPayload,
} from '@/types/payroll/MasterModule';
import zoneDivisionMasterMessages from '@/i18n/locales/en/payrollZoneDivisionMaster.json';

const messages = {
  common: {
    buttons: { cancel: 'Cancel' },
    actions: { save: 'Save', update: 'Update' },
    status: { active: 'Active', inactive: 'Inactive' },
    note: { mandatory: 'Fields marked with * are mandatory' },
  },
  payrollZoneDivisionMaster: zoneDivisionMasterMessages,
};

const existingItem: ZoneDivisionMasterItem = {
  id: 1,
  zoneDivisionId: '1',
  zoneDivisionCode: 'DIV-EAST',
  zoneDivisionName: 'East Division Administrative Office',
  zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
  address: 'Near Shivaji Statue, Old Agra Road',
  isActive: true,
};

const secondItem: ZoneDivisionMasterItem = {
  id: 2,
  zoneDivisionId: '2',
  zoneDivisionCode: 'HQ-1',
  zoneDivisionName: 'Municipal Headquarters',
  zoneDivisionNameRegional: 'महानगरपालिका मुख्यालय',
  address: 'Main Municipal Building',
  isActive: false,
};

function renderAdd(props?: {
  onSave?: (data: ZoneDivisionMasterPayload) => Promise<boolean | void>;
  onClose?: () => void;
  existingItems?: ZoneDivisionMasterItem[];
}) {
  const items = props?.existingItems ?? [existingItem, secondItem];
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ZoneDivisionMasterFormDrawer
        isOpen={true}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn().mockResolvedValue(true)}
        existingItems={items}
        existingCodes={items.map((i) => i.zoneDivisionCode)}
      />
    </NextIntlClientProvider>
  );
}

function renderEdit(
  item: ZoneDivisionMasterItem = existingItem,
  props?: {
    onSave?: (data: ZoneDivisionMasterPayload) => Promise<boolean | void>;
    onClose?: () => void;
    existingItems?: ZoneDivisionMasterItem[];
  }
) {
  const items = props?.existingItems ?? [existingItem, secondItem];
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ZoneDivisionMasterFormDrawer
        isOpen={true}
        initialItem={item}
        onClose={props?.onClose ?? vi.fn()}
        onSave={props?.onSave ?? vi.fn().mockResolvedValue(true)}
        existingItems={items}
        existingCodes={items.map((i) => i.zoneDivisionCode)}
      />
    </NextIntlClientProvider>
  );
}

function submitZoneDivisionForm(container: HTMLElement) {
  const form = container.querySelector('#zone-division-form') as HTMLFormElement;
  expect(form).not.toBeNull();
  fireEvent.submit(form);
}

describe('ZoneDivisionMasterFormDrawer — Add Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Add New Zone / Office title and subtitle', () => {
    renderAdd();
    expect(screen.getByText('Add New Zone / Office')).toBeInTheDocument();
    expect(
      screen.getByText('Create a new municipal administrative office establishment')
    ).toBeInTheDocument();
  });

  it('renders mandatory field indicator note', () => {
    renderAdd();
    expect(screen.getByText('* Mandatory Fields')).toBeInTheDocument();
  });

  it('shows validation errors when submitting an empty form', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    submitZoneDivisionForm(container);

    await waitFor(() => {
      expect(screen.getByText('Office Code is required.')).toBeInTheDocument();
      expect(screen.getByText('Office Name is required.')).toBeInTheDocument();
      expect(screen.getByText('Office Name (Regional) is required.')).toBeInTheDocument();
      expect(screen.getByText('Physical Address is required.')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('formats code to uppercase and submits valid data', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    const codeInput = screen.getByPlaceholderText('e.g. DIV-EAST');
    const nameInput = screen.getByPlaceholderText('e.g. East Division Administrative Office');
    const marathiInput = screen.getByPlaceholderText('उदा. पूर्व विभाग प्रशासकीय कार्यालय');
    const addressInput = screen.getByPlaceholderText(
      'e.g. Near Shivaji Statue, Old Agra Road, Sector 3...'
    );

    fireEvent.change(codeInput, { target: { value: 'zone-north' } });
    expect((codeInput as HTMLInputElement).value).toBe('ZONE-NORTH');

    fireEvent.change(nameInput, { target: { value: 'North Zone Office' } });
    fireEvent.change(marathiInput, { target: { value: 'उत्तर विभाग कार्यालय' } });
    fireEvent.change(addressInput, { target: { value: 'Main North Complex' } });

    submitZoneDivisionForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          zoneDivisionCode: 'ZONE-NORTH',
          zoneDivisionName: 'North Zone Office',
          zoneDivisionNameRegional: 'उत्तर विभाग कार्यालय',
          address: 'Main North Complex',
          isActive: true,
        })
      );
    });
  });

  it('shows error for duplicate office code', async () => {
    const onSave = vi.fn();
    const { container } = renderAdd({ onSave });

    const codeInput = screen.getByPlaceholderText('e.g. DIV-EAST');
    fireEvent.change(codeInput, { target: { value: 'DIV-EAST' } });

    const nameInput = screen.getByPlaceholderText('e.g. East Division Administrative Office');
    fireEvent.change(nameInput, { target: { value: 'Unique Name' } });

    const marathiInput = screen.getByPlaceholderText('उदा. पूर्व विभाग प्रशासकीय कार्यालय');
    fireEvent.change(marathiInput, { target: { value: 'युनिक नाव' } });

    const addressInput = screen.getByPlaceholderText(
      'e.g. Near Shivaji Statue, Old Agra Road, Sector 3...'
    );
    fireEvent.change(addressInput, { target: { value: 'Valid Address' } });

    submitZoneDivisionForm(container);

    await waitFor(() => {
      expect(
        screen.getByText('This Office Code already exists. Codes must be unique.')
      ).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    renderAdd({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ZoneDivisionMasterFormDrawer — Edit Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Edit Zone / Office title and subtitle with badge', () => {
    renderEdit(existingItem);
    expect(screen.getByText('Edit Zone / Office')).toBeInTheDocument();
    expect(
      screen.getByText('Update administrative office establishment details')
    ).toBeInTheDocument();
    expect(screen.getByText('DIV-EAST')).toBeInTheDocument();
  });

  it('pre-populates existing office values', () => {
    renderEdit(existingItem);

    expect(screen.getByDisplayValue('DIV-EAST')).toBeInTheDocument();
    expect(screen.getByDisplayValue('East Division Administrative Office')).toBeInTheDocument();
    expect(screen.getByDisplayValue('पूर्व विभाग प्रशासकीय कार्यालय')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Near Shivaji Statue, Old Agra Road')).toBeInTheDocument();
  });

  it('allows updating fields and submitting', async () => {
    const onSave = vi.fn();
    const { container } = renderEdit(existingItem, { onSave });

    const nameInput = screen.getByDisplayValue('East Division Administrative Office');
    fireEvent.change(nameInput, { target: { value: 'East Division Main Office' } });

    submitZoneDivisionForm(container);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          zoneDivisionName: 'East Division Main Office',
        })
      );
    });
  });
});
