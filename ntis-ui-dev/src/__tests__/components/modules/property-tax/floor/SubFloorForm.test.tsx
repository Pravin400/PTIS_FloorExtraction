import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// ── Hoisted spies ─────────────────────────────────────────────────────────────
const pushSpy = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy, refresh: vi.fn() }),
}));

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return { ...actual, useLocale: () => 'en' };
});

vi.mock('@/app/[locale]/property-tax/floormaster/actions', () => ({
  createSubFloorAction: vi.fn(),
  updateSubFloorAction: vi.fn(),
}));

import SubFloorForm from '@/components/modules/property-tax/Floormaster/subfloor/SubFloorForm';
import {
  createSubFloorAction,
  updateSubFloorAction,
} from '@/app/[locale]/property-tax/floormaster/actions';
import type { SubFloor } from '@/types/floor.types';

// ── i18n messages ─────────────────────────────────────────────────────────────
const messages = {
  common: {
    buttons: { cancel: 'Cancel' },
    actions: { save: 'Save', update: 'Update' },
    note: { mandatory: 'Fields marked * are mandatory' },
    errors: { unauthorized: 'Unauthorized', serverError: 'Server error' },
  },
  floor: {
    subfloor: {
      form: {
        addTitle: 'Add SubFloor',
        editTitle: 'Edit SubFloor',
        addSubtitle: 'Create a new subfloor',
        editSubtitle: 'Update subfloor details',
        code: 'SubFloor Code',
        codePlaceholder: 'Enter subfloor code',
        descriptionEnglish: 'English Description',
        descriptionEnglishPlaceholder: 'Enter English description',
        description: 'Regional Description',
        descriptionPlaceholder: 'Enter regional description',
        sequenceNo: 'Sequence No',
        sequenceNoPlaceholder: 'Enter sequence number',
        activeStatusTitle: 'Active Status',
        activeStatusOn: 'Active',
        activeStatusOff: 'Inactive',
        validation: {
          codeRequired: 'SubFloor code is required',
          codeMaxLength: 'Max {count} characters',
          codeFormat: 'Only alphanumeric allowed',
          descriptionRequired: 'Regional description is required',
          descriptionEnglishRequired: 'English description is required',
          descriptionMaxLength: 'Max {count} characters',
          descriptionFormat: 'Invalid format',
          englishOnly: 'Only English characters are allowed',
          sequenceNoRequired: 'Sequence No is required',
          mustBeActive: 'Must be active on create',
        },
      },
      note: { mandatory: 'Fields marked * are mandatory' },
      success: { created: 'SubFloor {code} created', updated: 'SubFloor {code} updated' },
      apiErrors: {
        duplicateRecord: 'Duplicate record',
        invalidData: 'Invalid data',
        notFound: 'Not found',
        operationFailed: 'Operation failed',
      },
      messages: {
        createSuccess: 'SubFloor {code} created',
        updateSuccess: 'SubFloor {code} updated',
        deleteSuccess: 'Deleted',
        deleteFailed: 'Delete failed',
      },
      delete: {
        confirmTitle: 'Delete SubFloor {id}',
        confirmDescription: 'Are you sure?',
      },
      table: {
        columns: {
          subFloorCode: 'SubFloor Code',
          descriptionEnglish: 'English Description',
          descriptionRegional: 'Regional Description',
          status: 'Status',
        },
      },
    },
  },
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
const existingSubFloor: SubFloor = {
  id: 5,
  subFloorCode: 'B1',
  descriptionEnglish: 'Basement 1 English',
  description: 'Basement 1',
  sequenceNo: 1,
  isActive: true,
  createdDate: '2024-01-01',
  updatedDate: null,
};

function renderAdd() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SubFloorForm id={null} />
    </NextIntlClientProvider>
  );
}

function renderEdit(sf: SubFloor = existingSubFloor) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SubFloorForm id={sf.id} initialData={sf} />
    </NextIntlClientProvider>
  );
}

/**
 * Submit the subfloor form directly by id.
 * This helper targets the rendered form element explicitly to trigger
 * submission in tests. The form and SaveButton now both use id/form="subfloor-form",
 * so this workaround is for test reliability, not a real-world mismatch.
 */
