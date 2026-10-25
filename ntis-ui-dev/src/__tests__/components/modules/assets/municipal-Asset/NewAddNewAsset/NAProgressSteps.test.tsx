import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NAProgressSteps } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/components/NAProgressSteps';
import { NAAssetFormContext } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext';
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

import type { AssetFormContextType } from '@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types';

import { ClipboardList } from 'lucide-react';

const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockSteps = [
  { id: 1, key: 'basic-info', title: 'Basic Information', subtitle: 'Asset Profile', icon: ClipboardList },
  { id: 2, key: 'location', title: 'Location & Ownership', subtitle: 'Map, Land & Title', icon: ClipboardList },
  { id: 3, key: 'inventory', title: 'Assets & Facilities', subtitle: 'Equipment & Other Assets', icon: ClipboardList },
  { id: 4, key: 'review', title: 'Review & Submit', subtitle: 'Verify & Submit', icon: ClipboardList },
];

describe('NAProgressSteps Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('mode');
    mockSearchParams.delete('assetId');
  });

  it('renders all step titles and subtitles', () => {
    render(<NAProgressSteps steps={mockSteps} currentStep={1} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Asset Profile')).toBeInTheDocument();
    expect(screen.getByText('Location & Ownership')).toBeInTheDocument();
    expect(screen.getByText('Map, Land & Title')).toBeInTheDocument();
    expect(screen.getByText('Assets & Facilities')).toBeInTheDocument();
    expect(screen.getByText('Equipment & Other Assets')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    expect(screen.getByText('Verify & Submit')).toBeInTheDocument();
  });

  it('triggers onStepClick when a step is clicked', () => {
    const handleStepClick = vi.fn();
    render(<NAProgressSteps steps={mockSteps} currentStep={1} completedSteps={[1]} onStepClick={handleStepClick} />);

    fireEvent.click(screen.getByText('Location & Ownership'));
    expect(handleStepClick).toHaveBeenCalledWith(2);
  });

  it('displays check icons for completed steps', () => {
    render(
      <NAProgressSteps steps={mockSteps} currentStep={3} completedSteps={[1, 2]} />
    );

    // Completed steps (1 and 2) render Check icon instead of step number
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays localized editing banner when in edit mode', () => {
    mockSearchParams.set('mode', 'edit');
    mockSearchParams.set('assetId', '1042');

    const mockContextValue = {
      formData: { assetCode: 'AST-1042' },
    } as unknown as AssetFormContextType;

    render(
      <NAAssetFormContext.Provider value={mockContextValue}>
        <NAProgressSteps steps={mockSteps} currentStep={1} />
      </NAAssetFormContext.Provider>
    );

    expect(screen.getByText(/Editing Asset #AST-1042/i)).toBeInTheDocument();
  });
});
