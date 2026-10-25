import { render, screen } from '@testing-library/react';
import { InventoryFilterBar } from '@/components/modules/assets/municipal-Asset/asset-detail-view/InventoryFilterBar';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/common')>();
  return {
    ...mod,
    Select: (props: { options: Array<{ label: string, value: string }>, onChange?: (e: React.ChangeEvent<HTMLSelectElement>, val: string) => void }) => (
      <select data-testid="mock-select" onChange={(e) => props.onChange && props.onChange(e, e.target.value)}>
        {props.options.map((opt: { label: string, value: string }) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  };
});

describe('InventoryFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders select and search input', () => {
    const handleCategoryChange = vi.fn();
    const handleSearchChange = vi.fn();
    const setCurrentPage = vi.fn();

    render(
      <InventoryFilterBar
        categories={['Furniture']}
        conditions={['Good']}
        categoryFilter="all"
        setCategoryFilter={handleCategoryChange}
        conditionFilter=""
        setConditionFilter={vi.fn()}
        searchTerm=""
        setSearchTerm={handleSearchChange}
        setCurrentPage={setCurrentPage}
      />
    );

    // Search input placeholder check
    expect(screen.getByPlaceholderText('searchInventory')).toBeInTheDocument();
    
    // Select options should exist
    expect(screen.getByText('Furniture')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', async () => {
    const handleCategoryChange = vi.fn();
    const handleSearchChange = vi.fn();
    const setCurrentPage = vi.fn();

    render(
      <InventoryFilterBar
        categories={['Furniture']}
        conditions={['Good']}
        categoryFilter="all"
        setCategoryFilter={handleCategoryChange}
        conditionFilter=""
        setConditionFilter={vi.fn()}
        searchTerm=""
        setSearchTerm={handleSearchChange}
        setCurrentPage={setCurrentPage}
      />
    );

    const input = screen.getByPlaceholderText('searchInventory');
    await userEvent.type(input, 'test');
    
    expect(handleSearchChange).toHaveBeenCalled();
  });
});
