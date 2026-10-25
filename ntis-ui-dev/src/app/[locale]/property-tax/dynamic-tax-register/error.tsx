'use client';

import { ErrorPage } from '@/components/common';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPage error={error} reset={reset} />;
}
