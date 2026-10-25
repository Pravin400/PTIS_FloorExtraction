import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageHoverPreview } from '@/components/modules/property-tax/ptis/media/ImageHoverPreview';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ImageHoverPreview Component', () => {
  const defaultProps = {
    src: 'https://example.com/photo.jpg',
    title: 'Sample Property Photo',
    visible: true,
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when visible with default 100% zoom scale', () => {
    render(<ImageHoverPreview {...defaultProps} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Sample Property Photo')).toBeInTheDocument();
  });

  it('enables zoom out button at 100% zoom and allows zooming out below 100%', () => {
    render(<ImageHoverPreview {...defaultProps} />);
    const zoomOutBtn = screen.getByTitle('media.zoomOut');

    expect(zoomOutBtn).not.toBeDisabled();

    // Click Zoom Out once: 100% -> 80%
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('80%')).toBeInTheDocument();

    // Click Zoom Out again: 80% -> 60%
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows reset zoom button when zoom is not 100%', () => {
    render(<ImageHoverPreview {...defaultProps} />);
    expect(screen.queryByTitle('media.resetZoom')).not.toBeInTheDocument();

    const zoomOutBtn = screen.getByTitle('media.zoomOut');
    fireEvent.click(zoomOutBtn);

    const resetBtn = screen.getByTitle('media.resetZoom');
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    const { container } = render(<ImageHoverPreview {...defaultProps} visible={false} />);
    expect(container.firstChild).toBeNull();
  });
});
