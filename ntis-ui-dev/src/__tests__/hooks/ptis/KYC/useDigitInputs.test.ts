import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDigitInputs } from '@/hooks/useDigitInputs';

describe('useDigitInputs', () => {
  describe('Initialization', () => {
    it('should initialize with empty digits when no initialValue provided', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));

      expect(result.current.digits).toEqual(Array(10).fill(''));
      expect(result.current.value).toBe('');
    });

    it('should initialize with provided initialValue', () => {
      const { result } = renderHook(() => useDigitInputs(10, '9876543210'));

      expect(result.current.digits).toEqual(['9', '8', '7', '6', '5', '4', '3', '2', '1', '0']);
      expect(result.current.value).toBe('9876543210');
    });

    it('should sanitize non-digit characters from initialValue', () => {
      const { result } = renderHook(() => useDigitInputs(10, '123-456-7890'));

      expect(result.current.digits).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
      expect(result.current.value).toBe('1234567890');
    });

    it('should pad with empty strings if initialValue is shorter than length', () => {
      const { result } = renderHook(() => useDigitInputs(10, '12345'));

      expect(result.current.digits).toEqual(['1', '2', '3', '4', '5', '', '', '', '', '']);
      expect(result.current.value).toBe('12345');
    });

    it('should truncate if initialValue is longer than length', () => {
      const { result } = renderHook(() => useDigitInputs(10, '12345678901234'));

      expect(result.current.digits).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
      expect(result.current.value).toBe('1234567890');
    });
  });

  describe('handleChange', () => {
    it('should update digit at specified index', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));

      act(() => {
        result.current.handleChange(0, '5');
      });

      expect(result.current.digits[0]).toBe('5');
      expect(result.current.value).toBe('5');
    });

    it('should reject non-numeric input', () => {
      const { result } = renderHook(() => useDigitInputs(10, '1234567890'));

      act(() => {
        result.current.handleChange(3, 'a');
      });

      expect(result.current.digits[3]).toBe('');
      expect(result.current.value).toBe('123567890');
    });

    it('should only keep last digit if multiple characters entered', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));

      act(() => {
        result.current.handleChange(0, '123');
      });

      expect(result.current.digits[0]).toBe('3');
    });

    it('should handle replacing existing digit', () => {
      const { result } = renderHook(() => useDigitInputs(10, '1234567890'));

      act(() => {
        result.current.handleChange(4, '9');
      });

      expect(result.current.digits[4]).toBe('9');
      expect(result.current.value).toBe('1234967890');
    });
  });

  describe('handleKeyDown', () => {
    it('should handle backspace on empty field to move to previous field', () => {
      const { result } = renderHook(() => useDigitInputs(10, '12345'));
      const mockInputs = Array(10).fill(null).map(() => ({
        focus: vi.fn(),
      }));

      // Set up refs
      mockInputs.forEach((input, i) => {
        act(() => {
          result.current.setRef(i)(input as unknown as HTMLInputElement);
        });
      });

      const mockEvent = {
        key: 'Backspace',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(5, mockEvent);
      });

      // Should focus previous input when current is empty and backspace is pressed
      expect(mockInputs[4].focus).toHaveBeenCalled();
    });

    it('should not move backward on backspace if already at first field', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));
      const mockInputs = Array(10).fill(null).map(() => ({
        focus: vi.fn(),
      }));

      mockInputs.forEach((input, i) => {
        act(() => {
          result.current.setRef(i)(input as unknown as HTMLInputElement);
        });
      });

      const mockEvent = {
        key: 'Backspace',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(0, mockEvent);
      });

      // No focus should be called since we're at the first field
      mockInputs.forEach(input => {
        expect(input.focus).not.toHaveBeenCalled();
      });
    });
  });

  describe('setDigits', () => {
    it('should allow manually setting all digits', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));

      act(() => {
        result.current.setDigits(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
      });

      expect(result.current.value).toBe('1234567890');
    });
  });

  describe('value property', () => {
    it('should return joined digits as a string', () => {
      const { result } = renderHook(() => useDigitInputs(12, ''));

      act(() => {
        result.current.handleChange(0, '1');
        result.current.handleChange(1, '2');
        result.current.handleChange(2, '3');
      });

      expect(result.current.value).toBe('123');
    });

    it('should handle partially filled digits', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));

      act(() => {
        result.current.handleChange(0, '1');
        result.current.handleChange(2, '3');
        result.current.handleChange(4, '5');
      });

      expect(result.current.value).toBe('135');
    });
  });

  describe('initialValue updates', () => {
    it('should update digits when initialValue changes', () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useDigitInputs(10, initialValue),
        { initialProps: { initialValue: '1234567890' } }
      );

      expect(result.current.value).toBe('1234567890');

      rerender({ initialValue: '0987654321' });

      expect(result.current.value).toBe('0987654321');
    });

    it('should clear digits when initialValue changes to empty string', () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useDigitInputs(10, initialValue),
        { initialProps: { initialValue: '1234567890' } }
      );

      expect(result.current.value).toBe('1234567890');

      rerender({ initialValue: '' });

      expect(result.current.value).toBe('');
      expect(result.current.digits).toEqual(Array(10).fill(''));
    });

    it('should rebuild array when length changes', () => {
      const { result, rerender } = renderHook(
        ({ length, initialValue }) => useDigitInputs(length, initialValue),
        { initialProps: { length: 10, initialValue: '1234567890' } }
      );

      expect(result.current.digits.length).toBe(10);
      expect(result.current.value).toBe('1234567890');

      // Change length to 12 (like switching from mobile to Aadhar)
      rerender({ length: 12, initialValue: '123456789012' });

      expect(result.current.digits.length).toBe(12);
      expect(result.current.value).toBe('123456789012');
    });

    it('should handle length decrease without losing data', () => {
      const { result, rerender } = renderHook(
        ({ length, initialValue }) => useDigitInputs(length, initialValue),
        { initialProps: { length: 12, initialValue: '123456789012' } }
      );

      expect(result.current.digits.length).toBe(12);
      expect(result.current.value).toBe('123456789012');

      // Change length to 10 (should truncate)
      rerender({ length: 10, initialValue: '123456789012' });

      expect(result.current.digits.length).toBe(10);
      expect(result.current.value).toBe('1234567890');
    });
  });

  describe('Aadhar number use case (12 digits)', () => {
    it('should handle 12-digit Aadhar number correctly', () => {
      const { result } = renderHook(() => useDigitInputs(12, '123456789012'));

      expect(result.current.digits.length).toBe(12);
      expect(result.current.value).toBe('123456789012');
    });
  });

  describe('Mobile number use case (10 digits)', () => {
    it('should handle 10-digit mobile number correctly', () => {
      const { result } = renderHook(() => useDigitInputs(10, '9876543210'));

      expect(result.current.digits.length).toBe(10);
      expect(result.current.value).toBe('9876543210');
    });
  });

  describe('Focus/Blur behavior', () => {
    it('should initialize with isFocused as false', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));
      expect(result.current.isFocused).toBe(false);
    });

    it('should set isFocused to true when handleFocus is called', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));

      act(() => {
        result.current.handleFocus();
      });

      expect(result.current.isFocused).toBe(true);
    });

    it('should remain focused when blurring to another input within the group', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));
      const mockInputs = Array(10).fill(null).map(() => ({}));

      mockInputs.forEach((input, i) => {
        act(() => {
          result.current.setRef(i)(input as unknown as HTMLInputElement);
        });
      });

      act(() => {
        result.current.handleFocus();
      });
      expect(result.current.isFocused).toBe(true);

      const mockBlurEvent = {
        relatedTarget: mockInputs[1],
      } as unknown as React.FocusEvent<HTMLInputElement>;

      act(() => {
        result.current.handleBlur(mockBlurEvent);
      });

      expect(result.current.isFocused).toBe(true);
    });

    it('should set isFocused to false when blurring to an element outside the group', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));
      const mockInputs = Array(10).fill(null).map(() => ({}));

      mockInputs.forEach((input, i) => {
        act(() => {
          result.current.setRef(i)(input as unknown as HTMLInputElement);
        });
      });

      act(() => {
        result.current.handleFocus();
      });
      expect(result.current.isFocused).toBe(true);

      const mockBlurEvent = {
        relatedTarget: document.createElement('div'),
      } as unknown as React.FocusEvent<HTMLInputElement>;

      act(() => {
        result.current.handleBlur(mockBlurEvent);
      });

      expect(result.current.isFocused).toBe(false);
    });
  });

  describe('Marathi Numbers Support', () => {
    it('should translate Marathi/Devanagari digits in initialValue', () => {
      const { result } = renderHook(() => useDigitInputs(10, '९८७६५४३२१०'));
      expect(result.current.digits).toEqual(['9', '8', '7', '6', '5', '4', '3', '2', '1', '0']);
      expect(result.current.value).toBe('9876543210');
    });

    it('should translate Marathi/Devanagari digits on handleChange', () => {
      const { result } = renderHook(() => useDigitInputs(10, ''));
      act(() => {
        result.current.handleChange(0, '५');
      });
      expect(result.current.digits[0]).toBe('5');
      expect(result.current.value).toBe('5');
    });
  });
});
