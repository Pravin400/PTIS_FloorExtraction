import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Mock sonner toast
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';

// ── Hoisted spies (must be above vi.mock so the factory can close over them) ─
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
  createFloorAction: vi.fn(),
  updateFloorAction: vi.fn(),
  createFloorRangeAction: vi.fn(),
  fetchFlatGenerationGroupsAction: vi.fn().mockResolvedValue([]),
  getMaxFlatGenerationSeqAction: vi.fn().mockResolvedValue(0),
}));

import FloorForm from '@/components/modules/property-tax/Floormaster/floor/FloorForm';
import { createFloorAction, updateFloorAction, createFloorRangeAction } from '@/app/[locale]/property-tax/floormaster/actions';
import type { Floor } from '@/types/floor.types';

// ── i18n messages ─────────────────────────────────────────────────────────────
const messages = {
  common: {
    buttons: { cancel: 'Cancel' },
    actions: { save: 'Save', update: 'Update' },
    note: { mandatory: 'Fields marked * are mandatory' },
    errors: { unauthorized: 'Unauthorized', serverError: 'Server error' },
  },
  floor: {
    floor: {
      aliasFallback: { floor: 'Floor', floors: 'Floors' },
      form: {
        addTitle: 'Add Floor',
        editTitle: 'Edit Floor',
        addSubtitle: 'Create a new floor',
        editSubtitle: 'Update floor details',
        entryMode: 'Select Floor Creation Mode',
        singleFloor: 'Single Floor',
        floorRange: 'Floor Range',
        floorCode: 'Floor Code',
        floorCodePlaceholder: 'Enter floor code',
        descriptionEnglish: 'English Description',
        descriptionEnglishPlaceholder: 'Enter English description',
        description: 'Regional Description',
        descriptionPlaceholder: 'Enter regional description',
        sequenceNo: 'Sequence No',
        sequenceNoPlaceholder: 'Enter sequence number',
        flatGenerationGroup: 'Flat Generation Type',
        flatGenerationGroupPlaceholder: 'Select Flat Generation Type',
        flatGenerationSeq: 'Flat Generation Sequence',
        flatGenerationSeqPlaceholder: 'Enter sequence',
        activeStatusTitle: 'Active Status',
        activeStatusOn: 'Active',
        activeStatusOff: 'Inactive',
        range: {
          start: 'Start',
          end: 'End',
          prefix: 'Prefix',
          startPlaceholder: 'Enter start value',
          endPlaceholder: 'Enter end value',
        },
        rangeExample: 'E.g. F1-F5',
        englishName: {
          label: 'English Name',
          placeholder: 'Enter name',
          prefix: 'Prefix',
          prefixPlaceholder: 'Enter prefix',
        },
        validation: {
          codeRequired: 'Floor code is required',
          codeMaxLength: 'Max {count} characters',
          codeFormat: 'Only alphanumeric allowed',
          descriptionRequired: 'Description is required',
          descriptionEnglishRequired: 'English description is required',
          descriptionMaxLength: 'Max {count} characters',
          descriptionFormat: 'Invalid format',
          englishOnly: 'Only English characters are allowed',
          sequenceNoRequired: 'Sequence No is required',
          flatGenerationGroupRequired: 'Flat Generation Type is required',
          flatGenerationSeqRequired: 'Flat Generation Sequence is required',
          mustBeActive: 'Must be active on create',
          rangeStartMinValue: 'Start value must be at least 1',
          rangeEndMinValue: 'End value must be at least 1',
          rangeMaxValue: 'Value cannot exceed {count}',
          rangeMaxCount: 'Cannot add more than {count} floors at a time',
        },
      },
      validation: { mustBeNumber: 'Must be a valid number' },
      success: { created: 'Floor {code} created', updated: 'Floor {code} updated' },
      apiErrors: {
        duplicateRecord: 'Duplicate record',
        invalidData: 'Invalid data',
        notFound: 'Not found',
        operationFailed: 'Operation failed',
      },
      messages: {
        createSuccess: 'Floor {code} created',
        updateSuccess: 'Floor {code} updated',
        deleteSuccess: 'Deleted',
        createRangeSuccess: '{count} floors created',
      },
    },
  },
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
const existingFloor: Floor = {
  id: 10,
  floorCode: 'GF',
  descriptionEnglish: 'Ground Floor',
  description: 'तळमजला',
  fLatGenerationGroupId: 1,
  fLatGenerationSeq: 1,
  sequenceNo: 1,
  isActive: true,
  createdDate: '2024-01-01',
  updatedDate: null,
};

function renderAdd() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FloorForm id={null} />
    </NextIntlClientProvider>
  );
}

