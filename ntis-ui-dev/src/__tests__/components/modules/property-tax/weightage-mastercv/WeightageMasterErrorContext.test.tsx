import { render, screen, act } from '@testing-library/react';
import { WeightageMasterErrorProvider, useWeightageMasterError } from '@/components/modules/property-tax/weightage-mastercv/WeightageMasterErrorContext';
import { describe, it, expect, vi } from 'vitest';

const TestComponent = () => {
  const { hasError, setHasError } = useWeightageMasterError();
  return (
    <div>
      <span data-testid="error-state">{hasError.toString()}</span>
      <button onClick={() => setHasError(true)}>Set Error</button>
    </div>
  );
};

describe('WeightageMasterErrorContext', () => {
  it('should provide default error state as false', () => {
    render(
      <WeightageMasterErrorProvider>
        <TestComponent />
      </WeightageMasterErrorProvider>
    );
    expect(screen.getByTestId('error-state').textContent).toBe('false');
  });

  it('should update error state when setHasError is called', () => {
    render(
      <WeightageMasterErrorProvider>
        <TestComponent />
      </WeightageMasterErrorProvider>
    );
    
    act(() => {
      screen.getByText('Set Error').click();
    });
    
    expect(screen.getByTestId('error-state').textContent).toBe('true');
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useWeightageMasterError must be used within a WeightageMasterErrorProvider');
    consoleSpy.mockRestore();
  });
});
