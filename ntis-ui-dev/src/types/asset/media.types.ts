import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';
export type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto };
export interface AssetPhotoDiskMatchItem {
  fileName?: string;
  filePath?: string;
  url?: string;
  viewUrl?: string;
  downloadUrl?: string;
  size?: number;
  [key: string]: unknown;
}

export interface PropertyMediaPanelProps {
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  propertyHolderName?: string;
  propertyHolderNameMarathi?: string;
  isQCApproved?: boolean;
  propertyId?: number;
  initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
  initialPhotos?: PropertyPhotoDto[];
  loading?: boolean;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: File | number) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: AdditionalImage, index?: number) => void;
  onDbPhotoRemoved?: (propertyPhotoId: number) => void;
  readOnly?: boolean;
  alwaysOpen?: boolean;
}

export interface PhotoPlanViewerProps {
  categoryName: string;
  images: AdditionalImage[];
  selectedImageIndex: number;
  onBackToGrid: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDownload: () => void;
  onUpload: () => void;
  onReplace: (index: number) => void;
  onDelete: (index: number) => void;
  isAdding?: boolean;
  isReplacing?: boolean;
  isDeleting?: boolean;
  readOnly?: boolean;
}

export interface PhotoPlanToolbarProps {
  title: string;
  currentIndex: number;
  totalCount: number;
  hasImage: boolean;
  onDownload: () => void;
  onUpload: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  isAdding?: boolean;
  isReplacing?: boolean;
  isDeleting?: boolean;
  readOnly?: boolean;
}

export interface PhotoCategory {
  photoTypeId: number;
  photoTypeCode: string;
  photoTypeName: string;
  images: AdditionalImage[];
  isCustom?: boolean;
  photoCount?: number;
  hasPhoto?: boolean;
}

export interface PhotoPlanSidebarProps {
  categories: PhotoCategory[];
  selectedCategoryIndex: number;
  onSelectCategory: (index: number) => void;
  title: string;
  isLoading?: boolean;
}

export interface PhotoPlanNamingModalProps {
  open: boolean; onClose: () => void;
  onSubmit: (name: string, displayOrder: number, photoTypeId: number, file?: File, remarks?: string) => void;
  availableTypes: { label: string; value: string }[];
  defaultDisplayOrder: number; defaultName?: string; isReplacement?: boolean;
  defaultPhotoTypeId?: number; isEdit?: boolean; defaultRemarks?: string; isLoading?: boolean;
  photoTypeCode?: string;
}

export interface PhotoPlanModalsProps {
  isNamingOpen: boolean;
  onCloseNaming: () => void;
  activeCategoryName: string;
  activeCategoryTypeId: number;
  activeCategoryTypeCode?: string;
  activeCategoryImagesLength: number;
  activeCategoryImagesMaxOrder: number;
  isReplacement: boolean;
  isPhotoUploading: boolean;
  handleNamingSubmit: (
    name: string,
    order: number,
    typeId: number,
    file?: File,
    remarks?: string
  ) => void;
  replaceImage: AdditionalImage | null;
}

export interface PhotoPlanGridProps {
  categoryName: string;
  images: AdditionalImage[];
  onSelectImage: (index: number) => void;
  onAddPhoto: () => void;
  onDeletePhoto: (index: number) => void;
  onReplacePhoto: (index: number) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  photoCount?: number;
  hideHeader?: boolean;
  className?: string;
  isCarouselMode?: boolean;
  selectedImageIndex?: number | null;
  photoTypeCode?: string;
  onCompare?: () => void;
  readOnly?: boolean;
}

export interface PhotoPlanDrawerBodyProps {
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  initialCategoryIndex?: number;
  propertyId?: number;
  fullyLoadedIds?: Set<number>;
  onFullyLoadedIdsChange?: (ids: Set<number>) => void;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: File | number) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: AdditionalImage, index?: number) => void;
  readOnly?: boolean;
  onDbPhotoRemoved?: (propertyPhotoId: number) => void;
}

export interface PhotoPlanDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: PhotoCategory[];
  onCategoriesChange?: (categories: PhotoCategory[]) => void;
  wardNo?: string;
  propertyNo?: string;
  initialCategoryIndex?: number;
  propertyId?: number;
  fullyLoadedIds?: Set<number>;
  onFullyLoadedIdsChange?: (ids: Set<number>) => void;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, fileOrIndex: File | number) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: AdditionalImage, index?: number) => void;
  readOnly?: boolean;
  onDbPhotoRemoved?: (propertyPhotoId: number) => void;
}

export interface PhotoPlanCarouselProps {
  images: AdditionalImage[];
  selectedImageIndex: number | null;
  onSelectImage: (index: number) => void;
  onAddPhoto: () => void;
  onDeletePhoto: (index: number) => void;
  onReplacePhoto: (index: number) => void;
  className?: string;
  readOnly?: boolean;
}

export interface AdditionalImage {
  src: string;
  fullSrc: string;
  alt: string;
  title: string;
  isCustom?: boolean;
  isNamed?: boolean;
  photoTypeId?: number;
  photoTypeCode?: string;
  propertyPhotoId?: number;
  hasPhoto?: boolean;
  remarks?: string;
  displayOrder?: number;
  file?: File;
  documentGuid?: string;
  downloadUrl?: string;
  fileName?: string;
  photoTypeName?: string;
}

export interface MediaImageCardProps {
  src: string;
  alt: string;
  label: string;
  fullSrc?: string;
  badgeText?: string;
  hoverBorderColor?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children?: React.ReactNode;
  priority?: boolean;
}

export interface AdditionalImagesGridProps {
  images: AdditionalImage[];
  onImageClick?: (index: number) => void;
  onImageHover?: (src: string, title: string) => void;
  onImageLeave?: () => void;
  onClose?: () => void;
}

export interface MainImageViewerProps {
  src: string;
  alt: string;
  rotation: number;
}

export interface ImageWithFallbackProps {
  src: string;
  initialResolvedSrc?: string;
  documentGuid?: string;
  alt?: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  hideErrorBanner?: boolean;
  style?: React.CSSProperties;
  hasPhoto?: boolean;
  emptyLabel?: string;
}

export interface ImageHoverPreviewProps {
  src: string;
  src2?: string;
  title: string;
  visible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  containerId?: string;
  targetRef?: React.RefObject<HTMLElement | null>;
}

export interface BackendPhotoResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  items: T;
  errors?: string[];
}

export interface UnifiedMediaItem {
  id: string;
  url: string;
  label: string;
  type: 'photo' | 'plan';
  source: 'db' | 'disk';
  photoTypeId?: number;
  photoTypeName?: string;
  photoTypeCode?: string;
  bindingPurpose?: string;
  documentGuid?: string;
  fileName?: string;
}

export interface UnifiedDocumentItem {
  id: string;
  url: string;
  name: string;
  documentTypeName: string;
  bindingPurpose?: string;
  documentDefinitionName?: string;
  documentDefinitionId?: number;
  documentName?: string;
  contentType: string;
  isPdf: boolean;
  fileSize?: number;
  uploadedDate?: string;
  source: 'db' | 'disk';
}

export interface UnifiedAssetMediaResult {
  assetId: number;
  upic: string;
  photos: UnifiedMediaItem[];
  plans: UnifiedMediaItem[];
  documents: UnifiedDocumentItem[];
  counts: {
    photoCount: number;
    planCount: number;
    pdfCount: number;
    docCount: number;
    totalCount: number;
  };
  primaryPhotoUrl?: string;
  primaryPlanUrl?: string;
}
