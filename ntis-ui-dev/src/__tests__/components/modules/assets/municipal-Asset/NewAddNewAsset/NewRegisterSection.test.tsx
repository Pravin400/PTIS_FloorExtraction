import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRegisterSection } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/drawer/NewRegisterSection';
import enTranslations from '@/i18n/locales/en/newAddNewAsset.json';

import type { AssetCategory, AssetType } from '@/types/asset/municipal-Asset/new-add-new-asset';

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

describe('NewRegisterSection Component', () => {
  const mockCategories = [
    { id: 1, categoryName: 'Building' },
    { id: 2, categoryName: 'Land' },
  ];

  const mockTypes = [
    { id: 10, assetTypeName: 'School' },
    { id: 20, assetTypeName: 'Hospital' },
  ];

  it('provides --Select-- as the first option in category dropdown', () => {
    render(
      <NewRegisterSection
        categories={mockCategories}
        types={[]}
        newData={{ category: '', assetType: '', categoryId: null, typeId: null }}
        setNewData={vi.fn()}
        canSubmitNew={false}
        isCatLoading={false}
        onCategoryChange={vi.fn()}
      />
    );

    const categoryInput = screen.getByLabelText(/Asset Category/i);
    fireEvent.click(categoryInput);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('--Select--');
    expect(options[1]).toHaveTextContent('Building');
    expect(options[2]).toHaveTextContent('Land');
  });

  it('provides --Select-- as the first option in type dropdown when types are loaded', () => {
    render(
      <NewRegisterSection
        categories={mockCategories}
        types={mockTypes}
        newData={{ category: 'Building', assetType: '', categoryId: 1, typeId: null }}
        setNewData={vi.fn()}
        canSubmitNew={false}
        isCatLoading={false}
        onCategoryChange={vi.fn()}
      />
    );

    const typeInput = screen.getByLabelText(/Asset Type/i);
    fireEvent.click(typeInput);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('--Select--');
    expect(options[1]).toHaveTextContent('School');
    expect(options[2]).toHaveTextContent('Hospital');
  });

  it('filters out inactive categories and types (isActive=0 or false)', () => {
    const mixedCategories = [
      { id: 1, categoryName: 'Active Building', isActive: 1 },
      { id: 2, categoryName: 'Inactive Land', isActive: 0 },
      { id: 3, categoryName: 'Active Road', isActive: true },
      { id: 4, categoryName: 'Inactive Water', isActive: false },
    ];

    const mixedTypes = [
      { id: 10, assetTypeName: 'Active School', isActive: 1 },
      { id: 20, assetTypeName: 'Inactive Clinic', isActive: 0 },
      { id: 30, assetTypeName: 'Active Dispensary', isActive: true },
    ];

    render(
      <NewRegisterSection
        categories={mixedCategories as unknown as AssetCategory[]}
        types={mixedTypes as unknown as AssetType[]}
        newData={{ category: 'Active Building', assetType: '', categoryId: 1, typeId: null }}
        setNewData={vi.fn()}
        canSubmitNew={false}
        isCatLoading={false}
        onCategoryChange={vi.fn()}
      />
    );

    const categoryInput = screen.getByLabelText(/Asset Category/i);
    fireEvent.click(categoryInput);

    const catOptions = screen.getAllByRole('option');
    const catLabels = catOptions.map((o) => o.textContent);
    expect(catLabels).toContain('Active Building');
    expect(catLabels).toContain('Active Road');
    expect(catLabels).not.toContain('Inactive Land');
    expect(catLabels).not.toContain('Inactive Water');

    const typeInput = screen.getByLabelText(/Asset Type/i);
    fireEvent.click(typeInput);

    const typeOptions = screen.getAllByRole('option');
    const typeLabels = typeOptions.map((o) => o.textContent);
    expect(typeLabels).toContain('Active School');
    expect(typeLabels).toContain('Active Dispensary');
    expect(typeLabels).not.toContain('Inactive Clinic');
  });
});
