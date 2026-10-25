import type { PhotoCategory } from '@/components/modules/property-tax/ptis/media/PhotoPlanSidebar';

export type ViewMode = 'grid' | 'viewer' | 'compare';

function defaultModeFor(cat: PhotoCategory | undefined, hasImages: boolean): ViewMode {
  if (cat?.photoTypeCode === 'CHANGE_DETECTION') {
    return hasImages ? 'compare' : 'grid';
  }
  return hasImages ? 'viewer' : 'grid';
}

export function resolveInitialImageIndex(cat: PhotoCategory | undefined, searchParams: URLSearchParams): number | null {
  const hasImages = !!(cat?.images && cat.images.length > 0);
  const val = searchParams.get('selectedImageIndex');
  if (val !== null) {
    const parsed = parseInt(val, 10);
    return !isNaN(parsed) ? parsed : (hasImages ? 0 : null);
  }
  return hasImages ? 0 : null;
}

export function resolveInitialViewMode(cat: PhotoCategory | undefined, searchParams: URLSearchParams): ViewMode {
  const hasImages = !!(cat?.images && cat.images.length > 0);
  const val = searchParams.get('viewMode');
  if (val === 'grid' || val === 'viewer' || val === 'compare') return val;
  return defaultModeFor(cat, hasImages);
}

export function resolveCategorySwitchState(targetCat: PhotoCategory | undefined): { imageIndex: number | null; viewMode: ViewMode } {
  const hasImgs = !!(targetCat?.images && targetCat.images.length > 0);
  return { imageIndex: hasImgs ? 0 : null, viewMode: defaultModeFor(targetCat, hasImgs) };
}

export function resolveResyncState(
  initialCategoryIndex: number,
  categories: PhotoCategory[],
  searchParams: URLSearchParams
): { categoryIndex: number; imageIndex: number | null; viewMode: ViewMode } {
  const targetIndex = initialCategoryIndex >= 0 && initialCategoryIndex < categories.length ? initialCategoryIndex : 0;
  const targetCat = categories[targetIndex];
  const hasImages = !!(targetCat?.images && targetCat.images.length > 0);

  let targetIdx: number | null = hasImages ? 0 : null;
  let targetMode: ViewMode = defaultModeFor(targetCat, hasImages);

  const selParam = searchParams.get('selectedImageIndex');
  if (selParam !== null) {
    const parsed = parseInt(selParam, 10);
    if (!isNaN(parsed)) targetIdx = parsed;
  }
  const modeParam = searchParams.get('viewMode');
  if (modeParam === 'grid' || modeParam === 'viewer' || modeParam === 'compare') targetMode = modeParam;

  return { categoryIndex: initialCategoryIndex, imageIndex: targetIdx, viewMode: targetMode };
}
