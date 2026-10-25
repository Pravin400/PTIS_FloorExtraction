import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RequiredFieldsNote } from '@/components/common/RequiredFieldsNote';

describe('RequiredFieldsNote', () => {
  it('renders the provided text correctly', () => {
    const text = 'Indicates required fields';
    render(<RequiredFieldsNote text={text} />);
    
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders the text with the correct default styling', () => {
    const text = 'Required Fields';
    render(<RequiredFieldsNote text={text} />);
    
    const textElement = screen.getByText(text);
    expect(textElement).toHaveClass('text-[11px]');
    expect(textElement).toHaveClass('font-bold');
    expect(textElement).toHaveClass('uppercase');
    expect(textElement).toHaveClass('tracking-widest');
    expect(textElement).toHaveClass('text-slate-400');
  });

  it('renders the indicator dot', () => {
    const text = 'Required';
    const { container } = render(<RequiredFieldsNote text={text} />);
    
    // The dot is the first span before the text
    const dotElement = container.querySelector('span.w-1\\.5');
    expect(dotElement).toBeInTheDocument();
    expect(dotElement).toHaveClass('bg-blue-500/50');
    expect(dotElement).toHaveClass('rounded-full');
  });

  it('applies custom className to the wrapper div', () => {
    const text = 'Required';
    const customClass = 'my-custom-class';
    
    render(<RequiredFieldsNote text={text} className={customClass} />);
    
    const textElement = screen.getByText(text);
    const wrapperElement = textElement.parentElement;
    
    expect(wrapperElement).toHaveClass(customClass);
    expect(wrapperElement).toHaveClass('flex');
    expect(wrapperElement).toHaveClass('items-center');
    expect(wrapperElement).toHaveClass('gap-2');
  });
});
