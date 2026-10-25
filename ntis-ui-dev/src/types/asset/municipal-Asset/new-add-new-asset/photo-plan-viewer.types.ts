import type { PhotoCategory, AdditionalImage } from '@/types/asset/media.types';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';

export type ViewMode = 'all' | 'photo' | 'plan' | 'grid' | 'viewer' | 'compare';

export interface UsePhotoPlanReplaceMutationProps {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

export interface UsePhotoPlanDeleteProps {
  propertyId?: number;
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  selectedCategoryIndex: number;
  selectedImageIndex: number | null;
  viewMode: 'grid' | 'viewer' | 'compare';
  setViewerIndexAndModeValue: (idx: number | null, mode: 'grid' | 'viewer' | 'compare') => void;
  locale: string;
  t: (key: string) => string;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: File | number) => void;
  onDbPhotoRemoved?: (propertyPhotoId: number) => void;
}

export interface UsePhotoPlanDrawerStateProps {
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  propertyId?: number;
  initialCategoryIndex?: number;
  fullyLoadedIds: Set<number>;
  onFullyLoadedIdsChange: (ids: Set<number>) => void;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: File | number) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: AdditionalImage, index?: number) => void;
  onDbPhotoRemoved?: (propertyPhotoId: number) => void;
}

export interface UsePhotoPlanMutationsProps {
  propertyId?: number;
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  selectedCategoryIndex: number;
  selectedImageIndex: number | null;
  setSelectedImageIndex?: (index: number | null) => void;
  viewMode: 'grid' | 'viewer' | 'compare';
  setViewMode?: (mode: 'grid' | 'viewer' | 'compare') => void;
  setViewerIndexAndMode?: (index: number | null, mode: 'grid' | 'viewer' | 'compare') => void;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: File | number) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: AdditionalImage, index?: number) => void;
  onDbPhotoRemoved?: (propertyPhotoId: number) => void;
}

export interface UsePropertyMediaProps {
  initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
  initialPhotos?: PropertyPhotoDto[];
  propertyId?: number;
}

export interface UseNAPropertyMediaProps {
  initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
  initialPhotos?: PropertyPhotoDto[];
  propertyId?: number;
}

export interface ChangeDetectionCardProps {
  beforeImageSrc?: string;
  afterImageSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface GisMapCardProps {
  image?: AdditionalImage;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface PhotoCategoryPayloadInput {
  photoTypeCode: string;
  images: {
    file?: File;
    displayOrder?: number;
    remarks?: string;
    title?: string;
  }[];
}