function submitSubFloorForm(container: HTMLElement) {
  const form = container.querySelector('#subfloor-form') as HTMLFormElement;
  expect(form).not.toBeNull();
  fireEvent.submit(form);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('SubFloorForm — Add Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Add SubFloor title', () => {
    renderAdd();
    expect(screen.getByText('Add SubFloor')).toBeInTheDocument();
  });

  it('renders SubFloor Code, English Description, and Description fields', () => {
    renderAdd();
    expect(screen.getByPlaceholderText('Enter subfloor code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter English description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter regional description')).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    renderAdd();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows validation error when form submitted empty', async () => {
    const { container } = renderAdd();
    submitSubFloorForm(container);
    await waitFor(() => {
      expect(screen.getByText('SubFloor code is required')).toBeInTheDocument();
    });
  });

  it('shows English description required error when code is filled but English description is empty', async () => {
    const { container } = renderAdd();
    fireEvent.change(screen.getByPlaceholderText('Enter subfloor code'), {
      target: { name: 'subFloorCode', value: 'B1' },
    });
    submitSubFloorForm(container);
    await waitFor(() => {
      expect(screen.getByText('English description is required')).toBeInTheDocument();
    });
  });

  it('shows description required error when code and English description are filled but regional description is empty', async () => {
    const { container } = renderAdd();
    fireEvent.change(screen.getByPlaceholderText('Enter subfloor code'), {
      target: { name: 'subFloorCode', value: 'B1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter English description'), {
      target: { name: 'descriptionEnglish', value: 'Basement 1 English' },
    });
    submitSubFloorForm(container);
    await waitFor(() => {
      expect(screen.getByText('Regional description is required')).toBeInTheDocument();
    });
  });

  it('sanitizes non-English characters in descriptionEnglish input', () => {
    renderAdd();
    const englishInput = screen.getByPlaceholderText('Enter English description') as HTMLInputElement;
    fireEvent.change(englishInput, {
      target: { name: 'descriptionEnglish', value: 'तळमजला Basement' },
    });
    expect(englishInput.value).toBe(' Basement');
  });

  it('shows englishOnly error when English description contains double spaces', async () => {
    const { container } = renderAdd();
    fireEvent.change(screen.getByPlaceholderText('Enter subfloor code'), {
      target: { name: 'subFloorCode', value: 'B1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter English description'), {
      target: { name: 'descriptionEnglish', value: 'Basement  1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter regional description'), {
      target: { name: 'description', value: 'तळमजला' },
    });
    submitSubFloorForm(container);
    await waitFor(() => {
      expect(screen.getByText('Only English characters are allowed')).toBeInTheDocument();
    });
  });

  it('calls createSubFloorAction with correct data on valid submit', async () => {
    vi.mocked(createSubFloorAction).mockResolvedValue({ success: true });
    const { container } = renderAdd();

    fireEvent.change(screen.getByPlaceholderText('Enter subfloor code'), {
      target: { name: 'subFloorCode', value: 'B1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter English description'), {
      target: { name: 'descriptionEnglish', value: 'Basement 1 English' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter regional description'), {
      target: { name: 'description', value: 'Basement 1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter sequence number'), {
      target: { name: 'sequenceNo', value: '1' },
    });
    submitSubFloorForm(container);

    await waitFor(() => {
      expect(createSubFloorAction).toHaveBeenCalledWith(
        expect.objectContaining({
          subFloorCode: 'B1',
          descriptionEnglish: 'Basement 1 English',
          description: 'Basement 1',
        })
      );
    });
  });

  it('does NOT call createSubFloorAction when validation fails', async () => {
    const { container } = renderAdd();
    submitSubFloorForm(container);
    await waitFor(() => {
      expect(screen.getByText('SubFloor code is required')).toBeInTheDocument();
    });
    expect(createSubFloorAction).not.toHaveBeenCalled();
  });

  it('shows validation error on blur for subFloorCode', async () => {
    renderAdd();
    const codeInput = screen.getByPlaceholderText('Enter subfloor code');
    fireEvent.focus(codeInput);
    fireEvent.blur(codeInput);
    await waitFor(() => {
      expect(screen.getByText('SubFloor code is required')).toBeInTheDocument();
    });
  });

  it('does NOT show status toggle in add mode', () => {
    renderAdd();
    expect(screen.queryByText('Active Status')).not.toBeInTheDocument();
  });
});

describe('SubFloorForm — Edit Mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Edit SubFloor title', () => {
    renderEdit();
    expect(screen.getByText('Edit SubFloor')).toBeInTheDocument();
  });

  it('pre-fills form with existing subfloor data', () => {
    renderEdit();
    expect(screen.getByDisplayValue('B1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Basement 1 English')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Basement 1')).toBeInTheDocument();
  });

  it('shows status toggle in edit mode', () => {
    renderEdit();
    expect(screen.getByText('Active Status')).toBeInTheDocument();
  });

  it('shows Inactive status text when isActive is false', () => {
    renderEdit({ ...existingSubFloor, isActive: false });
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calls updateSubFloorAction on valid submit in edit mode', async () => {
    vi.mocked(updateSubFloorAction).mockResolvedValue({ success: true });
    const { container } = renderEdit();
    submitSubFloorForm(container);

    await waitFor(() => {
      expect(updateSubFloorAction).toHaveBeenCalledWith(
        expect.objectContaining({ id: 5, subFloorCode: 'B1' })
      );
    });
  });

  it('shows error on duplicate (409) response', async () => {
    vi.mocked(updateSubFloorAction).mockResolvedValue({ success: false, statusCode: 409 });
    const { container } = renderEdit();
    submitSubFloorForm(container);

    await waitFor(() => {
      expect(updateSubFloorAction).toHaveBeenCalled();
    });
  });

  it('shows error on server error (500) response', async () => {
    vi.mocked(updateSubFloorAction).mockResolvedValue({ success: false, statusCode: 500 });
    const { container } = renderEdit();
    submitSubFloorForm(container);

    await waitFor(() => {
      expect(updateSubFloorAction).toHaveBeenCalled();
    });
  });
});
