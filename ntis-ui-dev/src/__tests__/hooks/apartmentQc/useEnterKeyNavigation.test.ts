import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEnterKeyNavigation } from '@/hooks/apartmentQc/useEnterKeyNavigation';

import type { Mock } from 'vitest';

describe('useEnterKeyNavigation', () => {
  let mockEvent: {
    key: string;
    preventDefault: Mock;
    stopPropagation: Mock;
    currentTarget: unknown;
  };
  let mockActiveElement: {
    tagName: string;
    getAttribute: Mock;
    hasAttribute: Mock;
  };
  let mockNextElement: {
    focus: Mock;
  };
  let mockForm: {
    querySelectorAll: Mock;
  };

  beforeEach(() => {
    mockNextElement = {
      focus: vi.fn(),
    };

    mockActiveElement = {
      tagName: 'INPUT',
      getAttribute: vi.fn(),
      hasAttribute: vi.fn(),
    };

    mockForm = {
      querySelectorAll: vi.fn().mockReturnValue([mockActiveElement, mockNextElement]),
    };

    mockEvent = {
      key: 'Enter',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      currentTarget: mockForm,
    };

    // Mock document.activeElement
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(mockActiveElement as unknown as Element);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should prevent default and focus the next element for standard inputs', () => {
    mockActiveElement.tagName = 'INPUT';
    
    vi.useFakeTimers();
    const { result } = renderHook(() => useEnterKeyNavigation());
    result.current(mockEvent as unknown as React.KeyboardEvent<HTMLElement>);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    
    vi.runAllTimers();
    
    expect(mockNextElement.focus).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should ignore Enter key if pressed inside a textarea', () => {
    mockActiveElement.tagName = 'TEXTAREA';
    
    const { result } = renderHook(() => useEnterKeyNavigation());
    result.current(mockEvent as unknown as React.KeyboardEvent<HTMLElement>);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    expect(mockNextElement.focus).not.toHaveBeenCalled();
  });

  it('should ignore Enter key for normal buttons without data-enter-navigable="true"', () => {
    mockActiveElement.tagName = 'BUTTON';
    mockActiveElement.getAttribute.mockReturnValue(null);
    
    const { result } = renderHook(() => useEnterKeyNavigation());
    result.current(mockEvent as unknown as React.KeyboardEvent<HTMLElement>);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockNextElement.focus).not.toHaveBeenCalled();
  });

  it('should navigate to next element for buttons with data-enter-navigable="true"', () => {
    mockActiveElement.tagName = 'BUTTON';
    mockActiveElement.getAttribute.mockImplementation((attr: string) => {
      if (attr === 'data-enter-navigable') return 'true';
      return null;
    });
    
    vi.useFakeTimers();
    const { result } = renderHook(() => useEnterKeyNavigation());
    result.current(mockEvent as unknown as React.KeyboardEvent<HTMLElement>);
    vi.runAllTimers();

    expect(mockEvent.preventDefault).not.toHaveBeenCalled(); // Button doesn't prevent default form submission in the hook logic
    expect(mockNextElement.focus).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should stop propagation and navigate if it is a closed combobox without aria-activedescendant', () => {
    mockActiveElement.tagName = 'INPUT'; // or BUTTON
    mockActiveElement.getAttribute.mockImplementation((attr: string) => {
      if (attr === 'role') return 'combobox';
      return null;
    });
    mockActiveElement.hasAttribute.mockImplementation((attr: string) => {
      if (attr === 'aria-activedescendant') return false; // No item highlighted
      return false;
    });
    
    vi.useFakeTimers();
    const { result } = renderHook(() => useEnterKeyNavigation());
    result.current(mockEvent as unknown as React.KeyboardEvent<HTMLElement>);
    vi.runAllTimers();

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockNextElement.focus).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should let combobox handle Enter if it has an aria-activedescendant', () => {
    mockActiveElement.tagName = 'INPUT';
    mockActiveElement.getAttribute.mockImplementation((attr: string) => {
      if (attr === 'role') return 'combobox';
      return null;
    });
    mockActiveElement.hasAttribute.mockImplementation((attr: string) => {
      if (attr === 'aria-activedescendant') return true; // An item is highlighted
      return false;
    });
    
    const { result } = renderHook(() => useEnterKeyNavigation());
    result.current(mockEvent as unknown as React.KeyboardEvent<HTMLElement>);

    expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockNextElement.focus).not.toHaveBeenCalled();
  });

  it('should do nothing if a key other than Enter is pressed', () => {
    mockEvent.key = 'Tab';
    
    const { result } = renderHook(() => useEnterKeyNavigation());
    result.current(mockEvent as unknown as React.KeyboardEvent<HTMLElement>);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
  });
});
