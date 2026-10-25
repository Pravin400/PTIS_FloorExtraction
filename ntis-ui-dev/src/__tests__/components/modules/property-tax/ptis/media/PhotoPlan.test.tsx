import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';

// Mocks for next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockForward = vi.fn();

const mockSearchParamsGet = vi.fn((_key: string): string | null => null);

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: mockBack,
    forward: mockForward,
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsGet(key),
    toString: () => '',
  }),
  usePathname: () => '/property-tax/ptis',
}));

// Mock next-intl
const mockT = (key: string, values?: Record<string, unknown>) => {
  if (key === 'media.imageOf') {
    const vals = values as { current: number; total: number } | undefined;
    return `Image ${vals?.current} of ${vals?.total}`;
  }
  if (key === 'media.addPhotoFor') {
    const vals = values as { name: string } | undefined;
    return `Add Photo for ${vals?.name}`;
  }
  if (key === 'media.viewMoreImages') {
    return 'View more images';
  }
  if (key === 'media.hideMoreImages') {
    return 'Hide more images';
  }
  return key;
};
mockT.has = (_key: string) => true;

vi.mock('next-intl', () => ({
  useTranslations: () => mockT,
  useLocale: () => 'en',
}));

// Mock next/image to render a standard img tag
vi.mock('next/image', () => ({
  default: (props: React.ComponentProps<'img'> & Record<string, unknown>) => {
    const { unoptimized: _u, priority: _p, placeholder: _ph, blurDataURL: _b, fill: _f, loader: _l, onLoad, onError, ...rest } = props;
    const ImgTag = 'img';
    return (
      <ImgTag
        {...rest}
        alt={props.alt ?? ''}
        onLoad={(e) => {
          if (onLoad) onLoad(e as unknown as React.SyntheticEvent<HTMLImageElement, Event>);
        }}
        onError={(e) => {
          if (onError) onError(e as unknown as React.SyntheticEvent<HTMLImageElement, Event>);
        }}
      />
    );
  },
}));

// Mock toast from sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('mock-toast-id'),
  },
}));

// Mock confirm from `@/components/common`
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

// Mock actions
const mockUploadPropertyPhotoAction = vi.fn();
const mockReplacePropertyPhotoAction = vi.fn();
const mockDeletePropertyPhotoAction = vi.fn();
const mockGetPhotosByCategoryAction = vi.fn();
const mockGetPhotosByPropertyAction = vi.fn().mockResolvedValue({ success: true, data: [] });
const mockLaunchPhotoPlanDrawingToolAction = vi.fn();

vi.mock('@/app/[locale]/property-tax/ptis/PhotoPlan.action', () => ({
  uploadPropertyPhotoAction: (...args: unknown[]) => mockUploadPropertyPhotoAction(...args),
  replacePropertyPhotoAction: (...args: unknown[]) => mockReplacePropertyPhotoAction(...args),
  deletePropertyPhotoAction: (...args: unknown[]) => mockDeletePropertyPhotoAction(...args),
  getPhotosByCategoryAction: (...args: unknown[]) => mockGetPhotosByCategoryAction(...args),
  getPhotosByPropertyAction: (...args: unknown[]) => mockGetPhotosByPropertyAction(...args),
  launchPhotoPlanDrawingToolAction: (...args: unknown[]) => mockLaunchPhotoPlanDrawingToolAction(...args),
}));

const mockCreatePropertyPhotoTypeAction = vi.fn();
vi.mock('@/app/[locale]/property-tax/ptis/PhotoPlanType.action', () => ({
  createPropertyPhotoTypeAction: (...args: unknown[]) => mockCreatePropertyPhotoTypeAction(...args),
}));

const mockGetDocumentAction = vi.fn((_guid: string, _action: 'view' | 'download') => Promise.resolve({ success: true, data: { base64: 'mock-base-64', contentType: 'image/png' } }));
vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/document.actions', () => ({
  getDocumentAction: (guid: string, action: 'view' | 'download') => mockGetDocumentAction(guid, action),
}));

const mockGetPhotoSlotsAction = vi.fn().mockImplementation(() => Promise.resolve({ success: true, data: [] }));
const mockGetPropertyPhotosAction = vi.fn().mockImplementation(() => Promise.resolve({ success: true, data: [] }));
vi.mock('@/app/[locale]/property-tax/ptis/media-fetch.action', () => ({
  getPhotoSlotsAction: (...args: unknown[]) => mockGetPhotoSlotsAction(...args),
  getPropertyPhotosAction: (...args: unknown[]) => mockGetPropertyPhotosAction(...args),
}));

const mockGetPropertyDrawPlanStatus = vi.fn().mockResolvedValue({ success: true, data: { isIndividualOrAmenity: true } });
vi.mock('@/lib/api/property.service', () => ({
  getPropertyDrawPlanStatus: (...args: unknown[]) => mockGetPropertyDrawPlanStatus(...args),
}));

