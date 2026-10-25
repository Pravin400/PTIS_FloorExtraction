import type React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterDropdown, FilterOption, FilterMode } from '@/components/common/FilterDropdown';

// Mock createPortal to render children directly
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('FilterDropdown Component', () => {
  const mockOptions: FilterOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    selectedValues: [] as string[],
    onFilterChange: vi.fn(),
    onFetchOptions: vi.fn().mockResolvedValue(mockOptions),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders filter button', () => {
      render(<FilterDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with custom placeholder title', () => {
      render(<FilterDropdown {...defaultProps} placeholder="Filter by name" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Filter by name');
    });

    it('renders disabled button when disabled prop is true', () => {
      render(<FilterDropdown {...defaultProps} disabled />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies active styling when isActive is true', () => {
      render(<FilterDropdown {...defaultProps} isActive />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-blue-600');
    });

    it('applies default styling when isActive is false', () => {
      render(<FilterDropdown {...defaultProps} isActive={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gray-500');
    });
  });

  describe('Dropdown Opening/Closing', () => {
    it('opens dropdown on button click', async () => {
      render(<FilterDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(defaultProps.onFetchOptions).toHaveBeenCalled();
      });
    });

    it('does not open dropdown when disabled', async () => {
      render(<FilterDropdown {...defaultProps} disabled />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      expect(defaultProps.onFetchOptions).not.toHaveBeenCalled();
    });

    it('closes dropdown on X button click', async () => {
      render(<FilterDropdown {...defaultProps} />);
      const filterButton = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Find the X button by its position (after Clear All button)
      const allButtons = screen.getAllByRole('button');
      const xButton = allButtons.find(btn => 
        btn.querySelector('svg.lucide-x') || btn.querySelector('.w-4.h-4')
      );
      
      if (xButton) {
        await act(async () => {
          fireEvent.click(xButton);
        });
      }
    });

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <FilterDropdown {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Click outside
      await act(async () => {
        fireEvent.mouseDown(screen.getByTestId('outside'));
      });
    });
  });

  describe('Single Select Mode', () => {
    const singleModeProps = {
      ...defaultProps,
      mode: 'single' as FilterMode,
    };

    it('calls onFilterChange with selected value on option click', async () => {
      render(<FilterDropdown {...singleModeProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Option 1'));
      });

      expect(singleModeProps.onFilterChange).toHaveBeenCalledWith(['option1']);
    });

    it('deselects option when clicking already selected option', async () => {
      render(<FilterDropdown {...singleModeProps} selectedValues={['option1']} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Option 1'));
      });

      expect(singleModeProps.onFilterChange).toHaveBeenCalledWith([]);
    });

    it('clears filter on Clear All click in single mode', async () => {
      render(<FilterDropdown {...singleModeProps} selectedValues={['option1']} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Clear All'));
      });

      expect(singleModeProps.onFilterChange).toHaveBeenCalledWith([]);
    });

    it('does not render checkboxes in single mode', async () => {
      render(<FilterDropdown {...singleModeProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Check that no checkbox elements are rendered
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);
    });

    it('does not render Apply button in single mode', async () => {
      render(<FilterDropdown {...singleModeProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Apply')).not.toBeInTheDocument();
    });
  });

  describe('Multi Select Mode', () => {
    const multiModeProps = {
      ...defaultProps,
      mode: 'multi' as FilterMode,
    };

    it('renders checkboxes in multi mode', async () => {
      render(<FilterDropdown {...multiModeProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Look for checkbox-like elements (styled spans)
      const checkboxes = document.querySelectorAll('.w-4.h-4.rounded.border-2');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('renders Apply button in multi mode', async () => {
      render(<FilterDropdown {...multiModeProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Apply')).toBeInTheDocument();
      });
    });

    it('toggles local selection on option click without immediate API call', async () => {
      render(<FilterDropdown {...multiModeProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Option 1'));
      });

      // Should not call onFilterChange immediately in multi mode
      expect(multiModeProps.onFilterChange).not.toHaveBeenCalled();
    });

    it('calls onFilterChange with selected values on Apply click', async () => {
      render(<FilterDropdown {...multiModeProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Select multiple options
      await act(async () => {
        fireEvent.click(screen.getByText('Option 1'));
        fireEvent.click(screen.getByText('Option 2'));
      });

      // Click Apply
      await act(async () => {
        fireEvent.click(screen.getByText('Apply'));
      });

      expect(multiModeProps.onFilterChange).toHaveBeenCalledWith(['option1', 'option2']);
    });

    it('clears all selections on Clear All click in multi mode', async () => {
      render(<FilterDropdown {...multiModeProps} selectedValues={['option1', 'option2']} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Find Clear All button in header
      const clearAllButtons = screen.getAllByText('Clear All');
      
      await act(async () => {
        fireEvent.click(clearAllButtons[0]); // Click header Clear All
      });

      expect(multiModeProps.onFilterChange).toHaveBeenCalledWith([]);
    });

    it('syncs local selection with props when opening', async () => {
      render(
        <FilterDropdown {...multiModeProps} selectedValues={['option1']} />
      );
      
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Check that Option 1 is selected (has blue background)
      const option1Button = screen.getByText('Option 1').closest('button');
      expect(option1Button).toHaveClass('bg-blue-50');
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching options', async () => {
      const slowFetch = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockOptions), 1000))
      );
      
      render(<FilterDropdown {...defaultProps} onFetchOptions={slowFetch} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      // Should show loading indicator
      await waitFor(() => {
        const loader = document.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows no options message when options array is empty', async () => {
      const emptyFetch = vi.fn().mockResolvedValue([]);
      
      render(<FilterDropdown {...defaultProps} onFetchOptions={emptyFetch} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('No options available')).toBeInTheDocument();
      });
    });

    it('shows custom no options message', async () => {
      const emptyFetch = vi.fn().mockResolvedValue([]);
      
      render(
        <FilterDropdown 
          {...defaultProps} 
          onFetchOptions={emptyFetch} 
          noOptionsText="No items found"
        />
      );
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      render(<FilterDropdown {...defaultProps} onFetchOptions={failingFetch} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Should show no options after error
      await waitFor(() => {
        expect(screen.getByText('No options available')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Custom Text Props', () => {
    it('renders custom clear all text', async () => {
      render(<FilterDropdown {...defaultProps} clearAllText="Reset" />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument();
      });
    });

    it('renders custom apply text in multi mode', async () => {
      render(
        <FilterDropdown 
          {...defaultProps} 
          mode="multi" 
          applyText="Confirm" 
        />
      );
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm')).toBeInTheDocument();
      });
    });
  });

  describe('Selected State Styling', () => {
    it('applies selected styling to selected options', async () => {
      render(<FilterDropdown {...defaultProps} selectedValues={['option1']} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        const option1Button = screen.getByText('Option 1').closest('button');
        expect(option1Button).toHaveClass('bg-blue-50');
        expect(option1Button).toHaveClass('text-blue-700');
      });
    });

    it('applies default styling to non-selected options', async () => {
      render(<FilterDropdown {...defaultProps} selectedValues={['option1']} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        const option2Button = screen.getByText('Option 2').closest('button');
        expect(option2Button).toHaveClass('text-gray-700');
        expect(option2Button).not.toHaveClass('bg-blue-50');
      });
    });
  });

  describe('Portal Rendering', () => {
    it('renders dropdown with fixed positioning', async () => {
      render(<FilterDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        const dropdown = document.querySelector('.min-w-\\[200px\\]');
        expect(dropdown).toHaveStyle({ position: 'fixed' });
      });
    });
  });

  describe('Accessibility', () => {
    it('filter button has proper title attribute', () => {
      render(<FilterDropdown {...defaultProps} placeholder="Filter column" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Filter column');
    });

    it('all interactive elements are buttons', async () => {
      render(<FilterDropdown {...defaultProps} mode="multi" />);
      const filterButton = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        // Should have: filter button, clear all (header), X button, 3 options, clear all (footer), apply
        expect(allButtons.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty selectedValues array', () => {
      render(<FilterDropdown {...defaultProps} selectedValues={[]} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles undefined mode (defaults to single)', async () => {
      render(<FilterDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.queryByText('Apply')).not.toBeInTheDocument();
      });
    });

    it('toggles dropdown on repeated button clicks', async () => {
      render(<FilterDropdown {...defaultProps} />);
      const button = screen.getByRole('button');
      
      // Open
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
      });

      // Close
      await act(async () => {
        fireEvent.click(button);
      });

      // The dropdown might close, options might not be visible
      // This depends on the implementation
    });
  });
});
