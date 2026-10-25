import type { DesignerTemplateVersion } from '@/types/report-designer.types';

export function latestDesignerTemplateVersion(
  versions: readonly DesignerTemplateVersion[],
): DesignerTemplateVersion | undefined {
  const sorted = [...versions].sort((left, right) => right.versionNo - left.versionNo);
  // An older draft must not hide a more recently published layout.
  return sorted.find((version) => ['draft', 'published'].includes(version.status.toLowerCase()))
    ?? sorted[0];
}
