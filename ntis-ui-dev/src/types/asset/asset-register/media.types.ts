export interface PropertyPhotoDto {
  propertyPhotoId: number;
  propertyId: number;
  photoId?: number;
  assetId?: number;
  photoTypeId: number;
  photoTypeCode: string;
  photoTypeName: string;
  displayOrder?: number;
  remarks?: string;
  documentBindingId?: number;
  documentGuid?: string;
  fileName?: string;
  mimeType?: string;
  viewUrl?: string;
  downloadUrl?: string;
}

export interface PropertyPhotoTypeGroupDto {
  photoTypeId: number;
  photoTypeCode: string;
  photoTypeName: string;
  displayOrder?: number;
  hasPhoto: boolean;
  photoCount: number;
  photos: PropertyPhotoDto[];
}

export interface PropertyPhotoGalleryDto {
  propertyId: number;
  totalPhotos: number;
  photoTypes: PropertyPhotoTypeGroupDto[];
}

export interface AssetMediaPanelProps {
  initialPhotos?: PropertyPhotoDto[];
  loading?: boolean;
  alwaysOpen?: boolean;
  togglePanel?: () => void;
}

export interface MediaImageCardProps {
  src: string;
  alt: string;
  label: string;
  fullSrc?: string;
  hoverBorderColor?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  priority?: boolean;
}

export interface ImageWithFallbackProps {
  src: string;
  alt?: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  style?: React.CSSProperties;
}

export interface ImageHoverPreviewProps {
  src: string;
  src2?: string;
  title: string;
  visible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface GroupedAssetPhotoItem {
  photoId?: number;
  propertyPhotoId?: number;
  assetId?: number;
  propertyId?: number;
  photoTypeId?: number;
  photoTypeCode?: string;
  photoTypeName?: string;
  displayOrder?: number;
  remarks?: string;
  viewUrl?: string;
  documentGuid?: string;
}

export interface GroupedAssetPhotoType {
  photos?: GroupedAssetPhotoItem[];
}

export interface GroupedAssetPhotos {
  photoTypes?: GroupedAssetPhotoType[];
}
