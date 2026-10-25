'use client';

import { ErrorPage } from '@/components/common';

export default function InventoryModelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
