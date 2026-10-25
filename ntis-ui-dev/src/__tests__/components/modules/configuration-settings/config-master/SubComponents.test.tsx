import { describe, it, expect, vi } from 'vitest';
import './test-setup';
import { render, screen, fireEvent } from '@testing-library/react';

import { CategoryCard } from '@/components/modules/configuration-settings/config-master/CategoryCard';
import { DepartmentRow } from '@/components/modules/configuration-settings/config-master/DepartmentRow';
import { ConfigSearchBar } from '@/components/modules/configuration-settings/config-master/ConfigSearchBar';
import { ConfigValueInput } from '@/components/modules/configuration-settings/config-master/ConfigValueInput';
import type { ConfigCategory } from '@/types/configMaster.types';

describe('Config Master Subcomponents', () => {
  it('renders CategoryCard labels', () => {
    const category: ConfigCategory = {
      id: '1',
      name: 'General',
      code: 'GEN',
      displayOrder: 1,
      isActive: true,
      color: 'rose',
      icon: 'Shield',
      count: 2,
      total: 3,
    };

    render(
      <CategoryCard
        category={category}
        isActive
      />
    );

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '?categoryId=1');
  });

  it('toggles DepartmentRow expansion', () => {
    const onToggleExpansion = vi.fn();
    render(
      <DepartmentRow
        dept={{
          id: 1,
          name: 'Revenue',
          code: 'REV',
          isEnabled: true,
          value: '',
          configValueId: 0,
          submoduleCount: 1,
          submodules: [],
        }}
        isExpanded={false}
        onToggleExpansion={onToggleExpansion}
        onToggle={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /show/i }));
    expect(onToggleExpansion).toHaveBeenCalledWith(1);
  });

  it('allows clicking Hide button on DepartmentRow when department is disabled', () => {
    const onToggleExpansion = vi.fn();
    render(
      <DepartmentRow
        dept={{
          id: 1,
          name: 'Trade License',
          code: 'TL',
          isEnabled: false,
          value: '',
          configValueId: 0,
          submoduleCount: 2,
          submodules: [],
        }}
        isExpanded={true}
        onToggleExpansion={onToggleExpansion}
        onToggle={vi.fn()}
      />
    );

    const hideButton = screen.getByRole('button', { name: /hide/i });
    expect(hideButton).not.toBeDisabled();
    fireEvent.click(hideButton);
    expect(onToggleExpansion).toHaveBeenCalledWith(1);
  });

  it('search bar accepts input', () => {
    render(<ConfigSearchBar />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect((input as HTMLInputElement).value).toBe('abc');
  });

  it('ConfigValueInput updates via callback', () => {
    const onChange = vi.fn();
    render(
      <ConfigValueInput
        value=""
        dataType="string"
        controlType="text"
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalled();
  });
});