// Mock useMediaPanelVisibility context hook
const mockTogglePanel = vi.fn();
vi.mock('@/hooks/ptis/photoplan/useMediaPanelVisibility', () => ({
  useMediaPanel: () => ({
    isPanelVisible: true,
    togglePanel: mockTogglePanel,
  }),
}));

// Import target utilities and configurations
import {
  formatPhotoPlanPayload,
  mapPropertyPhotoToAdditionalImage,
  mapSlotsToCategories,
  mapGroupedResponseToCategories,
} from '@/components/modules/property-tax/ptis/media/mediaData';

// Import hooks
import { usePhotoPlanMutations } from '@/hooks/ptis/photoplan/usePhotoPlanMutations';

// Import components
import PropertyMediaPanel from '@/components/modules/property-tax/ptis/media/PropertyMediaPanel';
import { PhotoPlanDrawer } from '@/components/modules/property-tax/ptis/media/PhotoPlanDrawer';
import { PhotoPlanNamingModal } from '@/components/modules/property-tax/ptis/media/PhotoPlanNamingModal';
import type { PhotoCategory } from '@/components/modules/property-tax/ptis/media/PhotoPlanSidebar';
import { ImageWithFallback } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';
import { MainImageViewer } from '@/components/modules/property-tax/ptis/media/MainImageViewer';

