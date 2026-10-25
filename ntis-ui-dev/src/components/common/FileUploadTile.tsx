'use client';
import type {
  FileUploadTileStatus,
  FileUploadTileVariant,
  FileUploadTileLabels,
  FileUploadTileProps,
} from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { FileUploadTileStatus, FileUploadTileVariant, FileUploadTileLabels, FileUploadTileProps };

import React, { useRef } from "react";
import { toast } from "sonner";
import {
  ALLOWED_ASSET_FILE_ACCEPT,
  ALLOWED_ASSET_FILE_EXTENSIONS_LABEL,
  isAllowedAssetFileExtension,
} from "@/lib/constants/asset/file-upload.constants";
import { FileUploadTileImageOverlay } from "./FileUploadTileImageOverlay";
import { FileUploadTileCard } from "./FileUploadTileCard";
import { FileUploadTileDropzone } from "./FileUploadTileDropzone";




/** Button/status copy — pass translated strings from the caller; falls back to English. */


const DEFAULT_LABELS: Required<FileUploadTileLabels> = {
  upload: "Upload",
  uploading: "Uploading",
  replace: "Replace",
  view: "View",
  delete: "Delete",
};



/**
 * Shared upload tile for asset photos/documents across the wizard. Handles the
 * hidden file input + extension validation; delegates visible chrome to a
 * per-variant presentational component.
 */
export function FileUploadTile({
  id,
  label,
  description,
  required,
  status,
  fileName,
  previewUrl,
  errorMessage,
  maxFileSizeMB,
  allowedExtensionsLabel = ALLOWED_ASSET_FILE_EXTENSIONS_LABEL,
  accept = ALLOWED_ASSET_FILE_ACCEPT,
  variant = "card",
  disabled,
  labels: labelsProp,
  onFileSelect,
  onDelete,
  onView,
  isViewing,
  onInvalidFile = (reason) => toast.error(reason),
}: FileUploadTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `file-upload-tile-${id}`;
  const labels = { ...DEFAULT_LABELS, ...labelsProp };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedAssetFileExtension(file.name)) {
      onInvalidFile(`Invalid file type. Allowed: ${allowedExtensionsLabel}`);
      e.target.value = "";
      return;
    }
    onFileSelect(file);
  };

  // Clears the internal input's value on delete so re-selecting the same
  // file afterwards still fires a change event (the DOM won't fire one if
  // the value is unchanged).
  const handleDelete = onDelete
    ? () => {
      if (inputRef.current) inputRef.current.value = "";
      onDelete();
    }
    : undefined;

  const hiddenInput = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      onChange={handleFileChange}
      accept={accept}
      className="hidden"
      disabled={disabled}
    />
  );

  if (variant === "imageOverlay") {
    return (
      <>
        {hiddenInput}
        <FileUploadTileImageOverlay
          label={label}
          description={description}
          previewUrl={previewUrl}
          errorMessage={errorMessage}
          disabled={disabled}
          inputRef={inputRef}
          onDelete={handleDelete}
          replaceLabel={labels.replace}
          deleteLabel={labels.delete}
        />
      </>
    );
  }

  if (variant === "dropzone") {
    return (
      <>
        {hiddenInput}
        <FileUploadTileDropzone
          label={label}
          description={description}
          previewUrl={previewUrl}
          errorMessage={errorMessage}
          disabled={disabled}
          inputRef={inputRef}
          onDelete={handleDelete}
          replaceLabel={labels.replace}
          deleteLabel={labels.delete}
        />
      </>
    );
  }

  return (
    <>
      {hiddenInput}
      <FileUploadTileCard
        inputId={inputId}
        label={label}
        description={description}
        required={required}
        status={status}
        fileName={fileName}
        errorMessage={errorMessage}
        maxFileSizeMB={maxFileSizeMB}
        allowedExtensionsLabel={allowedExtensionsLabel}
        onView={onView}
        onDelete={handleDelete}
        isViewing={isViewing}
        labels={labels}
      />
    </>
  );
}

export default FileUploadTile;