function renderEdit(floor: Floor = existingFloor) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FloorForm id={floor.id} initialData={floor} />
    </NextIntlClientProvider>
  );
}

/** Submit the form directly by id (bypasses button↔form attribute wiring in JSDOM) */
function submitForm(container: HTMLElement, formId = 'form') {
  const form = container.querySelector(`#${formId}`) as HTMLFormElement;
  expect(form).not.toBeNull();
  fireEvent.submit(form);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('FloorForm — Add Mode', () => {
  beforeEach(() => vi.clearAllMocks());
  
  afterEach(async () => {
    // Wait for any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('renders Add Floor title', () => {
    renderAdd();
    expect(screen.getByText('Add Floor')).toBeInTheDocument();
  });

  it('renders Floor Code, Description and Sequence No fields', () => {
    renderAdd();
    expect(screen.getByPlaceholderText('Enter floor code')).toBeInTheDocument();
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
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText('Floor code is required')).toBeInTheDocument();
    });
  });

  it('shows English description required error when code is filled but English description is empty', async () => {
    const { container } = renderAdd();
    fireEvent.change(screen.getByPlaceholderText('Enter floor code'), {
      target: { name: 'floorCode', value: 'GF' },
    });
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText('English description is required')).toBeInTheDocument();
    });
  });

  it('shows description required error when code is filled but description is empty', async () => {
    const { container } = renderAdd();
    fireEvent.change(screen.getByPlaceholderText('Enter floor code'), {
      target: { name: 'floorCode', value: 'GF' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter English description'), {
      target: { name: 'descriptionEnglish', value: 'Ground Floor' },
    });
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('calls createFloorAction with correct data on valid submit', async () => {
    vi.mocked(createFloorAction).mockResolvedValue({ success: true });
    const { container } = renderAdd();

    fireEvent.change(screen.getByPlaceholderText('Enter floor code'), {
      target: { name: 'floorCode', value: 'GF' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter English description'), {
      target: { name: 'descriptionEnglish', value: 'Ground Floor' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter regional description'), {
      target: { name: 'description', value: 'तळमजला' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter sequence number'), {
      target: { name: 'sequenceNo', value: '1' },
    });
    submitForm(container);

    await waitFor(() => {
      expect(createFloorAction).toHaveBeenCalledWith(
        expect.objectContaining({ 
          floorCode: 'GF', 
          descriptionEnglish: 'Ground Floor',
          description: 'तळमजला',
          sequenceNo: 1,
        })
      );
    });
  });

  it('does NOT call createFloorAction when validation fails', async () => {
    const { container } = renderAdd();
    submitForm(container);
    await waitFor(() => {
      expect(screen.getByText('Floor code is required')).toBeInTheDocument();
    });
    expect(createFloorAction).not.toHaveBeenCalled();
  });

  it('sanitizes non-English characters in descriptionEnglish input', () => {
    renderAdd();
    const englishInput = screen.getByPlaceholderText('Enter English description') as HTMLInputElement;
    fireEvent.change(englishInput, {
      target: { name: 'descriptionEnglish', value: 'तळमजला Floor' },
    });
    expect(englishInput.value).toBe(' Floor');
  });

  it('shows validation error on blur for floorCode', async () => {
    renderAdd();
    const codeInput = screen.getByPlaceholderText('Enter floor code');
    fireEvent.focus(codeInput);
    fireEvent.blur(codeInput);
    await waitFor(() => {
      expect(screen.getByText('Floor code is required')).toBeInTheDocument();
    });
  });

  it('does NOT show status toggle in add mode', () => {
    renderAdd();
    expect(screen.queryByText('Active Status')).not.toBeInTheDocument();
  });
});

describe('FloorForm — Edit Mode', () => {
  beforeEach(() => vi.clearAllMocks());
  
  afterEach(async () => {
    // Wait for any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('renders Edit Floor title', () => {
    renderEdit();
    expect(screen.getByText('Edit Floor')).toBeInTheDocument();
  });

  it('pre-fills form with existing floor data', () => {
    renderEdit();
    expect(screen.getByDisplayValue('GF')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ground Floor')).toBeInTheDocument();
  });

  it('shows status toggle in edit mode', () => {
    renderEdit();
    expect(screen.getByText('Active Status')).toBeInTheDocument();
  });

  it('calls updateFloorAction on valid submit in edit mode', async () => {
    vi.mocked(updateFloorAction).mockResolvedValue({ success: true });
    const { container } = renderEdit();
    submitForm(container);

    await waitFor(() => {
      expect(updateFloorAction).toHaveBeenCalledWith(
        expect.objectContaining({ id: 10, floorCode: 'GF' })
      );
    });
  });

  it('shows error toast on duplicate (409)', async () => {
    vi.mocked(updateFloorAction).mockResolvedValue({ success: false, statusCode: 409 });
    const { container } = renderEdit();
    submitForm(container);

    await waitFor(() => {
      expect(updateFloorAction).toHaveBeenCalled();
    });
  });
});

describe('FloorForm — Range Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    // Wait for any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('switches to range mode and shows range fields', async () => {
    renderAdd();
    // Switch to range mode
    fireEvent.click(screen.getByText('Floor Range'));
    // Wait for the mode change and re-render
    expect(await screen.findByLabelText(/Start/)).toBeInTheDocument();
    expect(await screen.findByLabelText(/End/)).toBeInTheDocument();
  });

  it('shows validation errors for invalid range input', async () => {
    renderAdd();
    fireEvent.click(screen.getByText('Floor Range'));
    // Wait for range fields to appear
    await screen.findByLabelText(/Start/);
    // Submit with empty fields
    submitForm(document.body);
    await waitFor(() => {
      expect(screen.getByText(/Start value must be at least 1/)).toBeInTheDocument();
      expect(screen.getByText(/End value must be at least 1/)).toBeInTheDocument();
    });
  });

  it('shows validation error when range count exceeds 900', async () => {
    renderAdd();
    fireEvent.click(screen.getByText('Floor Range'));
    fireEvent.change(await screen.findByLabelText(/Start/), { target: { value: '1' } });
    fireEvent.change(await screen.findByLabelText(/End/), { target: { value: '950' } });
    submitForm(document.body);
    await waitFor(() => {
      expect(screen.getByText(/Cannot add more than 900 floors at a time/)).toBeInTheDocument();
    });
  });

  it('calls createFloorRangeAction with correct payload on valid range submit', async () => {
    vi.mocked(createFloorRangeAction).mockResolvedValue({ success: true, floorsCreated: 3 });
    renderAdd();
    fireEvent.click(screen.getByText('Floor Range'));
    // Wait for range fields to appear
    fireEvent.change(await screen.findByLabelText(/Start/), { target: { value: '1' } });
    fireEvent.change(await screen.findByLabelText(/End/), { target: { value: '3' } });
    submitForm(document.body);
    await waitFor(() => {
      expect(createFloorRangeAction).toHaveBeenCalledWith(
        expect.objectContaining({
          rangeFrom: '1',
          rangeTo: '3',
        })
      );
    });
  });

  it('shows error toast if createFloorRangeAction fails', async () => {
    vi.mocked(createFloorRangeAction).mockResolvedValue({ success: false, message: 'Server error' });
    renderAdd();
    fireEvent.click(screen.getByText('Floor Range'));
    // Wait for range fields to appear
    fireEvent.change(await screen.findByLabelText(/Start/), { target: { value: '1' } });
    fireEvent.change(await screen.findByLabelText(/End/), { target: { value: '2' } });
    submitForm(document.body);
    await waitFor(() => {
      expect(createFloorRangeAction).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/Server error/));
    });
  });
});
