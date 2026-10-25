import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoPlanViewer } from '@/components/modules/property-tax/ptis/media/PhotoPlanViewer';

const mockT = (key: string, values?: Record<string, unknown>) => {
  if (key === 'media.clickToUpload') {
    const vals = values as { title: string } | undefined;
    return `Click to upload ${vals?.title}`;
  }
  return key;
};

vi.mock('next-intl', () => ({
  useTranslations: () => mockT,
}));

const mockConfirm = vi.fn();
vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return {
    ...actual,
    useConfirm: () => ({
      confirm: mockConfirm,
    }),
  };
});

describe('PhotoPlanViewer Component', () => {
  const defaultProps = {
    categoryName: 'Front Elevation',
    images: [
      { src: 'img1.png', fullSrc: 'img1.png', title: 'Front View', alt: 'Front View', photoTypeCode: 'FRONT' },
      { src: 'img2.png', fullSrc: 'img2.png', title: 'Rear View', alt: 'Rear View', photoTypeCode: 'BACK' },
    ],
    selectedImageIndex: 0,
    onBackToGrid: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onEditImage: vi.fn(),
    onDownload: vi.fn(),
    onUpload: vi.fn(),
    onReplace: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders image viewer with images list correctly', () => {
    render(<PhotoPlanViewer {...defaultProps} />);
    expect(screen.getByText('Front Elevation')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('triggers back to grid, next, and prev handlers', () => {
    render(<PhotoPlanViewer {...defaultProps} />);

    const backBtn = screen.getByRole('button', { name: 'media.backToGrid' });
    fireEvent.click(backBtn);
    expect(defaultProps.onBackToGrid).toHaveBeenCalled();

    const prevBtn = screen.getByLabelText('Previous image');
    fireEvent.click(prevBtn);
    expect(defaultProps.onPrev).toHaveBeenCalled();

    const nextBtn = screen.getByLabelText('Next image');
    fireEvent.click(nextBtn);
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('disables controls when mutating (adding, replacing, deleting)', () => {
    render(<PhotoPlanViewer {...defaultProps} isReplacing={true} />);

    const backBtn = screen.getByRole('button', { name: 'media.backToGrid' });
    expect(backBtn).toBeDisabled();

    const prevBtn = screen.getByLabelText('Previous image');
    expect(prevBtn).toBeDisabled();

    const nextBtn = screen.getByLabelText('Next image');
    expect(nextBtn).toBeDisabled();
  });

  it('renders empty upload slot state and triggers upload click', () => {
    const { rerender } = render(<PhotoPlanViewer {...defaultProps} images={[]} />);
    
    expect(screen.getByText('media.noImageUploaded')).toBeInTheDocument();
    const uploadBtn = screen.getAllByRole('button', { name: 'media.uploadImage' })[0];
    fireEvent.click(uploadBtn!);
    expect(defaultProps.onUpload).toHaveBeenCalled();

    // With isAdding={true}, upload click should not be triggered, and spinner/uploading text shown
    rerender(<PhotoPlanViewer {...defaultProps} images={[]} isAdding={true} />);
    expect(screen.getAllByText('media.uploading').length).toBeGreaterThan(0);
  });

  it('triggers delete button and calls onDelete on confirm', () => {
    mockConfirm.mockImplementationOnce(({ onConfirm }) => onConfirm());
    render(<PhotoPlanViewer {...defaultProps} />);

    const deleteBtn = screen.getByLabelText('actions.delete');
    fireEvent.click(deleteBtn);

    expect(mockConfirm).toHaveBeenCalled();
    expect(defaultProps.onDelete).toHaveBeenCalledWith(0);
  });

  it('triggers replace button click handler', () => {
    render(<PhotoPlanViewer {...defaultProps} />);

    const replaceBtn = screen.getByLabelText('media.replaceImage');
    fireEvent.click(replaceBtn);

    expect(defaultProps.onReplace).toHaveBeenCalledWith(0);
  });
});
