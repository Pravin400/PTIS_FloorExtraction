export type FileUploadTileStatus = "pending" | "uploading" | "uploaded" | "error";
export type FileUploadTileVariant = "card" | "imageOverlay" | "dropzone";

/** Button/status copy — pass translated strings from the caller; falls back to English. */
export interface FileUploadTileLabels {
  upload?: string;
  uploading?: string;
  replace?: string;
  view?: string;
  delete?: string;
}

export interface FileUploadTileProps {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  status: FileUploadTileStatus;
  fileName?: string;
  /** When provided (and variant is "imageOverlay" or "dropzone"), renders an image preview instead of an icon row. */
  previewUrl?: string;
  errorMessage?: string;
  maxFileSizeMB?: number;
  allowedExtensionsLabel?: string;
  accept?: string;
  variant?: FileUploadTileVariant;
  disabled?: boolean;
  labels?: FileUploadTileLabels;
  onFileSelect: (file: File) => void;
  onDelete?: () => void;
  onView?: () => void;
  isViewing?: boolean;
  onInvalidFile?: (reason: string) => void;
}

export interface FileUploadTileCardProps {
  inputId: string;
  label: string;
  description?: string;
  required?: boolean;
  status: FileUploadTileStatus;
  fileName?: string;
  errorMessage?: string;
  maxFileSizeMB?: number;
  allowedExtensionsLabel: string;
  onView?: () => void;
  onDelete?: () => void;
  isViewing?: boolean;
  labels: Required<FileUploadTileLabels>;
}

export interface FileUploadTileDropzoneProps {
  label: string;
  description?: string;
  previewUrl?: string;
  errorMessage?: string;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDelete?: () => void;
  replaceLabel?: string;
  deleteLabel?: string;
}

export interface FileUploadTileImageOverlayProps {
  label: string;
  description?: string;
  previewUrl?: string;
  errorMessage?: string;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDelete?: () => void;
  replaceLabel?: string;
  deleteLabel?: string;
}
