import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NAFooter } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/components/NAFooter';
import enTranslations from '@/i18n/locales/en/newAddNewAsset.json';

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    let text = getNestedValue(enTranslations, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },
  useLocale: () => 'en',
}));

describe('NAFooter Component', () => {
  it('renders localized buttons: Previous, Save as Draft, Save & Next', () => {
    render(<NAFooter onPrevious={vi.fn()} onSaveAsDraft={vi.fn()} onSaveAndNext={vi.fn()} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Save & Next')).toBeInTheDocument();
  });

  it('renders Cancel when showPrevious is false', () => {
    render(<NAFooter showPrevious={false} onPrevious={vi.fn()} onSaveAndNext={vi.fn()} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('fires action callbacks on clicks', () => {
    const handlePrevious = vi.fn();
    const handleSaveAsDraft = vi.fn();
    const handleSaveAndNext = vi.fn();

    render(
      <NAFooter
        onPrevious={handlePrevious}
        onSaveAsDraft={handleSaveAsDraft}
        onSaveAndNext={handleSaveAndNext}
      />
    );

    fireEvent.click(screen.getByText('Previous'));
    expect(handlePrevious).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Save as Draft'));
    expect(handleSaveAsDraft).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Save & Next'));
    expect(handleSaveAndNext).toHaveBeenCalled();
  });

  it('shows saving indicator and disables buttons when isSaving or isSubmitting is true', () => {
    render(<NAFooter isSaving={true} onPrevious={vi.fn()} onSaveAndNext={vi.fn()} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: /Saving\.\.\./i });
    expect(saveButton).toBeDisabled();
  });

  it('shows updating indicator when saveAndNextLabel contains update', () => {
    render(
      <NAFooter
        isSubmitting={true}
        saveAndNextLabel="Update & Next"
        onPrevious={vi.fn()}
        onSaveAndNext={vi.fn()}
      />
    );

    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });
});
