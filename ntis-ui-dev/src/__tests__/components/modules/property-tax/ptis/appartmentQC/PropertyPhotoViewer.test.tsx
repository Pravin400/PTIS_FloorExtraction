import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PropertyPhotoViewer } from '@/components/modules/property-tax/ptis/appartmentQC/PropertyPhotoViewer';
import { usePropertyPhotoViewer } from '@/hooks/apartmentQc/usePropertyPhotoViewer';
import type { PropertyPhotoDto } from '@/types/photoplan.types';

interface ViewerPhoto extends PropertyPhotoDto {
  resolvedUrl?: string;
}

// Mock dependencies
vi.mock('@/hooks/apartmentQc/usePropertyPhotoViewer', () => ({
  usePropertyPhotoViewer: vi.fn(),
}));

const mockUsePropertyPhotoViewer = vi.mocked(usePropertyPhotoViewer);

vi.mock('@/components/modules/property-tax/ptis/media/MediaImageCards', () => ({
  MediaImageCard: ({ 
    src, 
    alt, 
    label, 
    onMouseEnter, 
    onMouseLeave, 
    onClick 
  }: { 
    src: string;
    alt: string;
    label: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
  }) => (
    <div
      data-testid="media-image-card"
      data-src={src}
      data-alt={alt}
      data-label={label}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      Image Card
    </div>
  ),
}));

vi.mock('@/components/modules/property-tax/ptis/media/ImageHoverPreview', () => ({
  ImageHoverPreview: ({ 
    src, 
    title, 
    visible 
  }: { 
    src: string;
    title: string;
    visible: boolean;
  }) => (
    <div
      data-testid="image-hover-preview"
      data-visible={visible ? 'true' : 'false'}
      data-src={src}
      data-title={title}
    >
      Hover Preview
    </div>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'drawer.propertyPhotos': 'Property Photos',
      'drawer.noPhotos': 'No photos available',
    };
    return map[key] || key;
  },
}));

describe('PropertyPhotoViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
      mockUsePropertyPhotoViewer.mockReturnValue({
        photos: [],
        isLoading: false,
        hasPhotos: false,
        totalPhotos: 0,
        visiblePhotoCount: 0,
        hoverPreview: null,
        getPhotoUrl: vi.fn(),
        getPhotoTitle: vi.fn(),
        handleImageHover: vi.fn(),
        handleImageLeave: vi.fn(),
        cancelImageLeave: vi.fn(),
        selectedImageIndex: 0,
        setSelectedImageIndex: vi.fn(),
        currentPhoto: null as unknown as ViewerPhoto,
        handleNext: vi.fn(),
        handlePrev: vi.fn(),
      });

      const { container } = render(
        <PropertyPhotoViewer open={false} propertyId={123} onClose={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders loading state', () => {
      mockUsePropertyPhotoViewer.mockReturnValue({
        photos: [],
        isLoading: true,
        hasPhotos: false,
        totalPhotos: 0,
        visiblePhotoCount: 0,
        hoverPreview: null,
        getPhotoUrl: vi.fn(),
        getPhotoTitle: vi.fn(),
        handleImageHover: vi.fn(),
        handleImageLeave: vi.fn(),
        cancelImageLeave: vi.fn(),
        selectedImageIndex: 0,
        setSelectedImageIndex: vi.fn(),
        currentPhoto: null as unknown as ViewerPhoto,
        handleNext: vi.fn(),
        handlePrev: vi.fn(),
      });

      render(<PropertyPhotoViewer open={true} propertyId={123} onClose={vi.fn()} />);
      expect(screen.getByText('Property Photos')).toBeInTheDocument();
    });

  it('renders photos when available', () => {
      const mockPhotos: ViewerPhoto[] = [
        { 
          propertyPhotoId: 1, 
          propertyId: 123,
          photoTypeId: 1,
          photoTypeCode: 'front',
          photoTypeName: '',
          documentGuid: 'guid-1', 
          resolvedUrl: 'blob://photo-1' 
        },
        { 
          propertyPhotoId: 2, 
          propertyId: 123,
          photoTypeId: 1,
          photoTypeCode: 'front',
          photoTypeName: '',
          documentGuid: 'guid-2', 
          resolvedUrl: 'blob://photo-2' 
        },
      ];

      mockUsePropertyPhotoViewer.mockReturnValue({
        photos: mockPhotos,
        isLoading: false,
        hasPhotos: true,
        totalPhotos: 2,
        visiblePhotoCount: 2,
        hoverPreview: null,
        getPhotoUrl: vi.fn((photo: ViewerPhoto) => photo.resolvedUrl || ''),
        getPhotoTitle: vi.fn((_photo: ViewerPhoto, index: number) => `Photo ${index + 1}`),
        handleImageHover: vi.fn(),
        handleImageLeave: vi.fn(),
        cancelImageLeave: vi.fn(),
        selectedImageIndex: 0,
        setSelectedImageIndex: vi.fn(),
        currentPhoto: null as unknown as ViewerPhoto,
        handleNext: vi.fn(),
        handlePrev: vi.fn(),
      });

    render(<PropertyPhotoViewer open={true} propertyId={123} onClose={vi.fn()} />);
    const imageCards = screen.getAllByTestId('media-image-card');
    expect(imageCards).toHaveLength(2);
    expect(screen.getByText('2 photos')).toBeInTheDocument();
  });

  it('renders close button when onClose is provided', () => {
      mockUsePropertyPhotoViewer.mockReturnValue({
        photos: [],
        isLoading: false,
        hasPhotos: false,
        totalPhotos: 0,
        visiblePhotoCount: 0,
        hoverPreview: null,
        getPhotoUrl: vi.fn(),
        getPhotoTitle: vi.fn(),
        handleImageHover: vi.fn(),
        handleImageLeave: vi.fn(),
        cancelImageLeave: vi.fn(),
        selectedImageIndex: 0,
        setSelectedImageIndex: vi.fn(),
        currentPhoto: null as unknown as ViewerPhoto,
        handleNext: vi.fn(),
        handlePrev: vi.fn(),
      });

      const mockOnClose = vi.fn();
      render(<PropertyPhotoViewer open={true} propertyId={123} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: /close photo viewer/i });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders hover preview when hoverPreview is set', () => {
      mockUsePropertyPhotoViewer.mockReturnValue({
        photos: [],
        isLoading: false,
        hasPhotos: false,
        totalPhotos: 0,
        visiblePhotoCount: 0,
        hoverPreview: { src: 'blob://preview', title: 'Preview Photo' },
        getPhotoUrl: vi.fn(),
        getPhotoTitle: vi.fn(),
        handleImageHover: vi.fn(),
        handleImageLeave: vi.fn(),
        cancelImageLeave: vi.fn(),
        selectedImageIndex: 0,
        setSelectedImageIndex: vi.fn(),
        currentPhoto: null as unknown as ViewerPhoto,
        handleNext: vi.fn(),
        handlePrev: vi.fn(),
      });

    render(<PropertyPhotoViewer open={true} propertyId={123} onClose={vi.fn()} />);
    const hoverPreview = screen.getByTestId('image-hover-preview');
    expect(hoverPreview).toHaveAttribute('data-visible', 'true');
    expect(hoverPreview).toHaveAttribute('data-src', 'blob://preview');
    expect(hoverPreview).toHaveAttribute('data-title', 'Preview Photo');
  });
});
