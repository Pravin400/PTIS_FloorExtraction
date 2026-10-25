import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoPlanMutations } from '@/hooks/ptis/photoplan/usePhotoPlanMutations';
import * as photoPlanActions from '@/app/[locale]/property-tax/ptis/PhotoPlan.action';
import { toast } from 'sonner';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.has = () => true;
    return t;
  },
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const mockConfirm = vi.fn((opts) => opts.onConfirm?.());
vi.mock('@/components/common', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

vi.mock('@/app/[locale]/property-tax/ptis/PhotoPlan.action', () => ({
  uploadPropertyPhotoAction: vi.fn(),
  replacePropertyPhotoAction: vi.fn(),
  deletePropertyPhotoAction: vi.fn(),
}));

describe('usePhotoPlanMutations', () => {
  const mockCategories = [
    {
      photoTypeId: 1,
      photoTypeCode: 'PROPERTY_PHOTO',
      photoTypeName: 'Property Photo',
      photoCount: 1,
      images: [
        {
          src: '/documents/guid-101/view',
          fullSrc: '/documents/guid-101/view',
          alt: 'Property Photo',
          title: 'Property Photo',
          propertyPhotoId: 101,
          photoTypeId: 1,
          photoTypeCode: 'PROPERTY_PHOTO',
          documentGuid: 'guid-101',
        },
      ],
    },
  ];

  const defaultProps = {
    propertyId: 42,
    categories: mockCategories,
    onCategoriesChange: vi.fn(),
    selectedCategoryIndex: 0,
    selectedImageIndex: 0,
    setSelectedImageIndex: vi.fn(),
    viewMode: 'viewer' as const,
    setViewMode: vi.fn(),
    setViewerIndexAndMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes default state and opens naming modal on handleAddPhoto', () => {
    const { result } = renderHook(() => usePhotoPlanMutations(defaultProps));

    expect(result.current.isNamingOpen).toBe(false);
    expect(result.current.isUploading).toBe(false);

    act(() => {
      result.current.handleAddPhoto();
    });

    expect(result.current.isNamingOpen).toBe(true);
    expect(result.current.isReplacement).toBe(false);
  });

  it('opens naming modal for replace mode on handleReplacePhoto', () => {
    const { result } = renderHook(() => usePhotoPlanMutations(defaultProps));

    act(() => {
      result.current.handleReplacePhoto(0);
    });

    expect(result.current.isNamingOpen).toBe(true);
    expect(result.current.isReplacement).toBe(true);
    expect(result.current.replaceImage?.propertyPhotoId).toBe(101);
  });

  it('handles photo upload submission via handleNamingSubmit', async () => {
    vi.mocked(photoPlanActions.uploadPropertyPhotoAction).mockResolvedValueOnce({
      success: true,
      data: { propertyPhotoId: 202, documentGuid: 'new-guid-202', viewUrl: '/view/202' },
    } as unknown as Awaited<ReturnType<typeof photoPlanActions.uploadPropertyPhotoAction>>);

    const onCategoriesChange = vi.fn();
    const { result } = renderHook(() =>
      usePhotoPlanMutations({ ...defaultProps, onCategoriesChange })
    );

    const validFile = new File(['dummy content'], 'new_photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleNamingSubmit(
        'Property Photo',
        1,
        1,
        validFile,
        'Remarks sample'
      );
    });

    expect(photoPlanActions.uploadPropertyPhotoAction).toHaveBeenCalled();
    expect(onCategoriesChange).toHaveBeenCalled();
    expect(result.current.isNamingOpen).toBe(false);
  });

  it('handles photo replacement via handleSaveEditedPhoto', async () => {
    vi.mocked(photoPlanActions.replacePropertyPhotoAction).mockResolvedValueOnce({
      success: true,
      data: { propertyPhotoId: 101, documentGuid: 'guid-101-edited' },
    } as unknown as Awaited<ReturnType<typeof photoPlanActions.replacePropertyPhotoAction>>);

    const { result } = renderHook(() => usePhotoPlanMutations(defaultProps));

    const validFile = new File(['edited content'], 'edited.jpg', { type: 'image/jpeg' });

    let success = false;
    await act(async () => {
      success = await result.current.handleSaveEditedPhoto(0, validFile);
    });

    expect(success).toBe(true);
    expect(photoPlanActions.replacePropertyPhotoAction).toHaveBeenCalled();
  });

  it('shows warning confirmation dialog when trying to add a second plan to a plan slot with 1 existing plan', async () => {
    const planCategories = [
      {
        photoTypeId: 10,
        photoTypeCode: 'PHOTO_PLAN',
        photoTypeName: 'Photo Plan',
        photoCount: 1,
        images: [
          {
            src: '/documents/plan-guid/view',
            fullSrc: '/documents/plan-guid/view',
            alt: 'Existing Plan',
            title: 'Existing Plan',
            propertyPhotoId: 501,
            photoTypeId: 10,
            photoTypeCode: 'PHOTO_PLAN',
            documentGuid: 'plan-guid',
          },
        ],
      },
    ];

    const { result } = renderHook(() =>
      usePhotoPlanMutations({
        ...defaultProps,
        categories: planCategories,
        selectedCategoryIndex: 0,
        isMainProperty: true,
      })
    );

    await act(async () => {
      await result.current.handleAddPhoto();
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'warning',
        title: 'media.addNewPlanTitle',
        description: 'media.addNewPlanDescription',
        confirmText: 'media.addNewPlanConfirm',
      })
    );
    expect(result.current.isNamingOpen).toBe(true);
    expect(result.current.isReplacement).toBe(false);
  });

  it('blocks adding a 3rd plan when 2 plans already exist', async () => {
    const toastWarningSpy = vi.spyOn(toast, 'warning');
    const planCategories = [
      {
        photoTypeId: 10,
        photoTypeCode: 'PHOTO_PLAN',
        photoTypeName: 'Photo Plan',
        photoCount: 2,
        images: [
          {
            src: '/documents/plan-1/view',
            fullSrc: '/documents/plan-1/view',
            alt: 'Plan 1',
            title: 'Plan 1',
            propertyPhotoId: 501,
            photoTypeId: 10,
            photoTypeCode: 'PHOTO_PLAN',
            documentGuid: 'plan-1',
          },
          {
            src: '/documents/plan-2/view',
            fullSrc: '/documents/plan-2/view',
            alt: 'Plan 2',
            title: 'Plan 2',
            propertyPhotoId: 502,
            photoTypeId: 10,
            photoTypeCode: 'PHOTO_PLAN',
            documentGuid: 'plan-2',
          },
        ],
      },
    ];

    const { result } = renderHook(() =>
      usePhotoPlanMutations({
        ...defaultProps,
        categories: planCategories,
        selectedCategoryIndex: 0,
        isMainProperty: true,
      })
    );

    await act(async () => {
      await result.current.handleAddPhoto();
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(toastWarningSpy).toHaveBeenCalledWith('media.maxPlansReached');
  });

  it('shows warning confirmation dialog when handleReplacePhoto is called for a plan slot', () => {
    const planCategories = [
      {
        photoTypeId: 10,
        photoTypeCode: 'PHOTO_PLAN',
        photoTypeName: 'Photo Plan',
        photoCount: 1,
        images: [
          {
            src: '/documents/plan-guid/view',
            fullSrc: '/documents/plan-guid/view',
            alt: 'Existing Plan',
            title: 'Existing Plan',
            propertyPhotoId: 501,
            photoTypeId: 10,
            photoTypeCode: 'PHOTO_PLAN',
            documentGuid: 'plan-guid',
          },
        ],
      },
    ];

    const { result } = renderHook(() =>
      usePhotoPlanMutations({
        ...defaultProps,
        categories: planCategories,
        selectedCategoryIndex: 0,
      })
    );

    act(() => {
      result.current.handleReplacePhoto(0);
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'warning',
        title: 'media.replacePlanTitle',
      })
    );
    expect(result.current.isNamingOpen).toBe(true);
    expect(result.current.isReplacement).toBe(true);
  });

  it('dispatches ptis:sync-thumbnail when an image is uploaded specifically to Society Place Photo', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    vi.mocked(photoPlanActions.uploadPropertyPhotoAction).mockResolvedValueOnce({
      success: true,
      data: { propertyPhotoId: 301, documentGuid: 'society-place-guid', viewUrl: '/view/301' },
    } as unknown as Awaited<ReturnType<typeof photoPlanActions.uploadPropertyPhotoAction>>);

    const societyPlaceCategories = [
      {
        photoTypeId: 15,
        photoTypeCode: 'SOCIETY_PLACE',
        photoTypeName: 'Society Place Photo',
        photoCount: 0,
        images: [],
      },
    ];

    const onCategoriesChange = vi.fn();
    const { result } = renderHook(() =>
      usePhotoPlanMutations({
        ...defaultProps,
        categories: societyPlaceCategories,
        selectedCategoryIndex: 0,
        onCategoriesChange,
      })
    );

    const validFile = new File(['society place img'], 'place.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.handleNamingSubmit('Society Place Photo', 1, 15, validFile);
    });

    const syncCall = dispatchSpy.mock.calls.find(
      ([event]) => (event as CustomEvent).type === 'ptis:sync-thumbnail'
    );
    expect(syncCall).toBeDefined();
    const syncDetail = (syncCall?.[0] as CustomEvent).detail;
    expect(syncDetail.documentGuid).toBe('society-place-guid');
    expect(syncDetail.category).toBe('Society Place Photo');
    expect(onCategoriesChange).toHaveBeenCalled();
  });

  it('does NOT dispatch ptis:sync-thumbnail when an image is uploaded to other categories like Society Board Photo', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    vi.mocked(photoPlanActions.uploadPropertyPhotoAction).mockResolvedValueOnce({
      success: true,
      data: { propertyPhotoId: 302, documentGuid: 'society-board-guid', viewUrl: '/view/302' },
    } as unknown as Awaited<ReturnType<typeof photoPlanActions.uploadPropertyPhotoAction>>);

    const societyBoardCategories = [
      {
        photoTypeId: 16,
        photoTypeCode: 'SOCIETY_BOARD',
        photoTypeName: 'Society Board Photo',
        photoCount: 0,
        images: [],
      },
    ];

    const onCategoriesChange = vi.fn();
    const { result } = renderHook(() =>
      usePhotoPlanMutations({
        ...defaultProps,
        categories: societyBoardCategories,
        selectedCategoryIndex: 0,
        onCategoriesChange,
      })
    );

    const validFile = new File(['society board img'], 'board.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.handleNamingSubmit('Society Board Photo', 1, 16, validFile);
    });

    const syncCalls = dispatchSpy.mock.calls.filter(
      ([event]) => (event as CustomEvent).type === 'ptis:sync-thumbnail'
    );
    expect(syncCalls).toHaveLength(0);
    expect(onCategoriesChange).toHaveBeenCalled();
  });
});
