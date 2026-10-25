import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoPlanToolbar } from '@/components/modules/property-tax/ptis/media/PhotoPlanToolbar';

const mockT = (key: string, values?: Record<string, unknown>) => {
  if (key === 'media.imageOf') {
    const vals = values as { current: number; total: number } | undefined;
    return `Image ${vals?.current} of ${vals?.total}`;
  }
  return key;
};

vi.mock('next-intl', () => ({
  useTranslations: () => mockT,
}));

describe('PhotoPlanToolbar Component', () => {
  const defaultProps = {
    title: 'Test Photo',
    currentIndex: 0,
    totalCount: 3,
    hasImage: true,
    onDownload: vi.fn(),
    onUpload: vi.fn(),
    onReplace: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders correctly with default props', () => {
    render(<PhotoPlanToolbar {...defaultProps} />);
    expect(screen.getByText('Test Photo')).toBeInTheDocument();
    expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
  });

  it('triggers replace, delete, download when hasImage is true', () => {
    render(<PhotoPlanToolbar {...defaultProps} />);
    
    const replaceBtn = screen.getByLabelText('media.replaceImage');
    fireEvent.click(replaceBtn);
    expect(defaultProps.onReplace).toHaveBeenCalled();

    const deleteBtn = screen.getByLabelText('actions.delete');
    fireEvent.click(deleteBtn);
    expect(defaultProps.onDelete).toHaveBeenCalled();

    const downloadBtn = screen.getByLabelText('media.download');
    fireEvent.click(downloadBtn);
    expect(defaultProps.onDownload).toHaveBeenCalled();
  });

  it('triggers upload when hasImage is false', () => {
    render(<PhotoPlanToolbar {...defaultProps} hasImage={false} />);
    
    const uploadBtn = screen.getByLabelText('media.uploadImage');
    fireEvent.click(uploadBtn);
    expect(defaultProps.onUpload).toHaveBeenCalled();
  });

  it('disables buttons during mutations', () => {
    const { rerender } = render(
      <PhotoPlanToolbar {...defaultProps} isReplacing={true} />
    );

    // Replace button should show spinner/replacing text and be disabled
    const replaceBtn = screen.getByLabelText('media.replaceImage');
    expect(replaceBtn).toBeDisabled();
    expect(screen.getByText('media.replacing')).toBeInTheDocument();

    // Delete and Download should be disabled
    expect(screen.getByLabelText('actions.delete')).toBeDisabled();
    expect(screen.getByLabelText('media.download')).toBeDisabled();

    // Test isDeleting state
    rerender(<PhotoPlanToolbar {...defaultProps} isDeleting={true} />);
    expect(screen.getByLabelText('actions.delete')).toBeDisabled();

    // Test isAdding state on upload mode
    rerender(<PhotoPlanToolbar {...defaultProps} hasImage={false} isAdding={true} />);
    const uploadBtn = screen.getByLabelText('media.uploadImage');
    expect(uploadBtn).toBeDisabled();
    expect(screen.getByText('media.uploading')).toBeInTheDocument();
  });
});