describe('PhotoPlan Section - Complete Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    if (typeof window !== 'undefined') {
      try {
        Object.defineProperty(window.location, 'assign', {
          configurable: true,
          writable: true,
          value: vi.fn(),
        });
      } catch {
        vi.stubGlobal('location', {
          ...window.location,
          assign: vi.fn(),
        });
      }
    }
  });



  describe('mediaData transformations', () => {
    it('formats photo plan payload successfully into FormData', () => {
      const file = new File(['hello'], 'hello.png', { type: 'image/png' });
      const categories = [
        {
          photoTypeCode: 'FRONT',
          images: [
            {
              file,
              displayOrder: 1,
              remarks: 'My Front Elevation',
              title: 'Front View',
            },
          ],
        },
      ];
      const formData = formatPhotoPlanPayload(categories);
      expect(formData.get('files[FRONT]')).toBeInstanceOf(File);
      expect(formData.get('metadata[FRONT][0][displayOrder]')).toBe('1');
      expect(formData.get('metadata[FRONT][0][remarks]')).toBe('My Front Elevation');
      expect(formData.get('metadata[FRONT][0][title]')).toBe('Front View');
    });

    it('maps property photo to additional image details', () => {
      const p1 = {
        propertyId: 1,
        propertyPhotoId: 101,
        photoTypeId: 1,
        photoTypeCode: 'FRONT',
        photoTypeName: 'Front Elevation',
        remarks: 'Custom Title | Custom Remark details',
        displayOrder: 2,
        documentGuid: '123-guid',
        viewUrl: 'http://test.url/view',
      };
      const img1 = mapPropertyPhotoToAdditionalImage(p1, 'Default Category');
      expect(img1.title).toBe('Custom Title');
      expect(img1.remarks).toBe('Custom Remark details');
      expect(img1.src).toBe('/api/documents/123-guid/view');

      const p2 = {
        propertyId: 1,
        propertyPhotoId: 102,
        photoTypeId: 2,
        photoTypeCode: 'OTHER',
        photoTypeName: 'Other',
        remarks: 'Only Remark Without Pipe',
        displayOrder: 3,
        documentGuid: '456-guid',
      };
      const img2 = mapPropertyPhotoToAdditionalImage(p2, 'Other Category');
      expect(img2.title).toBe('Only Remark Without Pipe');
      expect(img2.remarks).toBe('');
      expect(img2.src).toContain('/api/documents/456-guid/view');
    });

    it('maps slots to categories correctly', () => {
      const slots = [
        {
          photoTypeId: 1,
          photoTypeCode: 'FRONT',
          photoTypeName: 'Front Elevation',
          hasPhoto: true,
          photoCount: 1,
          propertyPhotoId: 101,
          documentGuid: '123-guid',
        },
        {
          photoTypeId: 2,
          photoTypeCode: 'CUSTOM_SLOT',
          photoTypeName: 'Custom View',
          hasPhoto: false,
          photoCount: 0,
        },
        {
          photoTypeId: 13,
          photoTypeCode: 'PHOTO_PLAN',
          photoTypeName: 'Photo Plan',
          hasPhoto: false,
          photoCount: 0,
        },
      ];

      const uploadedPhotos = [
        {
          propertyId: 1,
          propertyPhotoId: 101,
          photoTypeId: 1,
          photoTypeCode: 'FRONT',
          photoTypeName: 'Front Elevation',
          remarks: 'Front | Remark',
          displayOrder: 1,
          documentGuid: '123-guid',
        },
      ];

      const categories = mapSlotsToCategories(slots, uploadedPhotos);
      expect(categories.length).toBe(4);
      expect(categories[0]?.isCustom).toBe(false);
      expect(categories[1]?.isCustom).toBe(true);
      expect(categories[2]?.photoTypeCode).toBe('PHOTO_PLAN');
      expect(categories[3]?.photoTypeCode).toBe('CHANGE_DETECTION');
      expect(categories[0]?.images.length).toBe(1);
    });

    it('filters out property-scope slots for wing master building, but keeps them for inner unit properties', () => {
      const slots: PropertyPhotoTypeWithStatusDto[] = [
        { photoTypeId: 1, photoTypeCode: 'PROPERTY_FRONT', photoTypeName: 'Property Front Photo', displayOrder: 1, hasPhoto: false, photoCount: 0 },
        { photoTypeId: 2, photoTypeCode: 'PROPERTY_SIDE', photoTypeName: 'Property Side Photo', displayOrder: 2, hasPhoto: false, photoCount: 0 },
        { photoTypeId: 3, photoTypeCode: 'PROPERTY_PLAN', photoTypeName: 'Property Plan', displayOrder: 3, hasPhoto: false, photoCount: 0 },
        { photoTypeId: 4, photoTypeCode: 'WING_BUILDING', photoTypeName: 'Wing Building Photo', displayOrder: 4, hasPhoto: false, photoCount: 0 },
        { photoTypeId: 5, photoTypeCode: 'WING_PLACE', photoTypeName: 'Wing Place Photo', displayOrder: 5, hasPhoto: false, photoCount: 0 },
      ];

      // Master Wing building (isMainProperty = true, categoryId = 4) filters out property-scope slots
      const masterCategories = mapSlotsToCategories(slots, [], undefined, undefined, 'A Wing', 1530423, true, 4);
      expect(masterCategories.some(c => c.photoTypeCode === 'PROPERTY_FRONT')).toBe(false);
      expect(masterCategories.some(c => c.photoTypeCode === 'PROPERTY_SIDE')).toBe(false);
      expect(masterCategories.some(c => c.photoTypeCode === 'PROPERTY_PLAN')).toBe(false);
      expect(masterCategories.some(c => c.photoTypeCode === 'WING_BUILDING')).toBe(true);
      expect(masterCategories.some(c => c.photoTypeCode === 'WING_PLACE')).toBe(true);
      expect(masterCategories.some(c => c.photoTypeCode === 'CHANGE_DETECTION')).toBe(true);

      // Inner unit property (isMainProperty = false, categoryId = 4) hides property-scope slots on apartment/wing screen
      const innerUnitCategories = mapSlotsToCategories(slots, [], undefined, undefined, 'A Wing', 1530423, false, 4);
      expect(innerUnitCategories.some(c => c.photoTypeCode === 'PROPERTY_FRONT')).toBe(false);
      expect(innerUnitCategories.some(c => c.photoTypeCode === 'PROPERTY_SIDE')).toBe(false);
      expect(innerUnitCategories.some(c => c.photoTypeCode === 'PROPERTY_PLAN')).toBe(false);
      expect(innerUnitCategories.some(c => c.photoTypeCode === 'WING_BUILDING')).toBe(true);
    });

    it('isolates wing photos by selectedWingDetailId when multiple wings exist', () => {
      const slots: PropertyPhotoTypeWithStatusDto[] = [
        { photoTypeId: 8, photoTypeCode: 'WING_BUILDING_PHOTO', photoTypeName: 'Wing Building Photo', displayOrder: 1, hasPhoto: true, photoCount: 1 },
      ];

      const uploadedPhotos: PropertyPhotoDto[] = [
        { propertyId: 1, propertyPhotoId: 8169, photoTypeId: 8, photoTypeCode: 'WING_BUILDING_PHOTO', photoTypeName: 'Wing Building Photo', wingDetailId: 1530421, wingName: 'A', displayOrder: 1, viewUrl: '/img-a.jpg' },
        { propertyId: 1, propertyPhotoId: 8170, photoTypeId: 8, photoTypeCode: 'WING_BUILDING_PHOTO', photoTypeName: 'Wing Building Photo', wingDetailId: 1530422, wingName: 'B', displayOrder: 1, viewUrl: '/img-b.jpg' },
        { propertyId: 1, propertyPhotoId: 8171, photoTypeId: 8, photoTypeCode: 'WING_BUILDING_PHOTO', photoTypeName: 'Wing Building Photo', wingDetailId: 1530423, wingName: 'C', displayOrder: 1, viewUrl: '/img-c.jpg' },
      ];

      // Select Wing A (1530421)
      const categoriesWingA = mapSlotsToCategories(slots, uploadedPhotos, undefined, undefined, 'A', 1530421);
      const wingCatA = categoriesWingA.find(c => c.photoTypeId === 8);
      expect(wingCatA).toBeDefined();
      expect(wingCatA?.images.length).toBe(1);
      expect(wingCatA?.images[0]?.propertyPhotoId).toBe(8169);
      expect(wingCatA?.images[0]?.wingDetailId).toBe(1530421);

      // Select Wing B (1530422)
      const categoriesWingB = mapSlotsToCategories(slots, uploadedPhotos, undefined, undefined, 'B', 1530422);
      const wingCatB = categoriesWingB.find(c => c.photoTypeId === 8);
      expect(wingCatB).toBeDefined();
      expect(wingCatB?.images.length).toBe(1);
      expect(wingCatB?.images[0]?.propertyPhotoId).toBe(8170);
      expect(wingCatB?.images[0]?.wingDetailId).toBe(1530422);
    });

    it('maps grouped response to categories correctly', () => {
      const groupedData = {
        propertyId: 1,
        totalPhotos: 1,
        photoTypes: [
          {
            photoTypeId: 1,
            photoTypeCode: 'FRONT',
            photoTypeName: 'Front Elevation',
            hasPhoto: true,
            photoCount: 1,
            photos: [
              {
                propertyId: 1,
                propertyPhotoId: 101,
                photoTypeId: 1,
                photoTypeCode: 'FRONT',
                photoTypeName: 'Front Elevation',
                remarks: 'Group Front',
                displayOrder: 2,
              },
            ],
          },
        ],
      };

      const categories = mapGroupedResponseToCategories(groupedData);
      expect(categories.length).toBe(1);
      expect(categories[0]?.images.length).toBe(1);
    });
  });



  describe('usePhotoPlanMutations hook', () => {
    let categories: PhotoCategory[];
    let onCategoriesChange: (cats: PhotoCategory[]) => void;

    beforeEach(() => {
      categories = [
        {
          photoTypeId: 1,
          photoTypeCode: 'FRONT',
          photoTypeName: 'Front View',
          images: [
            {
              propertyPhotoId: 101,
              photoTypeId: 1,
              photoTypeCode: 'FRONT',
              src: 'img1.png',
              fullSrc: 'img1.png',
              title: 'Front View',
              alt: 'Front View',
              displayOrder: 1,
              documentGuid: '123-guid',
            },
          ],
        },
      ];
      onCategoriesChange = vi.fn();
    });

    it('triggers naming modal on handleAddPhoto', () => {
      const setSelectedImageIndex = vi.fn();
      const setViewMode = vi.fn();
      const { result } = renderHook(() =>
        usePhotoPlanMutations({
          propertyId: 1,
          categories,
          onCategoriesChange,
          selectedCategoryIndex: 0,
          selectedImageIndex: null,
          setSelectedImageIndex,
          viewMode: 'grid',
          setViewMode,
        })
      );

      act(() => {
        result.current.handleAddPhoto();
      });
      expect(result.current.isNamingOpen).toBe(true);
      expect(result.current.isReplacement).toBe(false);
    });

    it('triggers replace confirmations, action call, and state updates', async () => {
      mockReplacePropertyPhotoAction.mockResolvedValueOnce({
        success: true,
        data: { viewUrl: 'new_url.png', propertyPhotoId: 101 },
      });
      mockConfirm.mockImplementationOnce(({ onConfirm }) => onConfirm());

      const setSelectedImageIndex = vi.fn();
      const setViewMode = vi.fn();
      const { result } = renderHook(() =>
        usePhotoPlanMutations({
          propertyId: 1,
          categories,
          onCategoriesChange,
          selectedCategoryIndex: 0,
          selectedImageIndex: null,
          setSelectedImageIndex,
          viewMode: 'grid',
          setViewMode,
        })
      );

      act(() => {
        result.current.handleReplacePhoto(0);
      });
      expect(result.current.isReplacement).toBe(true);
      expect(result.current.isNamingOpen).toBe(true);

      const file = new File(['foo'], 'foo.png', { type: 'image/png' });
      await act(async () => {
        await result.current.handleNamingSubmit('Category 1', 1, 101, file, 'remarks');
      });

      expect(mockReplacePropertyPhotoAction).toHaveBeenCalled();
      expect(onCategoriesChange).toHaveBeenCalled();
    });

    it('handles file submit with upload successfully', async () => {
      mockUploadPropertyPhotoAction.mockResolvedValueOnce({
        success: true,
        data: { propertyPhotoId: 102, viewUrl: 'uploaded.png' },
      });

      const setSelectedImageIndex = vi.fn();
      const setViewMode = vi.fn();
      const { result } = renderHook(() =>
        usePhotoPlanMutations({
          propertyId: 1,
          categories,
          onCategoriesChange,
          selectedCategoryIndex: 0,
          selectedImageIndex: null,
          setSelectedImageIndex,
          viewMode: 'grid',
          setViewMode,
        })
      );

      const file = new File(['bar'], 'bar.png', { type: 'image/png' });
      await act(async () => {
        await result.current.handleNamingSubmit('New Slot Photo', 2, 1, file, 'remark');
      });

      expect(mockUploadPropertyPhotoAction).toHaveBeenCalled();
      expect(onCategoriesChange).toHaveBeenCalled();
    });

    it('handles delete photo operations', async () => {
      mockDeletePropertyPhotoAction.mockResolvedValueOnce({ success: true });

      const setSelectedImageIndex = vi.fn();
      const setViewMode = vi.fn();
      const { result } = renderHook(() =>
        usePhotoPlanMutations({
          propertyId: 1,
          categories,
          onCategoriesChange,
          selectedCategoryIndex: 0,
          selectedImageIndex: 0,
          setSelectedImageIndex,
          viewMode: 'viewer',
          setViewMode,
        })
      );

      await act(async () => {
        await result.current.handleDeletePhoto(0);
      });

      expect(mockDeletePropertyPhotoAction).toHaveBeenCalledWith('123-guid', 'en');
      expect(setSelectedImageIndex).toHaveBeenCalledWith(null);
      expect(setViewMode).toHaveBeenCalledWith('grid');
      expect(onCategoriesChange).toHaveBeenCalled();
    });
  });

  describe('ImageWithFallback component', () => {
    it('renders loader skeleton, fallback placeholder on failure, and custom onError events', async () => {
      const { rerender } = render(<ImageWithFallback src="" alt="Test fallback description" fallbackSrc="" />);
      expect(screen.getByLabelText('Test fallback description')).toBeInTheDocument();

      await act(async () => {
        rerender(<ImageWithFallback src="valid.png" alt="Valid alt text" />);
        await Promise.resolve();
      });
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'valid.png');

      await act(async () => {
        fireEvent.error(img);
      });
      expect(screen.getByLabelText('Valid alt text')).toBeInTheDocument();
    });
  });

  describe('MainImageViewer component', () => {
    it('renders main image viewer with applied rotation styles', () => {
      render(<MainImageViewer src="photo.png" alt="Photo alt text" rotation={90} />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.parentElement).toHaveStyle('transform: rotate(90deg)');
    });
  });

  describe('PropertyMediaPanel component', () => {
    const slots = [
      { photoTypeId: 1, photoTypeCode: 'FRONT', photoTypeName: 'Front View', hasPhoto: true, photoCount: 1, propertyPhotoId: 101, viewUrl: 'front.png' },
      { photoTypeId: 2, photoTypeCode: 'PHOTO_PLAN', photoTypeName: 'Photo Plan', hasPhoto: true, photoCount: 1, propertyPhotoId: 102, viewUrl: 'plan.png' },
      { photoTypeId: 3, photoTypeCode: 'BACK', photoTypeName: 'Rear Elevation', hasPhoto: true, photoCount: 1, propertyPhotoId: 103, viewUrl: 'back.png' },
    ];
    const photos = [
      { propertyPhotoId: 101, propertyId: 1, photoTypeId: 1, photoTypeCode: 'FRONT', photoTypeName: 'Front View', viewUrl: 'front.png' },
      { propertyPhotoId: 104, propertyId: 1, photoTypeId: 1, photoTypeCode: 'FRONT', photoTypeName: 'Front View', viewUrl: 'front2.png' },
      { propertyPhotoId: 102, propertyId: 1, photoTypeId: 2, photoTypeCode: 'PHOTO_PLAN', photoTypeName: 'Photo Plan', viewUrl: 'plan.png' },
      { propertyPhotoId: 103, propertyId: 1, photoTypeId: 3, photoTypeCode: 'BACK', photoTypeName: 'Rear Elevation', viewUrl: 'back.png' },
    ];

    it('renders panel with core photo types and handles show more toggling', async () => {
      render(<PropertyMediaPanel propertyId={1} categoryId={2} initialPhotoSlots={slots} initialPhotos={photos} />);
      
      const frontLabel = screen.getByText('Front View');
      expect(frontLabel).toBeInTheDocument();

      // Show More Button Check
      const toggleMore = screen.getByLabelText('View more images');
      expect(toggleMore).toBeInTheDocument();

      fireEvent.click(toggleMore);
      expect(screen.getByLabelText('Hide more images')).toBeInTheDocument();

      // Clicking main photo type opens drawer in client state
      const frontCardContainer = frontLabel.closest('.group');
      if (frontCardContainer) {
        fireEvent.click(frontCardContainer);
        expect(document.querySelector('.drawer-instance')).toBeInTheDocument();
      }
    });

    it('handles Create click events on the Photo Plan Card and ensures Delete button is not present', async () => {
      const assignMock = vi.fn();
      const originalLocation = window.location;
      delete (window as unknown as Record<string, unknown>).location;
      (window as unknown as Record<string, unknown>).location = {
        href: 'http://localhost:3000/en/property-tax/ptis?wardNo=UK1&propertyNo=182&propertyId=1',
        assign: assignMock,
      };

      mockSearchParamsGet.mockImplementation(() => null);
      mockGetPhotoSlotsAction.mockResolvedValue({ success: true, data: slots });
      mockGetPropertyPhotosAction.mockResolvedValue({ success: true, data: photos });
      mockLaunchPhotoPlanDrawingToolAction.mockResolvedValue({
        success: true,
        data: { launchUrl: 'https://ptisplanapp.tabamc.in/launch?id=1&type=1' },
      });

      render(<PropertyMediaPanel propertyId={1} categoryId={2} type="1" partitionNo="A1" isMainProperty={false} initialPhotoSlots={slots} initialPhotos={photos} />);

      // Create new plan button check
      const createBtn = screen.getByLabelText('Create new plan');
      expect(createBtn).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(createBtn);
        await new Promise((r) => setTimeout(r, 50));
      });

      // It should redirect to drawing tool launch URL
      expect(mockLaunchPhotoPlanDrawingToolAction).toHaveBeenCalled();
      await vi.waitFor(() => {
        expect(assignMock).toHaveBeenCalledWith('https://ptisplanapp.tabamc.in/launch?id=1&type=1');
      });

      // Delete plan button check - should not exist
      const deleteBtn = screen.queryByLabelText('Delete plan');
      expect(deleteBtn).not.toBeInTheDocument();

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('PhotoPlanDrawer & Child Modals/Views', () => {
    const slots = [
      { photoTypeId: 1, photoTypeCode: 'FRONT', photoTypeName: 'Front View', hasPhoto: true, photoCount: 1, propertyPhotoId: 101, viewUrl: 'front.png' },
      { photoTypeId: 2, photoTypeCode: 'CUSTOM', photoTypeName: 'Custom View', hasPhoto: false, photoCount: 0 },
    ];
    const photos = [
      { propertyPhotoId: 101, propertyId: 1, photoTypeId: 1, photoTypeCode: 'FRONT', photoTypeName: 'Front View', viewUrl: 'front.png' },
    ];

    it('renders portal drawer with sidebar folders, grids, naming forms, and validation checks', async () => {
      mockGetPhotosByCategoryAction.mockResolvedValue({
        success: true,
        data: photos,
      });
      mockSearchParamsGet.mockReturnValue('photo-plan');

      const onCategoriesChange = vi.fn();
      const idsChange = vi.fn();
      let renderResult: ReturnType<typeof render>;
      await act(async () => {
        renderResult = render(
          <PhotoPlanDrawer
            open
            onClose={vi.fn()}
            categories={mapSlotsToCategories(slots, photos)}
            onCategoriesChange={onCategoriesChange}
            propertyId={1}
            fullyLoadedIds={new Set([1])}
            onFullyLoadedIdsChange={idsChange}
          />
        );
      });

      // Verify sidebar folder title
      expect(screen.getAllByText(/media.additionalImages/i).length).toBeGreaterThan(0);

      // Verify Category List Folders
      expect(screen.getAllByText('Front View').length).toBeGreaterThan(0);
      expect(screen.getByText('Custom View')).toBeInTheDocument();

      // Rerender with mock selections to trigger viewer mode
      mockSearchParamsGet.mockReturnValue('photo-plan');
      // Trigger grid click to selection
      const frontImages = screen.getAllByRole('img', { name: 'Front View' });
      const imgCard = frontImages[frontImages.length - 1] || frontImages[0];
      if (imgCard) {
        await act(async () => {
          fireEvent.click(imgCard);
        });
      }

      // Toggle drawer closed
      await act(async () => {
        renderResult.rerender(
          <PhotoPlanDrawer
            open={false}
            onClose={vi.fn()}
            categories={[]}
            onCategoriesChange={onCategoriesChange}
            fullyLoadedIds={new Set([1])}
            onFullyLoadedIdsChange={idsChange}
          />
        );
      });
    });

    it('validates naming modal input fields correctly', () => {
      const onSubmit = vi.fn();
      render(
        <PhotoPlanNamingModal
          open
          onClose={vi.fn()}
          onSubmit={onSubmit}
          availableTypes={[{ label: 'Front View', value: '1' }]}
          defaultDisplayOrder={1}
          isEdit
        />
      );

      // Invalid character validation check
      const nameInput = screen.getByLabelText(/media.photoPlanName/i);
      fireEvent.change(nameInput, { target: { value: 'Invalid@Char!' } });

      const saveBtn = screen.getByRole('button', { name: 'actions.save' });
      fireEvent.click(saveBtn);

      expect(screen.getByText('Slot name contains invalid characters')).toBeInTheDocument();
    });

    it('validates naming modal allowed formats, sizes, Devanagari characters, and disabled type dropdown', () => {
      const onSubmit = vi.fn();
      const availableTypes = [{ label: 'Front View', value: '1' }];

      const { container } = render(
        <PhotoPlanNamingModal
          open
          onClose={vi.fn()}
          onSubmit={onSubmit}
          availableTypes={availableTypes}
          defaultDisplayOrder={1}
          defaultPhotoTypeId={1}
          isEdit={false}
          isReplacement={false}
        />
      );

      // 1. Verify dynamic title containing the selected photo type name
      expect(screen.getByText('Add Photo for Front View')).toBeInTheDocument();

      // 2. Verify target slot select dropdown is disabled
      const typeSelect = screen.getByRole('combobox', { name: /media.photoTypeSlot/i });
      expect(typeSelect).toBeDisabled();

      // 3. Verify name validation with Devanagari character (Hindi/Marathi name input)
      const nameInput = screen.getByLabelText(/media.photoPlanName/i);
      fireEvent.change(nameInput, { target: { value: 'मुख्य प्रवेशद्वार' } });

      // 4. Verify validation error on invalid file type (e.g. text file)
      const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' });
      const fileInput = container.querySelector('input[type="file"]')!;
      expect(fileInput).toBeInTheDocument();

      // Select invalid file
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      const saveBtn = screen.getByRole('button', { name: 'actions.save' });
      fireEvent.click(saveBtn);

      expect(screen.getByText('Only JPEG, JPG, and PNG images are allowed')).toBeInTheDocument();

       // 5. Verify validation error on oversized file (e.g. > 5MB) and that the edit button is hidden
       const largeFile = new File(['large_image_content'], 'oversized.png', { type: 'image/png' });
       Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // Mock 6 MB file
 
       fireEvent.change(fileInput, { target: { files: [largeFile] } });
       expect(screen.queryByRole('button', { name: 'media.editImage' })).not.toBeInTheDocument();
       fireEvent.click(saveBtn);
 
       expect(screen.getByText('File size should not exceed 5 MB')).toBeInTheDocument();
 
       // 6. Verify successful submit with valid file, remarks, and Devanagari name
       const validFile = new File(['image_content'], 'photo.png', { type: 'image/png' });
       fireEvent.change(fileInput, { target: { files: [validFile] } });
       expect(screen.getByRole('button', { name: 'media.editImage' })).toBeInTheDocument();
 
       const remarksInput = screen.getByPlaceholderText('media.remarksPlaceholder');
      fireEvent.change(remarksInput, { target: { value: 'Valid remarks' } });

      fireEvent.click(saveBtn);

      expect(onSubmit).toHaveBeenCalledWith(
        'मुख्य प्रवेशद्वार',
        1,
        1,
        validFile,
        'Valid remarks'
      );
    });

    it('validates invalid/corrupted image file and shows warning', () => {
      const onSubmit = vi.fn();
      const availableTypes = [{ label: 'Front View', value: '1' }];

      const { container } = render(
        <PhotoPlanNamingModal
          open
          onClose={vi.fn()}
          onSubmit={onSubmit}
          availableTypes={availableTypes}
          defaultDisplayOrder={1}
          defaultPhotoTypeId={1}
          isEdit={false}
          isReplacement={false}
        />
      );

      // Select corrupted file (we trigger this via a file containing the word 'corrupted' or 'invalid' in URL / name)
      // Spy on URL.createObjectURL to return a mock url containing 'corrupted'
      const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:corrupted-file-guid');

      const corruptedFile = new File(['corrupted image bytes'], 'test.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]')!;
      
      fireEvent.change(fileInput, { target: { files: [corruptedFile] } });

      // Check that the error message is displayed
      expect(screen.getByText('Please upload a valid image file')).toBeInTheDocument();

      // Check that the "Edit Image" button is NOT in the document
      expect(screen.queryByRole('button', { name: 'media.editImage' })).not.toBeInTheDocument();

      const saveBtn = screen.getByRole('button', { name: 'actions.save' });
      expect(saveBtn).toBeDisabled();

      fireEvent.click(saveBtn);
      expect(onSubmit).not.toHaveBeenCalled();

      // Clear the corrupted file and verify the error changes/clears
      const removeBtn = screen.getByTitle(/remove/i);
      fireEvent.click(removeBtn);

      // In non-edit mode, it should clear the invalid image error and show the file required error instead
      expect(screen.queryByText('Please upload a valid image file')).not.toBeInTheDocument();
      expect(screen.getByText('Photo file is required')).toBeInTheDocument();

      createObjectUrlSpy.mockRestore();
    });
  });

  describe('mapSlotsToCategories - Amenity Property', () => {
    it('returns Photo Plan, Amenity Photo, Society slots, and Change Detection for amenity property', () => {
      const slots: PropertyPhotoTypeWithStatusDto[] = [
        { photoTypeId: 1, photoTypeCode: 'PROPERTY_FRONT', photoTypeName: 'Property Front Photo', hasPhoto: false },
        { photoTypeId: 2, photoTypeCode: 'PROPERTY_SIDE', photoTypeName: 'Property Side Photo', hasPhoto: false },
        { photoTypeId: 3, photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo', hasPhoto: false },
        { photoTypeId: 4, photoTypeCode: 'WING_BUILDING', photoTypeName: 'Wing Building Photo', hasPhoto: false },
        { photoTypeId: 14, photoTypeCode: 'AMENITY_PHOTO', photoTypeName: 'Amenity Photo', hasPhoto: false },
        { photoTypeId: 13, photoTypeCode: 'PHOTO_PLAN', photoTypeName: 'Photo Plan', hasPhoto: false },
      ];

      const uploadedPhotos: PropertyPhotoDto[] = [
        {
          propertyPhotoId: 101,
          propertyId: 99,
          photoTypeId: 14,
          photoTypeCode: 'AMENITY_PHOTO',
          photoTypeName: 'Amenity Photo',
          viewUrl: 'http://test.com/amenity.jpg',
        },
        {
          propertyPhotoId: 102,
          propertyId: 99,
          photoTypeId: 4,
          photoTypeCode: 'WING_BUILDING',
          photoTypeName: 'Wing Building Photo',
          wingDetailId: 5,
          viewUrl: 'http://test.com/wing.jpg',
        },
      ];

      // isAmenity triggered by categoryId: 140
      const cats = mapSlotsToCategories(
        slots,
        uploadedPhotos,
        new Set(),
        mockT,
        undefined,
        null,
        false,
        140, // categoryId = 140
        140  // propertyTypeId = 140
      );

      const codes = cats.map(c => c.photoTypeCode);
      expect(codes).toContain('PHOTO_PLAN');
      expect(codes).toContain('AMENITY_PHOTO');
      expect(codes).toContain('CHANGE_DETECTION');
      expect(codes).toContain('SOCIETY_PLACE');

      // Property and wing scopes should NOT be present
      expect(codes).not.toContain('PROPERTY_FRONT');
      expect(codes).not.toContain('PROPERTY_SIDE');
      expect(codes).not.toContain('WING_BUILDING');

      // Check that amenity photo category has only the amenity photo and not wing photo
      const amenityCat = cats.find(c => c.photoTypeCode === 'AMENITY_PHOTO');
      expect(amenityCat).toBeDefined();
      expect(amenityCat?.images).toHaveLength(1);
      expect(amenityCat?.images[0].src).toBe('http://test.com/amenity.jpg');
    });
  });

  describe('mapSlotsToCategories - Individual Property', () => {
    it('only returns Property-scope, Photo Plan, and Change Detection slots for individual property, excluding Society and Wing slots', () => {
      const slots: PropertyPhotoTypeWithStatusDto[] = [
        { photoTypeId: 1, photoTypeCode: 'PROPERTY_FRONT', photoTypeName: 'Property Front Photo', hasPhoto: false },
        { photoTypeId: 2, photoTypeCode: 'PROPERTY_SIDE', photoTypeName: 'Property Side Photo', hasPhoto: false },
        { photoTypeId: 3, photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo', hasPhoto: false },
        { photoTypeId: 4, photoTypeCode: 'WING_BUILDING', photoTypeName: 'Wing Building Photo', hasPhoto: false },
        { photoTypeId: 14, photoTypeCode: 'AMENITY_PHOTO', photoTypeName: 'Amenity Photo', hasPhoto: false },
        { photoTypeId: 13, photoTypeCode: 'PHOTO_PLAN', photoTypeName: 'Photo Plan', hasPhoto: false },
      ];

      const uploadedPhotos: PropertyPhotoDto[] = [
        {
          propertyPhotoId: 201,
          propertyId: 85,
          photoTypeId: 1,
          photoTypeCode: 'PROPERTY_FRONT',
          photoTypeName: 'Property Front Photo',
          viewUrl: 'http://test.com/front.jpg',
        },
      ];

      // isIndividual triggered by categoryId: 2
      const cats = mapSlotsToCategories(
        slots,
        uploadedPhotos,
        new Set(),
        mockT,
        undefined,
        null,
        false,
        2, // categoryId = 2 (Individual)
        12 // propertyTypeId = 12
      );

      const codes = cats.map(c => c.photoTypeCode);
      expect(codes).toContain('PROPERTY_FRONT');
      expect(codes).toContain('PROPERTY_SIDE');
      expect(codes).toContain('PHOTO_PLAN');
      expect(codes).toContain('CHANGE_DETECTION');

      // None of the Society, Wing, or Amenity slots should be present
      expect(codes).not.toContain('SOCIETY_PLACE');
      expect(codes).not.toContain('WING_BUILDING');
      expect(codes).not.toContain('AMENITY_PHOTO');

      // Check that property front category contains the uploaded photo
      const frontCat = cats.find(c => c.photoTypeCode === 'PROPERTY_FRONT');
      expect(frontCat).toBeDefined();
      expect(frontCat?.images).toHaveLength(1);
      expect(frontCat?.images[0].src).toBe('http://test.com/front.jpg');
    });
  });
});


