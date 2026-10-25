export const ALLOWED_ASSET_FILE_EXTENSIONS = [
  ".bmp", ".doc", ".docx", ".gif", ".jpeg", ".jpg", ".pdf",
  ".png", ".ppt", ".pptx", ".tif", ".tiff", ".txt", ".webp", ".xls", ".xlsx",
] as const;

export const ALLOWED_ASSET_FILE_ACCEPT = ALLOWED_ASSET_FILE_EXTENSIONS.join(",");
export const ALLOWED_ASSET_FILE_EXTENSIONS_LABEL = ALLOWED_ASSET_FILE_EXTENSIONS.join(", ");

export function isAllowedAssetFileExtension(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return (ALLOWED_ASSET_FILE_EXTENSIONS as readonly string[]).includes(ext);
}
