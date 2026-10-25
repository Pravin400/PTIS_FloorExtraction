import { render, screen, fireEvent } from '@testing-library/react';
import { FooterPagination } from '@/components/layout/FooterPagination';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'table.property' && params) {
      return `Property ${params.current} of ${params.total}`;
    }
    if (key === 'table.page' && params) {
      return `Page ${params.current} of ${params.total}`;
    }
    return key;
  },
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
    className,
    prefetch: _prefetch,
    scroll: _scroll,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    prefetch?: boolean;
    scroll?: boolean;
    [key: string]: unknown;
  }) => (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

describe('FooterPagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with current and total pages', () => {
    render(
      <FooterPagination
        currentPage={5}
        totalPages={10}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('Page 5 of 10')).toBeInTheDocument();
  });

  it('renders property pagination format when isPropertyPagination is true', () => {
    render(
      <FooterPagination
        currentPage={2}
        totalPages={50}
        isPropertyPagination={true}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('Property 2 of 50')).toBeInTheDocument();
  });

  it('disables first and previous buttons on first page', () => {
    render(
      <FooterPagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    // First two buttons (First, Prev) are disabled
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
    // Next and Last are enabled
    expect(buttons[2]).not.toBeDisabled();
    expect(buttons[3]).not.toBeDisabled();
  });

  it('disables next and last buttons on final page', () => {
    render(
      <FooterPagination
        currentPage={5}
        totalPages={5}
        onPageChange={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).not.toBeDisabled();
    expect(buttons[2]).toBeDisabled();
    expect(buttons[3]).toBeDisabled();
  });

  it('calls onPageChange with incremented page on clicking Next', () => {
    const onPageChange = vi.fn();
    render(
      <FooterPagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]); // Next button
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables buttons when isLoading is true', () => {
    render(
      <FooterPagination
        currentPage={2}
        totalPages={5}
        isLoading={true}
        onPageChange={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('fires onPageChange on click when nextUrl is provided', () => {
    const onPageChange = vi.fn();
    render(
      <FooterPagination
        currentPage={2}
        totalPages={5}
        nextUrl="/ptis/next"
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /buttons.nextPage/i });
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
