import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PhotoUploadSuccessModal } from '@/components/common/PhotoUploadSuccessModal';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'photoUploadedSuccess': 'Photo Uploaded Successfully',
        'photoReplacedSuccess': 'Photo Replaced Successfully',
        'media.photoUploadedSuccess': 'Photo Uploaded Successfully',
        'media.photoReplacedSuccess': 'Photo Replaced Successfully',
      };
      return translations[key] || key;
    };
    t.has = () => true;
    return t;
  },
}));

describe('PhotoUploadSuccessModal Component', () => {
  it('does not render when open is false', () => {
    render(<PhotoUploadSuccessModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders upload success message when open is true', () => {
    render(<PhotoUploadSuccessModal open={true} onClose={vi.fn()} isReplacement={false} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Photo Uploaded Successfully')).toBeInTheDocument();
  });

  it('renders replacement message when isReplacement is true', () => {
    render(<PhotoUploadSuccessModal open={true} onClose={vi.fn()} isReplacement={true} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Photo Replaced Successfully')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<PhotoUploadSuccessModal open={true} onClose={handleClose} />);
    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on ESC key press', () => {
    const handleClose = vi.fn();
    render(<PhotoUploadSuccessModal open={true} onClose={handleClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after timeout', () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    render(<PhotoUploadSuccessModal open={true} onClose={handleClose} />);
    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
