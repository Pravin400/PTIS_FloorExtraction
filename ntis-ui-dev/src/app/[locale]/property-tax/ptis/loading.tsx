import { PtisPageSkeleton } from '@/components/modules/property-tax/ptis/shared/PtisPageSkeleton';

/**
 * PtisTabSkeleton
 * Reusable loading fallback used by Suspense in PtisMainScreen for each tab section
 * (Rateable, Capital, Dual Method).
 */
export function PtisTabSkeleton() {
  return <PtisPageSkeleton />;
}

/**
 * PtisLoading (default export)
 * Next.js route-level loading boundary for the PTIS module.
 * Returning null allows pages to load progressively with localized section skeletons.
 */
export default function PtisLoading(): null {
  return null;
}


