import { render, screen } from '@testing-library/react';
import { DocumentThumb } from '@/components/modules/assets/municipal-Asset/asset-detail-view/DocumentThumb';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { priority, unoptimized, fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

describe('DocumentThumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDoc = {
    id: 'doc-1',
    name: 'Test Document',
    url: 'https://example.com/doc.jpg',
    type: 'IMAGE',
    icon: 'image' as const,
    thumbColor: 'bg-blue-50',
    size: '1.2 MB',
  };

  it('renders correctly with given document data', () => {
    render(<DocumentThumb doc={mockDoc} index={0} />);
    
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Test Document/i })).toBeInTheDocument();
  });

  it('calls onClick with URL when clicked', async () => {
    const handleClick = vi.fn();
    render(<DocumentThumb doc={mockDoc} index={0} onClick={handleClick} />);
    
    const button = screen.getByRole('button', { name: /View Test Document/i });
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledWith('https://example.com/doc.jpg');
  });

  it('calls onClick when Enter key is pressed', async () => {
    const handleClick = vi.fn();
    render(<DocumentThumb doc={mockDoc} index={0} onClick={handleClick} />);
    
    const button = screen.getByRole('button', { name: /View Test Document/i });
    button.focus();
    await userEvent.keyboard('{Enter}');
    
    expect(handleClick).toHaveBeenCalledWith('https://example.com/doc.jpg');
  });
});
