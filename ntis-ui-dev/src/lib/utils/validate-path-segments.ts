/**
 * Validates path segments to prevent directory traversal.
 * Rejects any segments containing '.', '..', path separators, or illegal characters.
 */
export function validatePathSegments(
  pathSegments: string[]
): { isValid: boolean; sanitizedPath?: string } {
  if (!pathSegments || pathSegments.length === 0) return { isValid: false };

  for (const segment of pathSegments) {
    if (!segment) return { isValid: false };
    let decoded = segment;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return { isValid: false };
    }
    if (
      decoded === '.' ||
      decoded === '..' ||
      decoded.includes('..') ||
      decoded.includes('/') ||
      decoded.includes('\\')
    ) {
      return { isValid: false };
    }
    if (!/^[a-zA-Z0-9_\-.%~]+$/.test(decoded)) return { isValid: false };
  }

  return { isValid: true, sanitizedPath: pathSegments.join('/') };
}
