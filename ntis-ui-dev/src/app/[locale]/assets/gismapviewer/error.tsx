'use client';

import { ErrorPage } from '@/components/common';
import type { GisErrorPageProps } from '@/types/asset-gis.types';

export default function Error({ error, reset }: GisErrorPageProps) {
  return (
    <ErrorPage error={error} reset={reset} />
  );
}
